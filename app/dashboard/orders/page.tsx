import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Order = {
  id: string;
  service_type: string;
  pickup_address: string;
  delivery_address: string | null;
  status: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
};

type OrdersPageProps = {
  searchParams: Promise<{
    search?: string;
    status?: string;
  }>;
};

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
    year: "numeric",
    month: "short",
    day: "numeric",
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

export default async function CustomerOrdersPage({
  searchParams,
}: OrdersPageProps) {
  const params = await searchParams;

  const search = params.search?.trim() || "";
  const statusFilter = params.status || "all";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      `
        id,
        service_type,
        pickup_address,
        delivery_address,
        status,
        total_amount,
        created_at,
        updated_at
      `
    )
    .eq("customer_id", user.id)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <h1 className="text-lg font-bold text-red-800">
              Unable to load orders
            </h1>

            <p className="mt-2 text-sm text-red-700">
              {error.message}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const allOrders = (orders ?? []) as Order[];

  const activeOrders = allOrders.filter(
    (order) =>
      order.status !== "delivered" &&
      order.status !== "cancelled"
  );

  const completedOrders = allOrders.filter(
    (order) => order.status === "delivered"
  );

  const cancelledOrders = allOrders.filter(
    (order) => order.status === "cancelled"
  );

  const filteredOrders = allOrders.filter((order) => {
    const searchableText = [
      order.id,
      order.service_type,
      order.pickup_address,
      order.delivery_address || "",
      statusLabels[order.status] || order.status,
    ]
      .join(" ")
      .toLowerCase();

    const searchMatch =
      !search ||
      searchableText.includes(search.toLowerCase());

    const statusMatch =
      statusFilter === "all" ||
      order.status === statusFilter;

    return searchMatch && statusMatch;
  });

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href="/dashboard"
              className="text-sm font-semibold text-cyan-700 transition hover:text-cyan-800"
            >
              ← Back to Dashboard
            </Link>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
              My Orders
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              View and track all your requests.
            </p>
          </div>

          <Link
            href="/dashboard/create-request"
            className="inline-flex w-fit items-center justify-center rounded-xl bg-cyan-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-cyan-800"
          >
            Create New Request
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Total Orders
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {allOrders.length}
            </p>
          </div>

          <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5 shadow-sm">
            <p className="text-sm font-medium text-cyan-700">
              Active Orders
            </p>

            <p className="mt-2 text-3xl font-bold text-cyan-700">
              {activeOrders.length}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <p className="text-sm font-medium text-emerald-700">
              Completed Orders
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-600">
              {completedOrders.length}
            </p>
          </div>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
            <p className="text-sm font-medium text-red-700">
              Cancelled Orders
            </p>

            <p className="mt-2 text-3xl font-bold text-red-600">
              {cancelledOrders.length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <form
            method="GET"
            className="grid gap-4 md:grid-cols-[1fr_220px_auto]"
          >
            <div>
              <label
                htmlFor="search"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Search Orders
              </label>

              <input
                id="search"
                name="search"
                type="text"
                defaultValue={search}
                placeholder="Search by order ID, address, service..."
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
              />
            </div>

            <div>
              <label
                htmlFor="status"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Status
              </label>

              <select
                id="status"
                name="status"
                defaultValue={statusFilter}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
              >
                <option value="all">
                  All Statuses
                </option>

                <option value="created">
                  Created
                </option>

                <option value="confirmed">
                  Confirmed
                </option>

                <option value="searching_agent">
                  Searching for Agent
                </option>

                <option value="agent_assigned">
                  Agent Assigned
                </option>

                <option value="going_to_pickup">
                  Going to Pickup
                </option>

                <option value="arrived_at_pickup">
                  Arrived at Pickup
                </option>

                <option value="item_collected">
                  Item Collected
                </option>

                <option value="on_the_way">
                  On the Way
                </option>

                <option value="delivered">
                  Delivered
                </option>

                <option value="cancelled">
                  Cancelled
                </option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                Apply Filters
              </button>
            </div>
          </form>
        </section>

        {/* Orders */}
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">
              Order History
            </h2>

            <span className="text-sm text-slate-500">
              {filteredOrders.length}{" "}
              {filteredOrders.length === 1
                ? "order"
                : "orders"}
            </span>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-xl">
                📦
              </div>

              <h3 className="mt-4 text-lg font-bold text-slate-900">
                No orders found
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {allOrders.length === 0
                  ? "You have not created any requests yet. Create your first request to get started."
                  : "No orders match your current search or status filter."}
              </p>

              {allOrders.length === 0 && (
                <Link
                  href="/dashboard/create-request"
                  className="mt-6 inline-flex rounded-xl bg-cyan-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-cyan-800"
                >
                  Create Your First Request
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
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

                      <p className="mt-1 break-all text-xs text-slate-400">
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
      </div>
    </main>
  );
}