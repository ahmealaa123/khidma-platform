"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AcceptTaskButton({
  orderId,
  isOnline,
}: {
  orderId: string;
  isOnline: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [accepting, setAccepting] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  async function handleAcceptTask() {
    if (!isOnline) {
      setErrorMessage(
        "You must be online before accepting a task."
      );
      return;
    }

    setAccepting(true);
    setErrorMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setErrorMessage(
        "Your session has expired. Please log in again."
      );

      setAccepting(false);
      return;
    }

    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("role, agent_status")
        .eq("id", user.id)
        .single();

    if (
      profileError ||
      !profile ||
      profile.role !== "agent" ||
      profile.agent_status !== "approved"
    ) {
      setErrorMessage(
        "Your agent account is not approved."
      );

      setAccepting(false);
      return;
    }

    const { data: agentProfile, error: agentError } =
      await supabase
        .from("agent_profiles")
        .select("is_online")
        .eq("id", user.id)
        .single();

    if (
      agentError ||
      !agentProfile ||
      !agentProfile.is_online
    ) {
      setErrorMessage(
        "You must be online before accepting a task."
      );

      setAccepting(false);
      return;
    }

    const { data: updatedOrder, error } =
      await supabase
        .from("orders")
        .update({
          agent_id: user.id,
          status: "agent_assigned",
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", orderId)
        .eq("status", "searching_agent")
        .is("agent_id", null)
        .select("id")
        .single();

    if (error || !updatedOrder) {
      setErrorMessage(
        "This task is no longer available. It may have already been accepted by another agent."
      );

      setAccepting(false);
      return;
    }

    router.push(
      `/agent/orders/${orderId}`
    );

    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleAcceptTask}
        disabled={
          accepting || !isOnline
        }
        className="w-full rounded-xl bg-cyan-700 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {accepting
          ? "Accepting Task..."
          : "Accept Task"}
      </button>

      {!isOnline && (
        <p className="mt-2 text-center text-xs text-amber-700">
          Go online before accepting tasks.
        </p>
      )}

      {errorMessage && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {errorMessage}
        </div>
      )}
    </div>
  );
}