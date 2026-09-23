"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type AgentStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "suspended";

type AgentType =
  | "driver"
  | "motorcycle_rider"
  | "personal_shopper";

type Agent = {
  id: string;
  full_name: string | null;
  role: "agent";
  agent_status: AgentStatus | null;
  created_at: string;
  agent_profiles: {
    agent_type: AgentType;
    phone: string;
    city: string | null;
    vehicle_make: string | null;
    vehicle_model: string | null;
    vehicle_year: number | null;
    vehicle_plate_number: string | null;
  } | null;
};

type FilterStatus = "all" | AgentStatus;

export default function AdminAgentsPage() {
  const supabase = createClient();

  const [agents, setAgents] = useState<Agent[]>([]);
  const [filter, setFilter] =
    useState<FilterStatus>("pending");

  const [loading, setLoading] = useState(true);
  const [updatingAgentId, setUpdatingAgentId] =
    useState<string | null>(null);

  const [errorMessage, setErrorMessage] = useState("");

  async function loadAgents() {
    setLoading(true);
    setErrorMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/admin/login";
      return;
    }

    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (
      profileError ||
      !profile ||
      profile.role !== "admin"
    ) {
      window.location.href = "/admin/login";
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        role,
        agent_status,
        created_at,
        agent_profiles (
          agent_type,
          phone,
          city,
          vehicle_make,
          vehicle_model,
          vehicle_year,
          vehicle_plate_number
        )
      `)
      .eq("role", "agent")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      setErrorMessage(
        `Could not load agents: ${error.message}`
      );

      setLoading(false);
      return;
    }

    const normalizedAgents: Agent[] = (data ?? []).map(
      (agent) => ({
        ...agent,
        agent_profiles: Array.isArray(
          agent.agent_profiles
        )
          ? agent.agent_profiles[0] ?? null
          : agent.agent_profiles,
      })
    );

    setAgents(normalizedAgents);
    setLoading(false);
  }

  useEffect(() => {
    loadAgents();
  }, []);

  async function updateAgentStatus(
    agentId: string,
    status: AgentStatus
  ) {
    setUpdatingAgentId(agentId);
    setErrorMessage("");

    const { error } = await supabase
      .from("profiles")
      .update({
        agent_status: status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", agentId)
      .eq("role", "agent");

    if (error) {
      setErrorMessage(
        `Could not update Agent status: ${error.message}`
      );

      setUpdatingAgentId(null);
      return;
    }

    setAgents((currentAgents) =>
      currentAgents.map((agent) =>
        agent.id === agentId
          ? {
              ...agent,
              agent_status: status,
            }
          : agent
      )
    );

    setUpdatingAgentId(null);
  }

  const filteredAgents = useMemo(() => {
    if (filter === "all") {
      return agents;
    }

    return agents.filter(
      (agent) => agent.agent_status === filter
    );
  }, [agents, filter]);

  const counts = useMemo(() => {
    return {
      all: agents.length,

      pending: agents.filter(
        (agent) => agent.agent_status === "pending"
      ).length,

      approved: agents.filter(
        (agent) => agent.agent_status === "approved"
      ).length,

      rejected: agents.filter(
        (agent) => agent.agent_status === "rejected"
      ).length,

      suspended: agents.filter(
        (agent) => agent.agent_status === "suspended"
      ).length,
    };
  }, [agents]);

  function getAgentTypeLabel(type?: AgentType) {
    switch (type) {
      case "driver":
        return "Driver";

      case "motorcycle_rider":
        return "Motorcycle Rider";

      case "personal_shopper":
        return "Personal Shopper";

      default:
        return "—";
    }
  }

  function getStatusLabel(status: AgentStatus | null) {
    switch (status) {
      case "pending":
        return "Pending";

      case "approved":
        return "Approved";

      case "rejected":
        return "Rejected";

      case "suspended":
        return "Suspended";

      default:
        return "Unknown";
    }
  }

  function getStatusClasses(
    status: AgentStatus | null
  ) {
    switch (status) {
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";

      case "approved":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";

      case "rejected":
        return "bg-red-50 text-red-700 border-red-200";

      case "suspended":
        return "bg-slate-100 text-slate-700 border-slate-200";

      default:
        return "bg-slate-100 text-slate-500 border-slate-200";
    }
  }

  function formatDate(date: string) {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(date));
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
                Agent Management
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
            Platform Operations
          </p>

          <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Agents
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Review Agent applications, monitor verification
            status, and manage Agent access to the platform.
          </p>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            label="All Agents"
            value={counts.all}
            active={filter === "all"}
            onClick={() => setFilter("all")}
          />

          <StatCard
            label="Pending"
            value={counts.pending}
            active={filter === "pending"}
            onClick={() => setFilter("pending")}
          />

          <StatCard
            label="Approved"
            value={counts.approved}
            active={filter === "approved"}
            onClick={() => setFilter("approved")}
          />

          <StatCard
            label="Rejected"
            value={counts.rejected}
            active={filter === "rejected"}
            onClick={() => setFilter("rejected")}
          />

          <StatCard
            label="Suspended"
            value={counts.suspended}
            active={filter === "suspended"}
            onClick={() => setFilter("suspended")}
          />
        </section>

        {errorMessage && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
            {errorMessage}
          </div>
        )}

        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-bold text-slate-900">
                {filter === "all"
                  ? "All Agents"
                  : `${getStatusLabel(filter)} Agents`}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {filteredAgents.length} Agent
                {filteredAgents.length === 1
                  ? ""
                  : "s"}
              </p>
            </div>

            <button
              type="button"
              onClick={loadAgents}
              disabled={loading}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {loading ? (
            <div className="flex min-h-72 items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-cyan-700" />

                <p className="mt-4 text-sm text-slate-500">
                  Loading Agents...
                </p>
              </div>
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="flex min-h-72 items-center justify-center px-6">
              <div className="max-w-md text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                  👥
                </div>

                <h3 className="mt-5 text-lg font-bold text-slate-900">
                  No Agents found
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  There are no Agents matching the selected
                  status.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1150px]">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200 text-left">
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Agent
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Type
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Location
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Vehicle
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Applied
                    </th>

                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {filteredAgents.map((agent) => {
                    const profile =
                      agent.agent_profiles;

                    const isUpdating =
                      updatingAgentId === agent.id;

                    const vehicle =
                      profile?.vehicle_make &&
                      profile?.vehicle_model
                        ? `${profile.vehicle_make} ${profile.vehicle_model}`
                        : "No vehicle";

                    return (
                      <tr
                        key={agent.id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-6 py-5">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {agent.full_name ||
                                "Unnamed Agent"}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {profile?.phone ||
                                "No phone"}
                            </p>
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <span className="text-sm font-medium text-slate-700">
                            {getAgentTypeLabel(
                              profile?.agent_type
                            )}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <span className="text-sm text-slate-600">
                            {profile?.city || "—"}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <div>
                            <p className="text-sm font-medium text-slate-700">
                              {vehicle}
                            </p>

                            {profile?.vehicle_year && (
                              <p className="mt-1 text-xs text-slate-500">
                                {profile.vehicle_year}
                                {profile.vehicle_plate_number
                                  ? ` • ${profile.vehicle_plate_number}`
                                  : ""}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(
                              agent.agent_status
                            )}`}
                          >
                            {getStatusLabel(
                              agent.agent_status
                            )}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <span className="text-sm text-slate-600">
                            {formatDate(
                              agent.created_at
                            )}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex justify-end gap-2">
                            <Link
                              href={`/admin/agents/${agent.id}`}
                              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700"
                            >
                              View Details
                            </Link>

                            {agent.agent_status ===
                              "pending" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateAgentStatus(
                                      agent.id,
                                      "approved"
                                    )
                                  }
                                  disabled={isUpdating}
                                  className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {isUpdating
                                    ? "Updating..."
                                    : "Approve"}
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    updateAgentStatus(
                                      agent.id,
                                      "rejected"
                                    )
                                  }
                                  disabled={isUpdating}
                                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {agent.agent_status ===
                              "approved" && (
                              <button
                                type="button"
                                onClick={() =>
                                  updateAgentStatus(
                                    agent.id,
                                    "suspended"
                                  )
                                }
                                disabled={isUpdating}
                                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Suspend
                              </button>
                            )}

                            {(agent.agent_status ===
                              "rejected" ||
                              agent.agent_status ===
                                "suspended") && (
                              <button
                                type="button"
                                onClick={() =>
                                  updateAgentStatus(
                                    agent.id,
                                    "approved"
                                  )
                                }
                                disabled={isUpdating}
                                className="rounded-lg bg-cyan-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Approve
                              </button>
                            )}
                          </div>
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

function StatCard({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        active
          ? "border-cyan-300 ring-2 ring-cyan-100"
          : "border-slate-200"
      }`}
    >
      <p className="text-sm font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-3 text-3xl font-bold text-slate-900">
        {value}
      </p>
    </button>
  );
}