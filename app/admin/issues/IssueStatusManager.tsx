"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type IssueStatus =
  | "open"
  | "in_progress"
  | "resolved"
  | "closed";

type IssuePriority =
  | "low"
  | "medium"
  | "high"
  | "urgent";

type IssueStatusManagerProps = {
  issueId: string;
  initialStatus: IssueStatus;
  initialPriority: IssuePriority;
  initialNote: string | null;
};

export default function IssueStatusManager({
  issueId,
  initialStatus,
  initialPriority,
  initialNote,
}: IssueStatusManagerProps) {
  const supabase = createClient();

  const [status, setStatus] =
    useState<IssueStatus>(initialStatus);

  const [priority, setPriority] =
    useState<IssuePriority>(initialPriority);

  const [note, setNote] = useState(
    initialNote || ""
  );

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] =
    useState("");

  async function handleSave() {
    setSaving(true);
    setMessage("");
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

    const { error } = await supabase
      .from("issues")
      .update({
        status,
        priority,
        admin_note: note.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", issueId);

    if (error) {
      setErrorMessage(
        `Could not update issue: ${error.message}`
      );
      setSaving(false);
      return;
    }

    setMessage(
      "Issue updated successfully."
    );

    setSaving(false);
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor={`status-${issueId}`}
            className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
          >
            Status
          </label>

          <select
            id={`status-${issueId}`}
            value={status}
            onChange={(event) =>
              setStatus(
                event.target.value as IssueStatus
              )
            }
            disabled={saving}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 disabled:bg-slate-100"
          >
            <option value="open">Open</option>

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

        <div>
          <label
            htmlFor={`priority-${issueId}`}
            className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
          >
            Priority
          </label>

          <select
            id={`priority-${issueId}`}
            value={priority}
            onChange={(event) =>
              setPriority(
                event.target.value as IssuePriority
              )
            }
            disabled={saving}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 disabled:bg-slate-100"
          >
            <option value="low">Low</option>

            <option value="medium">
              Medium
            </option>

            <option value="high">High</option>

            <option value="urgent">
              Urgent
            </option>
          </select>
        </div>
      </div>

      <div className="mt-4">
        <label
          htmlFor={`note-${issueId}`}
          className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
        >
          Admin Note
        </label>

        <textarea
          id={`note-${issueId}`}
          value={note}
          onChange={(event) =>
            setNote(event.target.value)
          }
          disabled={saving}
          rows={4}
          maxLength={1000}
          placeholder="Add an internal note about this issue..."
          className="w-full resize-none rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 disabled:bg-slate-100"
        />

        <p className="mt-1 text-right text-xs text-slate-400">
          {note.length}/1000
        </p>
      </div>

      {errorMessage && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {errorMessage}
        </div>
      )}

      {message && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {message}
        </div>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="mt-4 w-full rounded-xl bg-cyan-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? "Saving Changes..." : "Save Changes"}
      </button>
    </div>
  );
}