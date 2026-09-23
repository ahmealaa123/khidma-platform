import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminLogoutButton from "./AdminLogoutButton";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/admin/login");
  }

  const { count: pendingAgents } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "agent")
    .eq("agent_status", "pending");

  const { count: approvedAgents } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "agent")
    .eq("agent_status", "approved");

  const { count: customers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "customer");

  const { count: totalOrders } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true });

  const { count: activeOrders } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .neq("status", "delivered")
    .neq("status", "cancelled");

  const { count: deliveredOrders } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("status", "delivered");

  const { count: cancelledOrders } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("status", "cancelled");

  const { count: openIssues } = await supabase
    .from("issues")
    .select("*", { count: "exact", head: true })
    .in("status", ["open", "in_progress"]);

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
                Administration
              </p>

              <h1 className="text-xl font-bold text-slate-900">
                Khidma Admin Portal
              </h1>
            </div>
          </div>

          <AdminLogoutButton />
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Welcome back
          </p>

          <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            {profile.full_name || "Administrator"}
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Manage your platform operations from one workspace.
          </p>
        </div>

        {/* Overview */}
        <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardCard
            title="Pending Agents"
            value={pendingAgents ?? 0}
            description="Applications waiting for review"
            href="/admin/agents"
          />

          <DashboardCard
            title="Approved Agents"
            value={approvedAgents ?? 0}
            description="Agents currently approved"
            href="/admin/agents"
          />

          <DashboardCard
            title="Customers"
            value={customers ?? 0}
            description="Registered customer accounts"
            href="/admin/customers"
          />

          <DashboardCard
            title="Total Orders"
            value={totalOrders ?? 0}
            description="All platform orders"
            href="/admin/orders"
          />

          <DashboardCard
            title="Active Orders"
            value={activeOrders ?? 0}
            description="Orders currently in progress"
            href="/admin/orders"
          />

          <DashboardCard
            title="Delivered Orders"
            value={deliveredOrders ?? 0}
            description="Successfully completed orders"
            href="/admin/orders"
          />

          <DashboardCard
            title="Cancelled Orders"
            value={cancelledOrders ?? 0}
            description="Orders that were cancelled"
            href="/admin/orders"
          />

          <DashboardCard
            title="Open Issues"
            value={openIssues ?? 0}
            description="Issues requiring attention"
            href="/admin/issues"
          />
        </section>

        {/* Main Management */}
        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          <AdminSection
            title="Agent Management"
            description="Review applications, verify documents, and manage Agent accounts."
            href="/admin/agents"
            action="Manage Agents"
          />

          <AdminSection
            title="Orders"
            description="Monitor requests, assignments, statuses, and completed services."
            href="/admin/orders"
            action="Manage Orders"
          />

          <AdminSection
            title="Customers"
            description="View customer accounts and their platform activity."
            href="/admin/customers"
            action="Manage Customers"
          />

          <AdminSection
            title="Issues & Complaints"
            description="Review customer complaints, update issue status, and communicate support notes."
            href="/admin/issues"
            action="Manage Issues"
          />

          <AdminSection
            title="Payments"
            description="Monitor customer payments, payment status, and transaction records."
            href="/admin/payments"
            action="Manage Payments"
          />

          <AdminSection
            title="Agent Payouts"
            description="Review agent earnings and manage payout records."
            href="/admin/payouts"
            action="Manage Payouts"
          />
        </section>

        {/* Operations */}
        <section className="mt-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-700">
                Operations
              </p>

              <h3 className="mt-1 text-xl font-bold text-slate-900">
                Admin Workspace
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Access the main operational modules of the
                Khidma platform from one workspace.
              </p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <QuickLink
                title="Agents"
                description="Verification"
                href="/admin/agents"
              />

              <QuickLink
                title="Orders"
                description="Operations"
                href="/admin/orders"
              />

              <QuickLink
                title="Customers"
                description="Accounts"
                href="/admin/customers"
              />

              <QuickLink
                title="Payments"
                description="Transactions"
                href="/admin/payments"
              />

              <QuickLink
                title="Payouts"
                description="Agent Earnings"
                href="/admin/payouts"
              />

              <QuickLink
                title="Issues"
                description="Complaints"
                href="/admin/issues"
              />

              <QuickLink
                title="Reviews"
                description="Customer Feedback"
                href="/admin/reviews"
              />

              <QuickLink
                title="Analytics"
                description="Platform Insights"
                href="/admin/analytics"
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function DashboardCard({
  title,
  value,
  description,
  href,
}: {
  title: string;
  value: number | string;
  description: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-md"
    >
      <p className="text-sm font-medium text-slate-500">
        {title}
      </p>

      <p className="mt-3 text-3xl font-bold text-slate-900">
        {value}
      </p>

      <p className="mt-2 text-xs leading-5 text-slate-500">
        {description}
      </p>
    </a>
  );
}

function AdminSection({
  title,
  description,
  href,
  action,
}: {
  title: string;
  description: string;
  href: string;
  action: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-lg text-cyan-700">
        ◆
      </div>

      <h3 className="mt-5 text-lg font-bold text-slate-900">
        {title}
      </h3>

      <p className="mt-2 min-h-[72px] text-sm leading-6 text-slate-500">
        {description}
      </p>

      <a
        href={href}
        className="mt-5 inline-flex items-center font-semibold text-cyan-700 transition hover:text-cyan-800"
      >
        {action}
        <span className="ml-2">→</span>
      </a>
    </div>
  );
}

function QuickLink({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-cyan-200 hover:bg-cyan-50"
    >
      <p className="font-semibold text-slate-900">
        {title}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {description}
      </p>
    </a>
  );
}