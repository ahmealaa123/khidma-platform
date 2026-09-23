import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AgentAvailabilityToggle from "./AgentAvailabilityToggle";
import AgentLogoutButton from "./AgentLogoutButton";

const statusLabels: Record<string, string> = {
  agent_assigned: "Assigned",
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

  return "bg-cyan-100 text-cyan-700";
}

export default async function AgentDashboardPage() {
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

  const { data: agentProfile } = await supabase
    .from("agent_profiles")
    .select(
      `
        agent_type,
        phone,
        city,
        vehicle_make,
        vehicle_model,
        vehicle_year,
        vehicle_plate_number,
        is_online,
        last_seen_at
      `
    )
    .eq("id", user.id)
    .single();

  if (profile.agent_status !== "approved") {
    redirect("/signup/agent/pending");
  }

  const { count: assignedOrdersCount } = await supabase
    .from("orders")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("agent_id", user.id)
    .neq("status", "delivered")
    .neq("status", "cancelled");

  const { count: completedOrdersCount } = await supabase
    .from("orders")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("agent_id", user.id)
    .eq("status", "delivered");

  const { count: availableTasksCount } = await supabase
    .from("orders")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("status", "searching_agent")
    .is("agent_id", null);

  const { data: earnings } = await supabase
    .from("agent_earnings")
    .select("amount, status")
    .eq("agent_id", user.id);

  const totalEarnings = (earnings ?? []).reduce(
    (total, earning) => {
      if (
        earning.status === "available" ||
        earning.status === "paid"
      ) {
        return total + Number(earning.amount);
      }

      return total;
    },
    0
  );

  const { data: recentOrders } = await supabase
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
    .eq("agent_id", user.id)
    .order("created_at", {
      ascending: false,
    })
    .limit(5);

  const displayName =
    profile.full_name?.trim() ||
    user.email?.split("@")[0] ||
    "Agent";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-cyan-700">
              Agent Dashboard
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              Welcome, {displayName}
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Manage your tasks, availability, and earnings.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/agent/tasks"
              className="inline-flex items-center justify-center rounded-xl bg-cyan-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-cyan-800"
            >
              Available Tasks
            </Link>

            <AgentLogoutButton />
          </div>
        </header>

        {/* Availability */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span
                  className={`h-3 w-3 rounded-full ${
                    agentProfile?.is_online
                      ? "bg-emerald-500"
                      : "bg-slate-400"
                  }`}
                />

                <h2 className="text-lg font-bold text-slate-900">
                  {agentProfile?.is_online
                    ? "You are Online"
                    : "You are Offline"}
                </h2>
              </div>

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                {agentProfile?.is_online
                  ? "You can now accept available tasks."
                  : "Go online when you are ready to receive and accept tasks."}
              </p>
            </div>

            <div className="w-full lg:w-auto">
              <AgentAvailabilityToggle
                initialOnline={agentProfile?.is_online ?? false}
              />
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                Available Tasks
              </p>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-lg text-cyan-700">
                +
              </div>
            </div>

            <p className="mt-4 text-3xl font-bold text-slate-900">
              {availableTasksCount ?? 0}
            </p>

            <Link
              href="/agent/tasks"
              className="mt-2 inline-block text-xs font-bold text-cyan-700 hover:text-cyan-800"
            >
              View available tasks →
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                Active Orders
              </p>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-lg text-amber-700">
                ●
              </div>
            </div>

            <p className="mt-4 text-3xl font-bold text-slate-900">
              {assignedOrdersCount ?? 0}
            </p>

            <Link
              href="/agent/orders"
              className="mt-2 inline-block text-xs font-bold text-cyan-700 hover:text-cyan-800"
            >
              View my orders →
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                Completed
              </p>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-lg text-emerald-700">
                ✓
              </div>
            </div>

            <p className="mt-4 text-3xl font-bold text-slate-900">
              {completedOrdersCount ?? 0}
            </p>

            <p className="mt-2 text-xs text-slate-400">
              Successfully delivered
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                Total Earnings
              </p>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-lg text-slate-700">
                $
              </div>
            </div>

            <p className="mt-4 text-3xl font-bold text-slate-900">
              {totalEarnings.toFixed(2)}
            </p>

            <p className="mt-2 text-xs text-slate-400">
              SAR recorded earnings
            </p>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mt-8">
          <h2 className="text-xl font-bold text-slate-900">
            Quick Actions
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/agent/tasks"
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-100 text-xl text-cyan-700">
                +
              </div>

              <h3 className="mt-4 text-lg font-bold text-slate-900">
                Available Tasks
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Browse customer requests and accept tasks that
                match your availability.
              </p>

              <span className="mt-4 inline-block text-sm font-bold text-cyan-700 group-hover:text-cyan-800">
                Browse Tasks →
              </span>
            </Link>

            <Link
              href="/agent/orders"
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-xl">
                📦
              </div>

              <h3 className="mt-4 text-lg font-bold text-slate-900">
                My Orders
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Manage your assigned orders and update their
                execution status.
              </p>

              <span className="mt-4 inline-block text-sm font-bold text-cyan-700 group-hover:text-cyan-800">
                View Orders →
              </span>
            </Link>

            <Link
              href="/agent/earnings"
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-xl">
                $
              </div>

              <h3 className="mt-4 text-lg font-bold text-slate-900">
                Earnings
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Review your completed task earnings and payment
                status.
              </p>

              <span className="mt-4 inline-block text-sm font-bold text-cyan-700 group-hover:text-cyan-800">
                View Earnings →
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
                Your latest assigned orders.
              </p>
            </div>

            {recentOrders &&
              recentOrders.length > 0 && (
                <Link
                  href="/agent/orders"
                  className="text-sm font-bold text-cyan-700 transition hover:text-cyan-800"
                >
                  View All
                </Link>
              )}
          </div>

          {!recentOrders || recentOrders.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-xl">
                📦
              </div>

              <h3 className="mt-4 text-lg font-bold text-slate-900">
                No assigned orders yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Browse available tasks when you are online and
                accept a task to start working.
              </p>

              <Link
                href="/agent/tasks"
                className="mt-6 inline-flex rounded-xl bg-cyan-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-cyan-800"
              >
                Browse Available Tasks
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
                          Order Value
                        </p>

                        <p className="mt-1 text-xl font-bold text-slate-900">
                          {Number(order.total_amount).toFixed(
                            2
                          )}{" "}
                          SAR
                        </p>
                      </div>

                      <Link
                        href={`/agent/orders/${order.id}`}
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
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Agent Account
              </h2>

              <div className="mt-2 space-y-1 text-sm text-slate-500">
                <p>
                  Status:{" "}
                  <span className="font-semibold text-emerald-600">
                    Approved
                  </span>
                </p>

                <p>
                  Type:{" "}
                  <span className="font-semibold text-slate-700">
                    {agentProfile?.agent_type
                      ? formatServiceType(
                          agentProfile.agent_type
                        )
                      : "Agent"}
                  </span>
                </p>

                {agentProfile?.city && (
                  <p>
                    City:{" "}
                    <span className="font-semibold text-slate-700">
                      {agentProfile.city}
                    </span>
                  </p>
                )}
              </div>
            </div>

            <Link
              href="/agent/profile"
              className="inline-flex w-fit rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Profile
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}