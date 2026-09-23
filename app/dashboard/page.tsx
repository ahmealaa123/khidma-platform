import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "./LogoutButton";

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

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (profile?.role === "agent") {
    redirect("/agent");
  }

  if (profile?.role === "admin") {
    redirect("/admin");
  }

  const { data: orders } = await supabase
    .from("orders")
    .select(
      `
        id,
        service_type,
        pickup_address,
        delivery_address,
        status,
        total_amount,
        created_at
      `
    )
    .eq("customer_id", user.id)
    .order("created_at", {
      ascending: false,
    })
    .limit(5);

  const recentOrders = orders ?? [];

  const { count: totalOrders } = await supabase
    .from("orders")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("customer_id", user.id);

  const { count: activeOrders } = await supabase
    .from("orders")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("customer_id", user.id)
    .not("status", "in", '("delivered","cancelled")');

  const { count: completedOrders } = await supabase
    .from("orders")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("customer_id", user.id)
    .eq("status", "delivered");

  const displayName =
    profile?.full_name?.trim() ||
    user.email?.split("@")[0] ||
    "Customer";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-cyan-700">
              Customer Dashboard
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              Welcome, {displayName}
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Manage your requests and track your orders.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/orders"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              My Orders
            </Link>

            <Link
              href="/dashboard/create-request"
              className="inline-flex items-center justify-center rounded-xl bg-cyan-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-cyan-800"
            >
              Create Request
            </Link>

            <LogoutButton />
          </div>
        </header>

        {/* Stats */}
        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Total Orders
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {totalOrders ?? 0}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              All requests created
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Active Orders
            </p>

            <p className="mt-2 text-3xl font-bold text-cyan-700">
              {activeOrders ?? 0}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Currently in progress
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Completed
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-600">
              {completedOrders ?? 0}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Successfully delivered
            </p>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mt-8">
          <h2 className="text-xl font-bold text-slate-900">
            Quick Actions
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Link
              href="/dashboard/create-request"
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-100 text-xl">
                +
              </div>

              <h3 className="mt-4 text-lg font-bold text-slate-900">
                Create a New Request
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Request a delivery, shopping service, pickup,
                or another task.
              </p>

              <span className="mt-4 inline-block text-sm font-bold text-cyan-700 group-hover:text-cyan-800">
                Start Request →
              </span>
            </Link>

            <Link
              href="/dashboard/orders"
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-xl">
                📦
              </div>

              <h3 className="mt-4 text-lg font-bold text-slate-900">
                View My Orders
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Track active requests and review your complete
                order history.
              </p>

              <span className="mt-4 inline-block text-sm font-bold text-cyan-700 group-hover:text-cyan-800">
                View Orders →
              </span>
            </Link>
          </div>
        </section>

        {/* Recent Orders */}
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Recent Orders
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Your latest requests.
              </p>
            </div>

            {recentOrders.length > 0 && (
              <Link
                href="/dashboard/orders"
                className="text-sm font-bold text-cyan-700 transition hover:text-cyan-800"
              >
                View All
              </Link>
            )}
          </div>

          {recentOrders.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-xl">
                📦
              </div>

              <h3 className="mt-4 text-lg font-bold text-slate-900">
                No orders yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Create your first request and we will connect
                you with an available agent.
              </p>

              <Link
                href="/dashboard/create-request"
                className="mt-6 inline-flex rounded-xl bg-cyan-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-cyan-800"
              >
                Create Request
              </Link>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {recentOrders.map((order) => (
                <article
                  key={order.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClasses(
                            order.status
                          )}`}
                        >
                          {statusLabels[order.status] ??
                            order.status}
                        </span>

                        <span className="text-xs text-slate-400">
                          {formatDate(order.created_at)}
                        </span>
                      </div>

                      <h3 className="mt-3 text-lg font-bold text-slate-900">
                        {formatServiceType(order.service_type)}
                      </h3>

                      <p className="mt-1 text-xs text-slate-400">
                        Order ID: {order.id}
                      </p>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                            Pickup
                          </p>

                          <p className="mt-1 line-clamp-2 text-sm text-slate-700">
                            {order.pickup_address}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                            Delivery
                          </p>

                          <p className="mt-1 line-clamp-2 text-sm text-slate-700">
                            {order.delivery_address ||
                              "Not specified"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-stretch gap-3 lg:items-end">
                      <div className="text-left lg:text-right">
                        <p className="text-xs font-medium text-slate-400">
                          Total
                        </p>

                        <p className="mt-1 text-xl font-bold text-slate-900">
                          {Number(
                            order.total_amount
                          ).toFixed(2)}{" "}
                          SAR
                        </p>
                      </div>

                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                      >
                        View Order
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Account */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Account
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Signed in as {user.email}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/profile"
                className="inline-flex w-fit rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Profile
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}