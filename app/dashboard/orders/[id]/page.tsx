import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type OrderPageProps = {
  params: Promise<{
    id: string;
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

const statusDescriptions: Record<string, string> = {
  created: "Your request has been created.",
  confirmed: "Your request has been confirmed.",
  searching_agent: "We are looking for an available agent.",
  agent_assigned: "An agent has accepted your request.",
  going_to_pickup: "The agent is heading to the pickup location.",
  arrived_at_pickup: "The agent has arrived at the pickup location.",
  item_collected: "The item has been collected.",
  on_the_way: "Your order is on the way.",
  delivered: "Your order has been delivered successfully.",
  cancelled: "This order has been cancelled.",
};

const statusOrder = [
  "created",
  "confirmed",
  "searching_agent",
  "agent_assigned",
  "going_to_pickup",
  "arrived_at_pickup",
  "item_collected",
  "on_the_way",
  "delivered",
];

function formatDate(date: string) {
  return new Date(date).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatServiceType(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getStatusIndex(status: string) {
  return statusOrder.indexOf(status);
}

export default async function CustomerOrderDetailsPage({
  params,
}: OrderPageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(
      `
        id,
        customer_id,
        agent_id,
        service_type,
        pickup_address,
        delivery_address,
        description,
        customer_notes,
        status,
        total_amount,
        created_at,
        updated_at
      `
    )
    .eq("id", id)
    .eq("customer_id", user.id)
    .single();

  if (orderError || !order) {
    notFound();
  }

  const { data: history } = await supabase
    .from("order_status_history")
    .select(
      `
        id,
        status,
        note,
        created_at,
        changed_by
      `
    )
    .eq("order_id", order.id)
    .order("created_at", {
      ascending: true,
    });

  const currentStatusIndex = getStatusIndex(order.status);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/dashboard"
              className="text-sm font-semibold text-cyan-700 transition hover:text-cyan-800"
            >
              ← Back to Dashboard
            </Link>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
              Order Details
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Order ID: {order.id}
            </p>
          </div>

          <div
            className={`inline-flex w-fit items-center rounded-full px-4 py-2 text-sm font-bold ${
              order.status === "delivered"
                ? "bg-emerald-100 text-emerald-700"
                : order.status === "cancelled"
                  ? "bg-red-100 text-red-700"
                  : "bg-cyan-100 text-cyan-700"
            }`}
          >
            {statusLabels[order.status] ?? order.status}
          </div>
        </div>

        {/* Current Status */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Current Status
            </p>

            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              {statusLabels[order.status] ?? order.status}
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {statusDescriptions[order.status] ??
                "Your order status has been updated."}
            </p>
          </div>

          {/* Progress */}
          {order.status !== "cancelled" && (
            <div className="mt-8 overflow-x-auto">
              <div className="min-w-[850px]">
                <div className="flex items-start">
                  {statusOrder.map((status, index) => {
                    const completed =
                      currentStatusIndex >= index;

                    const isCurrent =
                      order.status === status;

                    return (
                      <div
                        key={status}
                        className="relative flex-1"
                      >
                        {index < statusOrder.length - 1 && (
                          <div
                            className={`absolute left-1/2 right-0 top-4 h-0.5 ${
                              currentStatusIndex > index
                                ? "bg-cyan-700"
                                : "bg-slate-200"
                            }`}
                          />
                        )}

                        <div className="relative z-10 flex flex-col items-center">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold ${
                              completed
                                ? "border-cyan-700 bg-cyan-700 text-white"
                                : "border-slate-300 bg-white text-slate-400"
                            } ${
                              isCurrent
                                ? "ring-4 ring-cyan-100"
                                : ""
                            }`}
                          >
                            {completed ? "✓" : index + 1}
                          </div>

                          <p
                            className={`mt-3 max-w-24 text-center text-xs font-semibold leading-4 ${
                              isCurrent
                                ? "text-cyan-700"
                                : completed
                                  ? "text-slate-700"
                                  : "text-slate-400"
                            }`}
                          >
                            {statusLabels[status]}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Customer Actions */}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {order.status === "delivered" && (
            <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                  ★
                </div>

                <div className="flex-1">
                  <h2 className="text-lg font-bold text-emerald-900">
                    Share Your Experience
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-emerald-700">
                    Your order has been delivered. Rate your
                    experience with the agent.
                  </p>

                  <Link
                    href={`/dashboard/orders/${order.id}/rating`}
                    className="mt-4 inline-flex rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-800"
                  >
                    Rate Order
                  </Link>
                </div>
              </div>
            </section>
          )}

          <section
            className={`rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm ${
              order.status === "delivered"
                ? ""
                : "md:col-span-2"
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                !
              </div>

              <div className="flex-1">
                <h2 className="text-lg font-bold text-amber-900">
                  Need Help?
                </h2>

                <p className="mt-1 text-sm leading-6 text-amber-700">
                  If there is a problem with this order, you
                  can report it to our support team.
                </p>

                <Link
                  href={`/dashboard/orders/${order.id}/issue`}
                  className="mt-4 inline-flex rounded-xl bg-amber-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-amber-700"
                >
                  Report an Issue
                </Link>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Order Information */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              Order Information
            </h2>

            <div className="mt-5 space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Service
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  {formatServiceType(order.service_type)}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Pickup
                </p>

                <p className="mt-1 leading-6 text-slate-700">
                  {order.pickup_address}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Delivery
                </p>

                <p className="mt-1 leading-6 text-slate-700">
                  {order.delivery_address || "Not specified"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Description
                </p>

                <p className="mt-1 leading-6 text-slate-700">
                  {order.description || "No description provided."}
                </p>
              </div>

              {order.customer_notes && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Notes
                  </p>

                  <p className="mt-1 leading-6 text-slate-700">
                    {order.customer_notes}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Payment */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              Payment
            </h2>

            <div className="mt-5 rounded-xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">
                Total Amount
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {Number(order.total_amount).toFixed(2)} SAR
              </p>

              <p className="mt-2 text-xs text-slate-500">
                Demo payment for MVP
              </p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Created
                </p>

                <p className="mt-1 text-sm font-medium text-slate-700">
                  {formatDate(order.created_at)}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Last Updated
                </p>

                <p className="mt-1 text-sm font-medium text-slate-700">
                  {formatDate(order.updated_at)}
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Status Timeline */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Order Timeline
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Real-time status history for this order.
            </p>
          </div>

          <div className="mt-6">
            {history && history.length > 0 ? (
              <div className="space-y-0">
                {history.map((item, index) => (
                  <div
                    key={item.id}
                    className="relative flex gap-4"
                  >
                    {index < history.length - 1 && (
                      <div className="absolute left-[11px] top-7 h-full w-px bg-slate-200" />
                    )}

                    <div className="relative z-10 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-700 text-xs font-bold text-white">
                      ✓
                    </div>

                    <div className="pb-7">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-slate-900">
                          {statusLabels[item.status] ??
                            item.status}
                        </p>

                        <span className="text-xs text-slate-400">
                          {formatDate(item.created_at)}
                        </span>
                      </div>

                      {item.note && (
                        <p className="mt-1 text-sm text-slate-600">
                          {item.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-500">
                No status history available yet.
              </div>
            )}
          </div>
        </section>

        {/* Agent Information */}
        {order.agent_id && (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              Agent Assigned
            </h2>

            <div className="mt-4 rounded-xl bg-emerald-50 p-4">
              <p className="text-sm font-semibold text-emerald-800">
                An agent has accepted your request.
              </p>

              <p className="mt-1 text-xs text-emerald-700">
                Agent assignment is active for this order.
              </p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}