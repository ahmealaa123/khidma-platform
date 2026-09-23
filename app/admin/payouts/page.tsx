import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PayoutStatusManager from "./PayoutStatusManager";

type EarningStatus =
  | "pending"
  | "available"
  | "paid"
  | "cancelled";

type Earning = {
  id: string;
  agent_id: string;
  order_id: string;
  amount: number | string;
  status: EarningStatus;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

type AgentProfile = {
  id: string;
  agent_type: string;
  phone: string;
  city: string | null;
  full_name: string | null;
};

export default async function AdminPayoutsPage() {
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

  const { data: earnings, error: earningsError } =
    await supabase
      .from("agent_earnings")
      .select(`
        id,
        agent_id,
        order_id,
        amount,
        status,
        paid_at,
        created_at,
        updated_at
      `)
      .order("created_at", {
        ascending: false,
      });

  if (earningsError) {
    console.error(
      "Could not load agent earnings:",
      earningsError
    );
  }

  const earningRows =
    (earnings ?? []) as Earning[];

  const agentIds = Array.from(
    new Set(
      earningRows.map((earning) => earning.agent_id)
    )
  );

  let agentProfiles: AgentProfile[] = [];

  if (agentIds.length > 0) {
    const { data: agents, error: agentsError } =
      await supabase
        .from("agent_profiles")
        .select(`
          id,
          agent_type,
          phone,
          city,
          profiles!inner(
            full_name
          )
        `)
        .in("id", agentIds);

    if (agentsError) {
      console.error(
        "Could not load agent profiles:",
        agentsError
      );
    }

    agentProfiles = (agents ?? []).map((agent) => {
      const profile = Array.isArray(agent.profiles)
        ? agent.profiles[0]
        : agent.profiles;

      return {
        id: agent.id,
        agent_type: agent.agent_type,
        phone: agent.phone,
        city: agent.city ?? null,
        full_name: profile?.full_name ?? null,
      };
    });
  }

  const agentMap = new Map(
    agentProfiles.map((agent) => [
      agent.id,
      agent,
    ])
  );

  const totalAmount = earningRows.reduce(
    (sum, earning) =>
      sum + Number(earning.amount || 0),
    0
  );

  const availableAmount = earningRows
    .filter((earning) => earning.status === "available")
    .reduce(
      (sum, earning) =>
        sum + Number(earning.amount || 0),
      0
    );

  const paidAmount = earningRows
    .filter((earning) => earning.status === "paid")
    .reduce(
      (sum, earning) =>
        sum + Number(earning.amount || 0),
      0
    );

  const pendingAmount = earningRows
    .filter((earning) => earning.status === "pending")
    .reduce(
      (sum, earning) =>
        sum + Number(earning.amount || 0),
      0
    );

  const availableCount = earningRows.filter(
    (earning) => earning.status === "available"
  ).length;

  const paidCount = earningRows.filter(
    (earning) => earning.status === "paid"
  ).length;

  const pendingCount = earningRows.filter(
    (earning) => earning.status === "pending"
  ).length;

  function formatAmount(amount: number) {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
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

  function getStatusLabel(status: EarningStatus) {
    switch (status) {
      case "pending":
        return "Pending";

      case "available":
        return "Available";

      case "paid":
        return "Paid";

      case "cancelled":
        return "Cancelled";

      default:
        return status;
    }
  }

  function getStatusClasses(status: EarningStatus) {
    switch (status) {
      case "pending":
        return "border-amber-200 bg-amber-50 text-amber-700";

      case "available":
        return "border-cyan-200 bg-cyan-50 text-cyan-700";

      case "paid":
        return "border-emerald-200 bg-emerald-50 text-emerald-700";

      case "cancelled":
        return "border-red-200 bg-red-50 text-red-700";

      default:
        return "border-slate-200 bg-slate-50 text-slate-600";
    }
  }

  function getAgentTypeLabel(type: string) {
    switch (type) {
      case "driver":
        return "Driver";

      case "motorcycle_rider":
        return "Motorcycle Rider";

      case "personal_shopper":
        return "Personal Shopper";

      default:
        return type.replace(/_/g, " ");
    }
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
                Agent Payouts
              </h1>
            </div>
          </div>

          <Link
            href="/admin"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Financial Management
          </p>

          <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Agent Earnings & Payouts
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Monitor agent earnings generated from completed
            orders and manage payout status.
          </p>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Earnings"
            value={`${formatAmount(totalAmount)} SAR`}
            description={`${earningRows.length} earning records`}
          />

          <StatCard
            label="Available"
            value={`${formatAmount(availableAmount)} SAR`}
            description={`${availableCount} available`}
          />

          <StatCard
            label="Paid"
            value={`${formatAmount(paidAmount)} SAR`}
            description={`${paidCount} paid records`}
          />

          <StatCard
            label="Pending"
            value={`${formatAmount(pendingAmount)} SAR`}
            description={`${pendingCount} pending`}
          />
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-bold text-slate-900">
                  Earnings Records
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Every completed order can generate an
                  agent earning.
                </p>
              </div>

              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                {earningRows.length} record
                {earningRows.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>

          {earningRows.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                $
              </div>

              <h3 className="mt-4 font-bold text-slate-900">
                No earnings yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Agent earnings will appear here when an
                assigned order is completed.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left">
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Agent
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Order
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Amount
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Created
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Paid At
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {earningRows.map((earning) => {
                    const agent = agentMap.get(
                      earning.agent_id
                    );

                    return (
                      <tr
                        key={earning.id}
                        className="border-b border-slate-100 last:border-b-0"
                      >
                        <td className="px-6 py-5">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {agent?.full_name ||
                                "Unknown Agent"}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {agent
                                ? getAgentTypeLabel(
                                    agent.agent_type
                                  )
                                : "Agent"}
                            </p>

                            {agent?.phone && (
                              <p className="mt-1 text-xs text-slate-400">
                                {agent.phone}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <Link
                            href={`/admin/orders/${earning.order_id}`}
                            className="font-mono text-xs font-semibold text-cyan-700 transition hover:text-cyan-900"
                          >
                            {earning.order_id.slice(0, 8)}
                          </Link>
                        </td>

                        <td className="px-6 py-5">
                          <p className="font-bold text-slate-900">
                            {formatAmount(
                              Number(earning.amount)
                            )}{" "}
                            SAR
                          </p>
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold ${getStatusClasses(
                              earning.status
                            )}`}
                          >
                            {getStatusLabel(
                              earning.status
                            )}
                          </span>
                        </td>

                        <td className="px-6 py-5 text-sm text-slate-500">
                          {formatDate(
                            earning.created_at
                          )}
                        </td>

                        <td className="px-6 py-5 text-sm text-slate-500">
                          {earning.paid_at
                            ? formatDate(
                                earning.paid_at
                              )
                            : "—"}
                        </td>

                        <td className="px-6 py-5">
                          <PayoutStatusManager
                            earningId={earning.id}
                            currentStatus={earning.status}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mt-6 rounded-2xl border border-cyan-100 bg-cyan-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-cyan-700">
            MVP Payout Workflow
          </p>

          <p className="mt-2 text-sm leading-6 text-cyan-900">
            Completed orders automatically create an
            available earning for the assigned agent.
            Marking an earning as paid is a demo action in
            the MVP. Actual bank payout integration is not
            included.
          </p>
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