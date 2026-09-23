import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Earning = {
  id: string;
  order_id: string;
  amount: number;
  status: string;
  paid_at: string | null;
  created_at: string;
};

type Order = {
  id: string;
  service_type: string;
  status: string;
};

const earningStatusLabels: Record<string, string> = {
  pending: "Pending",
  available: "Available",
  paid: "Paid",
  cancelled: "Cancelled",
};

function getStatusClasses(status: string) {
  if (status === "paid") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "available") {
    return "bg-cyan-100 text-cyan-700";
  }

  if (status === "cancelled") {
    return "bg-red-100 text-red-700";
  }

  return "bg-amber-100 text-amber-700";
}

function formatServiceType(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(date: string | null) {
  if (!date) {
    return "—";
  }

  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function AgentEarningsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, agent_status")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "agent") {
    if (profile?.role === "admin") {
      redirect("/admin");
    }

    redirect("/dashboard");
  }

  if (profile.agent_status !== "approved") {
    redirect("/signup/agent/pending");
  }

  const { data: earnings, error } = await supabase
    .from("agent_earnings")
    .select(
      `
        id,
        order_id,
        amount,
        status,
        paid_at,
        created_at
      `
    )
    .eq("agent_id", user.id)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/agent"
            className="text-sm font-semibold text-cyan-700 transition hover:text-cyan-800"
          >
            ← Back to Dashboard
          </Link>

          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6">
            <h1 className="text-lg font-bold text-red-800">
              Unable to load earnings
            </h1>

            <p className="mt-2 text-sm text-red-700">
              {error.message}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const allEarnings = (earnings ?? []) as Earning[];

  const orderIds = allEarnings.map(
    (earning) => earning.order_id
  );

  let orders: Order[] = [];

  if (orderIds.length > 0) {
    const { data: orderData } = await supabase
      .from("orders")
      .select(
        `
          id,
          service_type,
          status
        `
      )
      .in("id", orderIds);

    orders = (orderData ?? []) as Order[];
  }

  const ordersMap = new Map(
    orders.map((order) => [order.id, order])
  );

  const totalEarnings = allEarnings.reduce(
    (total, earning) => total + Number(earning.amount),
    0
  );

  const availableEarnings = allEarnings
    .filter((earning) => earning.status === "available")
    .reduce(
      (total, earning) => total + Number(earning.amount),
      0
    );

  const paidEarnings = allEarnings
    .filter((earning) => earning.status === "paid")
    .reduce(
      (total, earning) => total + Number(earning.amount),
      0
    );

  const pendingEarnings = allEarnings
    .filter((earning) => earning.status === "pending")
    .reduce(
      (total, earning) => total + Number(earning.amount),
      0
    );

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href="/agent"
              className="text-sm font-semibold text-cyan-700 transition hover:text-cyan-800"
            >
              ← Back to Dashboard
            </Link>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
              Earnings
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Track your earnings from completed orders.
            </p>
          </div>

          <Link
            href="/agent/orders"
            className="inline-flex w-fit rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            My Orders
          </Link>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Total Earnings
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {totalEarnings.toFixed(2)} SAR
            </p>

            <p className="mt-1 text-xs text-slate-400">
              All recorded earnings
            </p>
          </div>

          <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5 shadow-sm">
            <p className="text-sm font-medium text-cyan-700">
              Available
            </p>

            <p className="mt-2 text-3xl font-bold text-cyan-700">
              {availableEarnings.toFixed(2)} SAR
            </p>

            <p className="mt-1 text-xs text-cyan-600">
              Available for payout
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <p className="text-sm font-medium text-emerald-700">
              Paid
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-700">
              {paidEarnings.toFixed(2)} SAR
            </p>

            <p className="mt-1 text-xs text-emerald-600">
              Already paid
            </p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <p className="text-sm font-medium text-amber-700">
              Pending
            </p>

            <p className="mt-2 text-3xl font-bold text-amber-700">
              {pendingEarnings.toFixed(2)} SAR
            </p>

            <p className="mt-1 text-xs text-amber-600">
              Awaiting availability
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900">
              Earnings History
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Earnings generated from your completed deliveries.
            </p>
          </div>

          {allEarnings.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-xl">
                💰
              </div>

              <h3 className="mt-4 text-lg font-bold text-slate-900">
                No earnings yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Your earnings will appear here after you
                complete orders.
              </p>

              <Link
                href="/agent/tasks"
                className="mt-6 inline-flex rounded-xl bg-cyan-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-cyan-800"
              >
                View Available Tasks
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Order
                    </th>

                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Service
                    </th>

                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Amount
                    </th>

                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Status
                    </th>

                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Date
                    </th>

                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Paid At
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {allEarnings.map((earning) => {
                    const order = ordersMap.get(
                      earning.order_id
                    );

                    return (
                      <tr
                        key={earning.id}
                        className="border-b border-slate-100 last:border-b-0"
                      >
                        <td className="px-6 py-5">
                          <Link
                            href={`/agent/orders/${earning.order_id}`}
                            className="font-semibold text-cyan-700 transition hover:text-cyan-800"
                          >
                            <span className="block max-w-[180px] truncate">
                              {earning.order_id}
                            </span>
                          </Link>
                        </td>

                        <td className="px-6 py-5">
                          <p className="font-medium text-slate-800">
                            {order
                              ? formatServiceType(
                                  order.service_type
                                )
                              : "Order"}
                          </p>
                        </td>

                        <td className="px-6 py-5">
                          <p className="font-bold text-slate-900">
                            {Number(
                              earning.amount
                            ).toFixed(2)}{" "}
                            SAR
                          </p>
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getStatusClasses(
                              earning.status
                            )}`}
                          >
                            {earningStatusLabels[
                              earning.status
                            ] ?? earning.status}
                          </span>
                        </td>

                        <td className="px-6 py-5 text-sm text-slate-600">
                          {formatDate(earning.created_at)}
                        </td>

                        <td className="px-6 py-5 text-sm text-slate-600">
                          {formatDate(earning.paid_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}