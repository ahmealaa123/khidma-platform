"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Agent = {
  id: string;
  full_name: string | null;
  agent_type: string;
  phone: string;
  city: string | null;
};

type AgentAssignmentProps = {
  orderId: string;
  currentAgentId: string | null;
  agents: Agent[];
};

export default function AgentAssignment({
  orderId,
  currentAgentId,
  agents,
}: AgentAssignmentProps) {
  const supabase = createClient();

  const [selectedAgentId, setSelectedAgentId] = useState(
    currentAgentId ?? ""
  );

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

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

  async function handleAssignment() {
    if (!selectedAgentId) {
      setErrorMessage("Please select an agent.");
      setMessage("");
      return;
    }

    setSaving(true);
    setErrorMessage("");
    setMessage("");

    const { error } = await supabase
      .from("orders")
      .update({
        agent_id: selectedAgentId,
        status: "agent_assigned",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (error) {
      setErrorMessage(
        `Could not assign agent: ${error.message}`
      );
      setSaving(false);
      return;
    }

    setMessage("Agent assigned successfully.");

    setSaving(false);

    window.setTimeout(() => {
      window.location.reload();
    }, 700);
  }

  const selectedAgent = agents.find(
    (agent) => agent.id === selectedAgentId
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <p className="text-sm font-medium text-slate-500">
          Order Assignment
        </p>

        <h3 className="mt-1 text-lg font-bold text-slate-900">
          Assign Agent
        </h3>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          Select an approved agent to handle this order.
        </p>
      </div>

      {agents.length === 0 ? (
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-800">
            No approved agents available.
          </p>

          <p className="mt-1 text-xs leading-5 text-amber-700">
            Approve at least one agent before assigning an
            order.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-5">
            <label
              htmlFor="agent"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Select Agent
            </label>

            <select
              id="agent"
              value={selectedAgentId}
              onChange={(event) =>
                setSelectedAgentId(event.target.value)
              }
              disabled={saving}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-50"
            >
              <option value="">
                Select an approved agent
              </option>

              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.full_name || "Unnamed Agent"} —{" "}
                  {getAgentTypeLabel(agent.agent_type)}
                </option>
              ))}
            </select>
          </div>

          {selectedAgent && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {selectedAgent.full_name ||
                      "Unnamed Agent"}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {getAgentTypeLabel(
                      selectedAgent.agent_type
                    )}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <p className="text-xs text-slate-500">
                    Phone
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {selectedAgent.phone}
                  </p>
                </div>
              </div>

              {selectedAgent.city && (
                <p className="mt-3 text-xs text-slate-500">
                  City:{" "}
                  <span className="font-semibold text-slate-700">
                    {selectedAgent.city}
                  </span>
                </p>
              )}
            </div>
          )}

          {errorMessage && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
              {errorMessage}
            </div>
          )}

          {message && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-700">
              {message}
            </div>
          )}

          <button
            type="button"
            onClick={handleAssignment}
            disabled={saving || !selectedAgentId}
            className="mt-5 w-full rounded-xl bg-cyan-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Assigning Agent..."
              : currentAgentId
                ? "Reassign Agent"
                : "Assign Agent"}
          </button>
        </>
      )}
    </div>
  );
}