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

type AvailableOrder = {
  id: string;
  service_type: string;
  pickup_address: string;
  delivery_address: string | null;
  description: string | null;
  status: OrderStatus;
  total_amount: number | string;
  created_at: string;
};

export default async function AgentTasksPage() {
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
      .select("full_name, role, agent_status")
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

  const { data: agentProfile, error: agentError } =
    await supabase
      .from("agent_profiles")
      .select(
        "agent_type, city, is_online"
      )
      .eq("id", user.id)
      .single();

  if (
    agentError ||
    !agentProfile
  ) {
    redirect("/agent");
  }

  const { data: orders, error: ordersError } =
    await supabase
      .from("orders")
      .select(`
        id,
        service_type,
        pickup_address,
        delivery_address,
        description,
        status,
        total_amount,
        created_at
      `)
      .eq("status", "searching_agent")
      .is("agent_id", null)
      .order("created_at", {
        ascending: false,
      });

  if (ordersError) {
    console.error(
      "Could not load available tasks:",
      ordersError
    );
  }

  const availableOrders =
    (orders ?? []) as AvailableOrder[];

  function getServiceLabel(
    serviceType: string
  ) {
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
        return serviceType
          .replace(/_/g, " ")
          .replace(/\b\w/g, (char) =>
            char.toUpperCase()
          );
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-700 text-xl font-bold text-white">
              K
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-700">
                Agent Portal
              </p>

              <h1 className="text-xl font-bold text-slate-900">
                Available Tasks
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
        <section>
          <p className="text-sm font-medium text-slate-500">
            Task Marketplace
          </p>

          <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Available Tasks
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Browse new tasks that are currently waiting
            for an available agent.
          </p>
        </section>

        {!agentProfile.is_online && (
          <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-sm font-bold text-amber-900">
              You are currently Offline
            </p>

            <p className="mt-1 text-sm leading-6 text-amber-800">
              Go online from your Agent Dashboard to
              receive and accept available tasks.
            </p>

            <Link
              href="/agent"
              className="mt-4 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Go to Dashboard
            </Link>
          </section>
        )}

        {agentProfile.is_online && (
          <section className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />

              <div>
                <p className="text-sm font-bold text-emerald-900">
                  You are Online
                </p>

                <p className="mt-1 text-xs text-emerald-700">
                  You can view and accept available tasks.
                </p>
              </div>
            </div>
          </section>
        )}

        <section className="mt-8">
          {availableOrders.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                ✓
              </div>

              <h3 className="mt-5 text-xl font-bold text-slate-900">
                No Available Tasks
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                There are currently no new tasks waiting
                for an agent.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {availableOrders.map(
                (order) => (
                  <article
                    key={order.id}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                          {getServiceLabel(
                            order.service_type
                          )}
                        </span>

                        <h3 className="mt-3 text-lg font-bold text-slate-900">
                          New Task
                        </h3>
                      </div>

                      <div className="text-right">
                        <p className="text-lg font-bold text-slate-900">
                          {Number(
                            order.total_amount
                          ).toFixed(2)}{" "}
                          SAR
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Task value
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 space-y-3">
                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Pickup
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {order.pickup_address}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Delivery
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {order.delivery_address ||
                            "Not specified"}
                        </p>
                      </div>
                    </div>

                    {order.description && (
                      <div className="mt-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Request
                        </p>

                        <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">
                          {order.description}
                        </p>
                      </div>
                    )}

                    <div className="mt-6 flex items-center justify-between gap-4 border-t border-slate-100 pt-5">
                      <p className="text-xs text-slate-400">
                        Order #
                        {order.id.slice(0, 8)}
                      </p>

                      <Link
                        href={`/agent/tasks/${order.id}`}
                        className="rounded-xl bg-cyan-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-800"
                      >
                        View Task
                      </Link>
                    </div>
                  </article>
                )
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}