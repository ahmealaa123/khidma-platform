"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AgentAvailabilityToggle({
  initialOnline,
}: {
  initialOnline: boolean;
}) {
  const supabase = createClient();

  const [isOnline, setIsOnline] =
    useState(initialOnline);

  const [saving, setSaving] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  async function toggleAvailability() {
    setSaving(true);
    setErrorMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setErrorMessage(
        "Your session has expired. Please log in again."
      );

      setSaving(false);
      return;
    }

    const nextOnlineStatus = !isOnline;

    const { error } = await supabase
      .from("agent_profiles")
      .update({
        is_online: nextOnlineStatus,
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      setErrorMessage(
        `Could not update availability: ${error.message}`
      );

      setSaving(false);
      return;
    }

    setIsOnline(nextOnlineStatus);
    setSaving(false);
  }

  useEffect(() => {
    if (!isOnline) {
      return;
    }

    const interval = window.setInterval(
      async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          return;
        }

        await supabase
          .from("agent_profiles")
          .update({
            last_seen_at:
              new Date().toISOString(),
          })
          .eq("id", user.id);
      },
      60_000
    );

    return () => {
      window.clearInterval(interval);
    };
  }, [isOnline, supabase]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Availability
          </p>

          <h3 className="mt-2 text-xl font-bold text-slate-900">
            {isOnline
              ? "You are Online"
              : "You are Offline"}
          </h3>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            {isOnline
              ? "You can receive available tasks."
              : "You will not appear as available for new tasks."}
          </p>
        </div>

        <button
          type="button"
          onClick={toggleAvailability}
          disabled={saving}
          className={`inline-flex min-w-36 items-center justify-center rounded-xl px-5 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
            isOnline
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "bg-slate-900 text-white hover:bg-slate-800"
          }`}
        >
          {saving
            ? "Updating..."
            : isOnline
              ? "Go Offline"
              : "Go Online"}
        </button>
      </div>

      <div className="mt-5 flex items-center gap-2">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            isOnline
              ? "bg-emerald-500"
              : "bg-slate-400"
          }`}
        />

        <span className="text-xs font-semibold text-slate-600">
          {isOnline
            ? "Available for tasks"
            : "Not available for tasks"}
        </span>
      </div>

      {errorMessage && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {errorMessage}
        </div>
      )}
    </div>
  );
}