import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type OrderStatus =
  | "created"
  | "confirmed"
  | "searching_agent"
  | "agent_assigned"
  | "going_to_pickup"
  | "arrived_at_pickup"
  | "item_collected"
  | "on_the_way"
  | "delivered"
  | "cancelled";

type Order = {
  id: string;
  customer_id: string;
  service_type: string;
  pickup_address: string;
  delivery_address: string | null;
  description: string | null;
  status: OrderStatus;
  total_amount: number | string;
  customer_notes: string | null;
  created_at: string;
  updated_at: string;
};

export default async function AgentOrdersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } =
    await supabase
      .from("profiles")
      .select("role, agent_status")
      .eq("id", user.id)
      .single();

  if (
    profileError ||
    !profile ||
    profile.role !== "agent"
  ) {
    redirect("/dashboard");
  }

  if (profile.agent_status === "pending") {
    redirect("/signup/agent/pending");
  }

  if (profile.agent_status !== "approved") {
    redirect("/login");
  }

  const { data: orders, error: ordersError } =
    await supabase
      .from("orders")
      .select(`
        id,
        customer_id,
        service_type,
        pickup_address,
        delivery_address,
        description,
        status,
        total_amount,
        customer_notes,
        created_at,
        updated_at
      `)
      .eq("agent_id", user.id)
      .order("created_at", {
        ascending: false,
      });

  if (ordersError) {
    console.error(
      "Could not load agent orders:",
      ordersError
    );
  }

  const orderRows = (orders ?? []) as Order[];

  const activeOrders = orderRows.filter(
    (order) =>
      order.status !== "delivered" &&
      order.status !== "cancelled"
  );

  const completedOrders = orderRows.filter(
    (order) => order.status === "delivered"
  );

  function getStatusLabel(status: OrderStatus) {
    switch (status) {
      case "created":
        return "Created";

      case "confirmed":
        return "Confirmed";

      case "searching_agent":
        return "Searching Agent";

      case "agent_assigned":
        return "Assigned";

      case "going_to_pickup":
        return "Going to Pickup";

      case "arrived_at_pickup":
        return "Arrived at Pickup";

      case "item_collected":
        return "Item Collected";

      case "on_the_way":
        return "On the Way";

      case "delivered":
        return "Delivered";

      case "cancelled":
        return "Cancelled";

      default:
        return status;
    }
  }

  function getStatusClasses(status: OrderStatus) {
    switch (status) {
      case "created":
        return "border-slate-200 bg-slate-50 text-slate-700";

      case "confirmed":
        return "border-cyan-200 bg-cyan-50 text-cyan-700";

      case "searching_agent":
        return "border-amber-200 bg-amber-50 text-amber-700";

      case "agent_assigned":
        return "border-indigo-200 bg-indigo-50 text-indigo-700";

      case "going_to_pickup":
      case "arrived_at_pickup":
      case "item_collected":
      case "on_the_way":
        return "border-blue-200 bg-blue-50 text-blue-700";

      case "delivered":
        return "border-emerald-200 bg-emerald-50 text-emerald-700";

      case "cancelled":
        return "border-red-200 bg-red-50 text-red-700";

      default:
        return "border-slate-200 bg-slate-50 text-slate-600";
    }
  }

  function getServiceLabel(serviceType: string) {
    switch (serviceType) {
      case "delivery":
        return "Delivery";

      case "shopping":
        return "Shopping";

      case "pickup":
        return "Pickup";

      case "errand":
        return "Errand";

      default:
        return serviceType.replace(/_/g, " ");
    }
  }

  function formatAmount(amount: number | string) {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(amount || 0));
  }

  function formatDate(date: string) {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-4">
            <Link
              href="/agent"
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-700 text-xl font-bold text-white transition hover:bg-cyan-800"
            >
              K
            </Link>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-700">
                Agent Portal
              </p>

              <h1 className="text-xl font-bold text-slate-900">
                My Orders
              </h1>
            </div>
          </div>

          <Link
            href="/agent"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Agent Tasks
          </p>

          <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            My Assigned Orders
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            View the orders currently assigned to you and
            review completed tasks.
          </p>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Total Orders"
            value={String(orderRows.length)}
            description="All assigned orders"
          />

          <StatCard
            label="Active"
            value={String(activeOrders.length)}
            description="Orders in progress"
          />

          <StatCard
            label="Completed"
            value={String(completedOrders.length)}
            description="Delivered orders"
          />
        </section>

        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Orders
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Your assigned tasks appear here.
              </p>
            </div>
          </div>

          {orderRows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                —
              </div>

              <h3 className="mt-4 font-bold text-slate-900">
                No orders assigned
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Orders assigned to you will appear here.
              </p>
            </div>
          ) : (
            <div className="grid gap-5">
              {orderRows.map((order) => (
                <article
                  key={order.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-mono text-xs font-semibold text-slate-400">
                          #{order.id.slice(0, 8)}
                        </span>

                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(
                            order.status
                          )}`}
                        >
                          {getStatusLabel(order.status)}
                        </span>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600">
                          {getServiceLabel(
                            order.service_type
                          )}
                        </span>
                      </div>

                      <div className="mt-5 grid gap-4 md:grid-cols-2">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Pickup
                          </p>

                          <p className="mt-2 text-sm font-medium leading-6 text-slate-900">
                            {order.pickup_address}
                          </p>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Delivery
                          </p>

                          <p className="mt-2 text-sm font-medium leading-6 text-slate-900">
                            {order.delivery_address ||
                              "No delivery address"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 lg:min-w-44 lg:text-right">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Order Amount
                      </p>

                      <p className="mt-1 text-2xl font-bold text-slate-900">
                        {formatAmount(
                          order.total_amount
                        )}{" "}
                        SAR
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {formatDate(order.created_at)}
                      </p>

                      <Link
                        href={`/agent/orders/${order.id}`}
                        className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-800 lg:w-auto"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>

                  {order.description && (
                    <div className="mt-5 border-t border-slate-100 pt-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Description
                      </p>

                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {order.description}
                      </p>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {description}
      </p>
    </div>
  );
}