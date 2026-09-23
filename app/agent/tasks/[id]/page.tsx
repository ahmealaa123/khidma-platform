import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AcceptTaskButton from "./AcceptTaskButton";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AgentTaskDetailsPage({
  params,
}: PageProps) {
  const { id } = await params;

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
      .select(
        "full_name, role, agent_status"
      )
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

  const { data: agentProfile } =
    await supabase
      .from("agent_profiles")
      .select(
        "agent_type, city, is_online"
      )
      .eq("id", user.id)
      .single();

  if (!agentProfile) {
    redirect("/agent");
  }

  const { data: order, error: orderError } =
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
        customer_notes,
        created_at,
        updated_at
      `)
      .eq("id", id)
      .eq("status", "searching_agent")
      .is("agent_id", null)
      .single();

  if (
    orderError ||
    !order
  ) {
    notFound();
  }

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

  function formatDate(
    value: string
  ) {
    return new Intl.DateTimeFormat(
      "en-US",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    ).format(new Date(value));
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-700 text-xl font-bold text-white">
              K
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-700">
                Agent Portal
              </p>

              <h1 className="text-xl font-bold text-slate-900">
                Task Details
              </h1>
            </div>
          </div>

          <Link
            href="/agent/tasks"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Back to Tasks
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-slate-500">
            Available Task
          </p>

          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            {getServiceLabel(
              order.service_type
            )}
          </h2>

          <p className="text-sm text-slate-500">
            Order #{order.id.slice(0, 8)}
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <section className="space-y-6 lg:col-span-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Service
                  </p>

                  <h3 className="mt-2 text-xl font-bold text-slate-900">
                    {getServiceLabel(
                      order.service_type
                    )}
                  </h3>
                </div>

                <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                  Searching for Agent
                </span>
              </div>

              <div className="mt-6 grid gap-4">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Pickup Address
                  </p>

                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-800">
                    {order.pickup_address}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Delivery Address
                  </p>

                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-800">
                    {order.delivery_address ||
                      "Not specified"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Request Details
              </p>

              <h3 className="mt-2 text-xl font-bold text-slate-900">
                Customer Request
              </h3>

              <div className="mt-5 space-y-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Description
                  </p>

                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    {order.description ||
                      "No additional description provided."}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Customer Notes
                  </p>

                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    {order.customer_notes ||
                      "No additional notes provided."}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Order Information
              </p>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Created
                  </p>

                  <p className="mt-2 text-sm font-semibold text-slate-800">
                    {formatDate(
                      order.created_at
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Order Amount
                  </p>

                  <p className="mt-2 text-lg font-bold text-slate-900">
                    {Number(
                      order.total_amount
                    ).toFixed(2)}{" "}
                    SAR
                  </p>
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Your Availability
              </p>

              <div className="mt-4 flex items-center gap-3">
                <span
                  className={`h-3 w-3 rounded-full ${
                    agentProfile.is_online
                      ? "bg-emerald-500"
                      : "bg-slate-400"
                  }`}
                />

                <p className="text-sm font-bold text-slate-900">
                  {agentProfile.is_online
                    ? "Online"
                    : "Offline"}
                </p>
              </div>

              {!agentProfile.is_online && (
                <p className="mt-3 text-sm leading-6 text-amber-700">
                  You are currently offline.
                  Go online from your dashboard
                  before accepting tasks.
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
                Task Value
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {Number(
                  order.total_amount
                ).toFixed(2)}{" "}
                SAR
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                This is the current order value shown
                for this MVP task.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Accept Task
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Accept this task to assign it to your
                account and begin the delivery workflow.
              </p>

              <div className="mt-5">
                <AcceptTaskButton
                  orderId={order.id}
                  isOnline={
                    agentProfile.is_online
                  }
                />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}