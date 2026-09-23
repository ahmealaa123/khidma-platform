import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const statusLabels: Record<string, string> = {
  created: "Created",
  confirmed: "Confirmed",
  searching_agent: "Searching for Agent",
  agent_assigned: "Agent Assigned",
  going_to_pickup: "Going to Pickup",
  arrived_at_pickup: "Arrived at Pickup",
  item_collected: "Item Collected",
  on_the_way: "On the Way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function formatServiceType(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getStatusClasses(status: string) {
  if (status === "delivered") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "cancelled") {
    return "bg-red-100 text-red-700";
  }

  if (status === "searching_agent") {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-cyan-100 text-cyan-700";
}

function formatDate(date: string) {
  return new Date(date).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/admin/login");
  }

  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select(
      `
        id,
        service_type,
        status,
        total_amount,
        created_at
      `
    )
    .order("created_at", {
      ascending: false,
    });

  if (ordersError) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <h1 className="text-lg font-bold text-red-800">
              Unable to load analytics
            </h1>

            <p className="mt-2 text-sm text-red-700">
              {ordersError.message}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const allOrders = orders ?? [];

  const { count: customers } = await supabase
    .from("profiles")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("role", "customer");

  const { count: approvedAgents } = await supabase
    .from("profiles")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("role", "agent")
    .eq("agent_status", "approved");

  const { count: openIssues } = await supabase
    .from("issues")
    .select("*", {
      count: "exact",
      head: true,
    })
    .in("status", ["open", "in_progress"]);

  const totalOrders = allOrders.length;

  const activeOrders = allOrders.filter(
    (order) =>
      order.status !== "delivered" &&
      order.status !== "cancelled"
  );

  const deliveredOrders = allOrders.filter(
    (order) => order.status === "delivered"
  );

  const cancelledOrders = allOrders.filter(
    (order) => order.status === "cancelled"
  );

  const totalRevenue = allOrders.reduce(
    (sum, order) =>
      sum + Number(order.total_amount || 0),
    0
  );

  const deliveredRevenue = deliveredOrders.reduce(
    (sum, order) =>
      sum + Number(order.total_amount || 0),
    0
  );

  const averageOrderValue =
    totalOrders > 0
      ? totalRevenue / totalOrders
      : 0;

  const statusCounts = allOrders.reduce<
    Record<string, number>
  >((accumulator, order) => {
    accumulator[order.status] =
      (accumulator[order.status] || 0) + 1;

    return accumulator;
  }, {});

  const serviceCounts = allOrders.reduce<
    Record<string, number>
  >((accumulator, order) => {
    accumulator[order.service_type] =
      (accumulator[order.service_type] || 0) + 1;

    return accumulator;
  }, {});

  const serviceEntries = Object.entries(
    serviceCounts
  ).sort((a, b) => b[1] - a[1]);

  const statusEntries = Object.entries(
    statusCounts
  ).sort((a, b) => b[1] - a[1]);

  const recentOrders = allOrders.slice(0, 8);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="text-sm font-semibold text-cyan-700 transition hover:text-cyan-800"
          >
            ← Back to Admin Dashboard
          </Link>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            Analytics
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Monitor platform performance, order activity,
            revenue, and operational trends.
          </p>
        </div>

        {/* KPI Cards */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AnalyticsCard
            title="Total Orders"
            value={totalOrders}
            description="All platform orders"
          />

          <AnalyticsCard
            title="Active Orders"
            value={activeOrders.length}
            description="Currently in progress"
          />

          <AnalyticsCard
            title="Delivered Orders"
            value={deliveredOrders.length}
            description="Successfully completed"
          />

          <AnalyticsCard
            title="Cancelled Orders"
            value={cancelledOrders.length}
            description="Cancelled requests"
          />

          <AnalyticsCard
            title="Customers"
            value={customers ?? 0}
            description="Registered customers"
          />

          <AnalyticsCard
            title="Approved Agents"
            value={approvedAgents ?? 0}
            description="Approved service agents"
          />

          <AnalyticsCard
            title="Open Issues"
            value={openIssues ?? 0}
            description="Open or in-progress issues"
          />

          <AnalyticsCard
            title="Total Revenue"
            value={`${totalRevenue.toFixed(2)} SAR`}
            description="Order value across all orders"
          />
        </section>

        {/* Revenue Overview */}
        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-cyan-700">
              Revenue
            </p>

            <h2 className="mt-2 text-xl font-bold text-slate-900">
              Revenue Overview
            </h2>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-5">
                <p className="text-sm text-slate-500">
                  Total Order Value
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {totalRevenue.toFixed(2)} SAR
                </p>
              </div>

              <div className="rounded-xl bg-emerald-50 p-5">
                <p className="text-sm text-emerald-700">
                  Delivered Order Value
                </p>

                <p className="mt-2 text-2xl font-bold text-emerald-700">
                  {deliveredRevenue.toFixed(2)} SAR
                </p>
              </div>

              <div className="rounded-xl bg-cyan-50 p-5">
                <p className="text-sm text-cyan-700">
                  Average Order Value
                </p>

                <p className="mt-2 text-2xl font-bold text-cyan-700">
                  {averageOrderValue.toFixed(2)} SAR
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-5">
                <p className="text-sm text-slate-500">
                  Completed Rate
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {totalOrders > 0
                    ? (
                        (deliveredOrders.length /
                          totalOrders) *
                        100
                      ).toFixed(1)
                    : "0.0"}
                  %
                </p>
              </div>
            </div>
          </div>

          {/* Service Breakdown */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-cyan-700">
              Services
            </p>

            <h2 className="mt-2 text-xl font-bold text-slate-900">
              Orders by Service
            </h2>

            {serviceEntries.length === 0 ? (
              <div className="mt-6 rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
                No service data available.
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {serviceEntries.map(
                  ([service, count]) => {
                    const percentage =
                      totalOrders > 0
                        ? (count / totalOrders) * 100
                        : 0;

                    return (
                      <div key={service}>
                        <div className="flex items-center justify-between gap-4">
                          <p className="text-sm font-semibold text-slate-700">
                            {formatServiceType(service)}
                          </p>

                          <p className="text-sm font-bold text-slate-900">
                            {count}
                          </p>
                        </div>

                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-cyan-700"
                            style={{
                              width: `${percentage}%`,
                            }}
                          />
                        </div>

                        <p className="mt-1 text-xs text-slate-400">
                          {percentage.toFixed(1)}% of all
                          orders
                        </p>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>
        </section>

        {/* Status Breakdown */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-cyan-700">
              Operations
            </p>

            <h2 className="mt-2 text-xl font-bold text-slate-900">
              Orders by Status
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Current distribution of all orders across the
              operational workflow.
            </p>
          </div>

          {statusEntries.length === 0 ? (
            <div className="mt-6 rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
              No order status data available.
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {statusEntries.map(([status, count]) => (
                <div
                  key={status}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClasses(
                        status
                      )}`}
                    >
                      {statusLabels[status] || status}
                    </span>

                    <span className="text-xl font-bold text-slate-900">
                      {count}
                    </span>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-cyan-700"
                      style={{
                        width: `${
                          totalOrders > 0
                            ? (count / totalOrders) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Orders */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-cyan-700">
                Activity
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-900">
                Recent Orders
              </h2>
            </div>

            <Link
              href="/admin/orders"
              className="text-sm font-semibold text-cyan-700 transition hover:text-cyan-800"
            >
              View All Orders →
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500">
              No orders available yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-col gap-4 px-6 py-5 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${getStatusClasses(
                          order.status
                        )}`}
                      >
                        {statusLabels[order.status] ||
                          order.status}
                      </span>

                      <span className="text-xs text-slate-400">
                        {formatDate(order.created_at)}
                      </span>
                    </div>

                    <p className="mt-2 font-semibold text-slate-900">
                      {formatServiceType(order.service_type)}
                    </p>

                    <p className="mt-1 break-all text-xs text-slate-400">
                      {order.id}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <p className="text-sm font-bold text-slate-900">
                      {Number(order.total_amount).toFixed(2)}{" "}
                      SAR
                    </p>

                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function AnalyticsCard({
  title,
  value,
  description,
}: {
  title: string;
  value: number | string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-3xl font-bold text-slate-900">
        {value}
      </p>

      <p className="mt-2 text-xs leading-5 text-slate-500">
        {description}
      </p>
    </div>
  );
}