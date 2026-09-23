import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OrderStatusManager from "./OrderStatusManager";
import AgentAssignment from "./AgentAssignment";

type OrderDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

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

type OrderHistoryItem = {
  id: string;
  status: OrderStatus;
  changed_by: string | null;
  note: string | null;
  created_at: string;
};

type Agent = {
  id: string;
  full_name: string | null;
  agent_type: string;
  phone: string;
  city: string | null;
};

export default async function OrderDetailsPage({
  params,
}: OrderDetailsPageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: adminProfile, error: adminProfileError } =
    await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

  if (
    adminProfileError ||
    !adminProfile ||
    adminProfile.role !== "admin"
  ) {
    redirect("/admin/login");
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(`
      id,
      customer_id,
      agent_id,
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
    .eq("id", id)
    .single();

  if (orderError || !order) {
    notFound();
  }

  const { data: history, error: historyError } =
    await supabase
      .from("order_status_history")
      .select(`
        id,
        status,
        changed_by,
        note,
        created_at
      `)
      .eq("order_id", id)
      .order("created_at", {
        ascending: true,
      });

  if (historyError) {
    console.error(
      "Could not load order history:",
      historyError
    );
  }

  const orderHistory =
    (history ?? []) as OrderHistoryItem[];

  const { data: agents, error: agentsError } =
    await supabase
      .from("agent_profiles")
      .select(`
        id,
        phone,
        city,
        agent_type,
        profiles!inner(
          full_name,
          role,
          agent_status
        )
      `)
      .eq("profiles.role", "agent")
      .eq("profiles.agent_status", "approved")
      .order("created_at", {
        ascending: false,
      });

  if (agentsError) {
    console.error(
      "Could not load approved agents:",
      agentsError
    );
  }

  const availableAgents: Agent[] = (agents ?? []).map(
    (agent) => {
      const profile = Array.isArray(agent.profiles)
        ? agent.profiles[0]
        : agent.profiles;

      return {
        id: agent.id,
        full_name: profile?.full_name ?? null,
        agent_type: agent.agent_type,
        phone: agent.phone,
        city: agent.city ?? null,
      };
    }
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
        return "Agent Assigned";

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

  function formatDate(date: string) {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  }

  function formatHistoryDate(date: string) {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  }

  function formatAmount(amount: number) {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-700 text-xl font-bold text-white transition hover:bg-cyan-800"
            >
              K
            </Link>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-700">
                Administration
              </p>

              <h1 className="text-xl font-bold text-slate-900">
                Order Details
              </h1>
            </div>
          </div>

          <Link
            href="/admin/orders"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Back to Orders
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Order Management
          </p>

          <div className="mt-1 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Order #{order.id.slice(0, 8)}
            </h2>

            <span
              className={`inline-flex w-fit rounded-full border px-4 py-2 text-sm font-semibold ${getStatusClasses(
                order.status
              )}`}
            >
              {getStatusLabel(order.status)}
            </span>
          </div>

          <p className="mt-2 font-mono text-xs text-slate-400">
            {order.id}
          </p>
        </div>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-bold text-slate-900">
                Request Information
              </h3>

              <div className="mt-6 space-y-5">
                <InfoRow
                  label="Service Type"
                  value={order.service_type.replace(
                    /_/g,
                    " "
                  )}
                  capitalize
                />

                <InfoRow
                  label="Customer ID"
                  value={order.customer_id}
                  mono
                />

                <InfoRow
                  label="Agent"
                  value={
                    order.agent_id
                      ? order.agent_id
                      : "Unassigned"
                  }
                  mono={Boolean(order.agent_id)}
                />

                <InfoRow
                  label="Created"
                  value={formatDate(order.created_at)}
                />

                <InfoRow
                  label="Last Updated"
                  value={formatDate(order.updated_at)}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-bold text-slate-900">
                Locations
              </h3>

              <div className="mt-6 space-y-5">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Pickup
                  </p>

                  <p className="mt-2 text-sm font-medium leading-6 text-slate-900">
                    {order.pickup_address}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Delivery
                  </p>

                  <p className="mt-2 text-sm font-medium leading-6 text-slate-900">
                    {order.delivery_address ||
                      "No delivery address"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-bold text-slate-900">
                Request Description
              </h3>

              <div className="mt-4 rounded-xl bg-slate-50 p-5">
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {order.description ||
                    "No description provided."}
                </p>
              </div>

              <h3 className="mt-6 font-bold text-slate-900">
                Customer Notes
              </h3>

              <div className="mt-4 rounded-xl bg-slate-50 p-5">
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {order.customer_notes ||
                    "No additional notes."}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Order Amount
              </p>

              <p className="mt-2 text-4xl font-bold text-slate-900">
                {formatAmount(order.total_amount)}
              </p>

              <p className="mt-1 text-sm text-slate-400">
                SAR
              </p>
            </div>

            <AgentAssignment
              orderId={order.id}
              currentAgentId={order.agent_id}
              agents={availableAgents}
            />

            <OrderStatusManager
              orderId={order.id}
              currentStatus={order.status}
            />

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold text-slate-900">
                    Status History
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Complete record of order status changes.
                  </p>
                </div>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {orderHistory.length} event
                  {orderHistory.length === 1
                    ? ""
                    : "s"}
                </span>
              </div>

              {orderHistory.length === 0 ? (
                <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                  <p className="text-sm font-medium text-slate-600">
                    No status history available.
                  </p>
                </div>
              ) : (
                <div className="mt-7">
                  {orderHistory.map((item, index) => {
                    const isLast =
                      index === orderHistory.length - 1;

                    return (
                      <div
                        key={item.id}
                        className="flex gap-4"
                      >
                        <div className="flex flex-col items-center">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${getStatusClasses(
                              item.status
                            )}`}
                          >
                            {index + 1}
                          </div>

                          {!isLast && (
                            <div className="mt-2 min-h-10 w-px flex-1 bg-slate-200" />
                          )}
                        </div>

                        <div
                          className={`min-w-0 flex-1 ${
                            isLast ? "" : "pb-7"
                          }`}
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <span
                              className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(
                                item.status
                              )}`}
                            >
                              {getStatusLabel(
                                item.status
                              )}
                            </span>

                            <span className="text-xs text-slate-400">
                              {formatHistoryDate(
                                item.created_at
                              )}
                            </span>
                          </div>

                          {item.note && (
                            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Note
                              </p>

                              <p className="mt-1 text-sm leading-6 text-slate-700">
                                {item.note}
                              </p>
                            </div>
                          )}

                          {item.changed_by && (
                            <p className="mt-3 font-mono text-[11px] text-slate-400">
                              Changed by:{" "}
                              {item.changed_by}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function InfoRow({
  label,
  value,
  mono = false,
  capitalize = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  capitalize?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5 border-b border-slate-100 pb-4 last:border-b-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <p className="text-sm font-medium text-slate-500">
        {label}
      </p>

      <p
        className={`text-sm font-semibold text-slate-900 sm:max-w-[65%] sm:text-right ${
          mono ? "break-all font-mono text-xs" : ""
        } ${capitalize ? "capitalize" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}