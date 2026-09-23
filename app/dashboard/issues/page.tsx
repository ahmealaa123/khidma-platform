import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Issue = {
  id: string;
  order_id: string | null;
  subject: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  admin_note: string | null;
  created_at: string;
  updated_at: string;
};

type IssuesPageProps = {
  searchParams: Promise<{
    search?: string;
    status?: string;
  }>;
};

const statusLabels: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

function formatDate(date: string) {
  return new Date(date).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getStatusClasses(status: Issue["status"]) {
  switch (status) {
    case "open":
      return "border-red-200 bg-red-50 text-red-700";

    case "in_progress":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "resolved":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "closed":
      return "border-slate-200 bg-slate-100 text-slate-600";

    default:
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
}

function getPriorityClasses(
  priority: Issue["priority"]
) {
  switch (priority) {
    case "urgent":
      return "border-red-200 bg-red-50 text-red-700";

    case "high":
      return "border-orange-200 bg-orange-50 text-orange-700";

    case "medium":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "low":
      return "border-slate-200 bg-slate-100 text-slate-600";

    default:
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
}

function formatPriority(priority: Issue["priority"]) {
  return (
    priority.charAt(0).toUpperCase() +
    priority.slice(1)
  );
}

export default async function CustomerIssuesPage({
  searchParams,
}: IssuesPageProps) {
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

  const { data: issuesData, error } = await supabase
    .from("issues")
    .select(
      `
        id,
        order_id,
        subject,
        description,
        status,
        priority,
        admin_note,
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
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <h1 className="text-lg font-bold text-red-800">
              Unable to load issues
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

  const totalIssues = issues.length;

  const openIssues = issues.filter(
    (issue) => issue.status === "open"
  ).length;

  const inProgressIssues = issues.filter(
    (issue) => issue.status === "in_progress"
  ).length;

  const resolvedIssues = issues.filter(
    (issue) => issue.status === "resolved"
  ).length;

  const closedIssues = issues.filter(
    (issue) => issue.status === "closed"
  ).length;

  const filteredIssues = issues.filter((issue) => {
    const searchableText = [
      issue.subject,
      issue.description,
      issue.order_id || "",
      issue.priority,
      statusLabels[issue.status],
      issue.admin_note || "",
    ]
      .join(" ")
      .toLowerCase();

    const searchMatch =
      !search ||
      searchableText.includes(search.toLowerCase());

    const statusMatch =
      statusFilter === "all" ||
      issue.status === statusFilter;

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
              My Issues
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              View and track the issues and complaints you
              have submitted.
            </p>
          </div>
        </div>

        {/* Stats */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Total Issues
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {totalIssues}
            </p>
          </div>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
            <p className="text-sm font-medium text-red-700">
              Open
            </p>

            <p className="mt-2 text-3xl font-bold text-red-700">
              {openIssues}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <p className="text-sm font-medium text-amber-700">
              In Progress
            </p>

            <p className="mt-2 text-3xl font-bold text-amber-700">
              {inProgressIssues}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <p className="text-sm font-medium text-emerald-700">
              Resolved
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-700">
              {resolvedIssues}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Closed
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-700">
              {closedIssues}
            </p>
          </div>
        </section>

        {/* Filters */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <form
            method="GET"
            className="grid gap-4 md:grid-cols-[1fr_220px_auto]"
          >
            <div>
              <label
                htmlFor="search"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Search Issues
              </label>

              <input
                id="search"
                name="search"
                type="text"
                defaultValue={search}
                placeholder="Search subject, order ID, description..."
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

                <option value="open">
                  Open
                </option>

                <option value="in_progress">
                  In Progress
                </option>

                <option value="resolved">
                  Resolved
                </option>

                <option value="closed">
                  Closed
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

        {/* Issues */}
        <section className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">
              Issue History
            </h2>

            <span className="text-sm text-slate-500">
              {filteredIssues.length}{" "}
              {filteredIssues.length === 1
                ? "issue"
                : "issues"}
            </span>
          </div>

          {filteredIssues.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-xl">
                ✓
              </div>

              <h3 className="mt-4 text-lg font-bold text-slate-900">
                No issues found
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {issues.length === 0
                  ? "You have not submitted any issues yet."
                  : "No issues match your current search or status filter."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredIssues.map((issue) => (
                <article
                  key={issue.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold ${getStatusClasses(
                            issue.status
                          )}`}
                        >
                          {statusLabels[issue.status]}
                        </span>

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold ${getPriorityClasses(
                            issue.priority
                          )}`}
                        >
                          {formatPriority(issue.priority)}
                        </span>

                        <span className="text-xs text-slate-400">
                          {formatDate(issue.created_at)}
                        </span>
                      </div>

                      <h3 className="mt-3 text-lg font-bold text-slate-900">
                        {issue.subject}
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {issue.description}
                      </p>

                      <div className="mt-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                          Related Order
                        </p>

                        {issue.order_id ? (
                          <Link
                            href={`/dashboard/orders/${issue.order_id}`}
                            className="mt-1 inline-block break-all text-sm font-semibold text-cyan-700 transition hover:text-cyan-800"
                          >
                            {issue.order_id}
                          </Link>
                        ) : (
                          <p className="mt-1 text-sm text-slate-600">
                            General Issue
                          </p>
                        )}
                      </div>

                      {issue.admin_note && (
                        <div className="mt-5 rounded-xl border border-cyan-100 bg-cyan-50 p-4">
                          <p className="text-xs font-bold uppercase tracking-wide text-cyan-700">
                            Support Team Note
                          </p>

                          <p className="mt-2 text-sm leading-6 text-cyan-900">
                            {issue.admin_note}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 lg:text-right">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Last Updated
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {formatDate(issue.updated_at)}
                      </p>
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