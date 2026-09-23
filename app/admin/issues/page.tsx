import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import IssueStatusManager from "./IssueStatusManager";

type Issue = {
  id: string;
  order_id: string | null;
  customer_id: string;
  subject: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  admin_note: string | null;
  created_at: string;
  updated_at: string;
};

type Profile = {
  id: string;
  full_name: string | null;
};

type IssuesPageProps = {
  searchParams: Promise<{
    search?: string;
    status?: string;
    priority?: string;
  }>;
};

function formatDate(date: string) {
  return new Date(date).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatStatus(status: Issue["status"]) {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatPriority(priority: Issue["priority"]) {
  return (
    priority.charAt(0).toUpperCase() +
    priority.slice(1)
  );
}

function getStatusClasses(status: Issue["status"]) {
  switch (status) {
    case "open":
      return "bg-red-50 text-red-700 border-red-200";

    case "in_progress":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "resolved":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "closed":
      return "bg-slate-100 text-slate-600 border-slate-200";

    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

function getPriorityClasses(priority: Issue["priority"]) {
  switch (priority) {
    case "urgent":
      return "bg-red-50 text-red-700 border-red-200";

    case "high":
      return "bg-orange-50 text-orange-700 border-orange-200";

    case "medium":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "low":
      return "bg-slate-100 text-slate-600 border-slate-200";

    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

export default async function AdminIssuesPage({
  searchParams,
}: IssuesPageProps) {
  const params = await searchParams;

  const search = params.search?.trim() || "";
  const status = params.status || "all";
  const priority = params.priority || "all";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/admin/login");
  }

  const { data: issuesData, error } = await supabase
    .from("issues")
    .select(
      `
        id,
        order_id,
        customer_id,
        subject,
        description,
        status,
        priority,
        admin_note,
        created_at,
        updated_at
      `
    )
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <h1 className="text-lg font-bold text-red-800">
              Could not load issues
            </h1>

            <p className="mt-2 text-sm text-red-700">
              {error.message}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const issues = (issuesData || []) as Issue[];

  const customerIds = Array.from(
    new Set(issues.map((issue) => issue.customer_id))
  );

  let profiles: Profile[] = [];

  if (customerIds.length > 0) {
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", customerIds);

    profiles = (profilesData || []) as Profile[];
  }

  const profileMap = new Map(
    profiles.map((profile) => [
      profile.id,
      profile.full_name || "Unknown Customer",
    ])
  );

  const totalCount = issues.length;

  const openCount = issues.filter(
    (issue) => issue.status === "open"
  ).length;

  const inProgressCount = issues.filter(
    (issue) => issue.status === "in_progress"
  ).length;

  const resolvedCount = issues.filter(
    (issue) => issue.status === "resolved"
  ).length;

  const urgentCount = issues.filter(
    (issue) => issue.priority === "urgent"
  ).length;

  const filteredIssues = issues.filter((issue) => {
    const customerName =
      profileMap.get(issue.customer_id) ||
      "Unknown Customer";

    const searchMatch =
      !search ||
      issue.subject
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      issue.description
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      customerName
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      (issue.order_id || "")
        .toLowerCase()
        .includes(search.toLowerCase());

    const statusMatch =
      status === "all" || issue.status === status;

    const priorityMatch =
      priority === "all" || issue.priority === priority;

    return searchMatch && statusMatch && priorityMatch;
  });

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              href="/admin"
              className="text-sm font-semibold text-cyan-700 transition hover:text-cyan-800"
            >
              ← Back to Admin Dashboard
            </Link>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
              Issues & Complaints
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Review customer complaints, manage priorities,
              and track issue resolution.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Showing
            </p>

            <p className="mt-1 text-xl font-bold text-slate-900">
              {filteredIssues.length} issues
            </p>
          </div>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Total Issues
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {totalCount}
            </p>
          </div>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
            <p className="text-sm font-semibold text-red-600">
              Open
            </p>

            <p className="mt-2 text-3xl font-bold text-red-700">
              {openCount}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <p className="text-sm font-semibold text-amber-700">
              In Progress
            </p>

            <p className="mt-2 text-3xl font-bold text-amber-700">
              {inProgressCount}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <p className="text-sm font-semibold text-emerald-700">
              Resolved
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-700">
              {resolvedCount}
            </p>
          </div>

          <div className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Urgent
            </p>

            <p className="mt-2 text-3xl font-bold text-red-600">
              {urgentCount}
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <form
            method="GET"
            className="grid gap-4 lg:grid-cols-[1fr_200px_200px_auto]"
          >
            <div>
              <label
                htmlFor="search"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Search
              </label>

              <input
                id="search"
                name="search"
                defaultValue={search}
                placeholder="Search subject, customer, order..."
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
                defaultValue={status}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">
                  In Progress
                </option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="priority"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Priority
              </label>

              <select
                id="priority"
                name="priority"
                defaultValue={priority}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full rounded-xl bg-cyan-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-cyan-800"
              >
                Apply Filters
              </button>
            </div>
          </form>
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-lg font-bold text-slate-900">
              Customer Issues
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Manage and resolve reported problems.
            </p>
          </div>

          {filteredIssues.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">
                ✓
              </div>

              <h3 className="mt-5 text-lg font-bold text-slate-900">
                No issues found
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                No complaints match the current filters.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="p-6 transition hover:bg-slate-50"
                >
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-bold ${getPriorityClasses(
                            issue.priority
                          )}`}
                        >
                          {formatPriority(issue.priority)}
                        </span>

                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-bold ${getStatusClasses(
                            issue.status
                          )}`}
                        >
                          {formatStatus(issue.status)}
                        </span>
                      </div>

                      <h3 className="mt-3 text-lg font-bold text-slate-900">
                        {issue.subject}
                      </h3>

                      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                        {issue.description}
                      </p>

                      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                            Customer
                          </p>

                          <p className="mt-1 font-semibold text-slate-700">
                            {profileMap.get(
                              issue.customer_id
                            ) || "Unknown Customer"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                            Order
                          </p>

                          <p className="mt-1 break-all font-semibold text-slate-700">
                            {issue.order_id || "General Issue"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                            Created
                          </p>

                          <p className="mt-1 font-semibold text-slate-700">
                            {formatDate(issue.created_at)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                            Issue ID
                          </p>

                          <p className="mt-1 break-all font-semibold text-slate-700">
                            {issue.id}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="w-full xl:max-w-md">
                      <IssueStatusManager
                        issueId={issue.id}
                        initialStatus={issue.status}
                        initialPriority={issue.priority}
                        initialNote={issue.admin_note}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}