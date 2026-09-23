"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type DocumentStatus =
  | "pending"
  | "approved"
  | "rejected";

type DocumentItem = {
  id: string;
  document_type: string;
  file_name: string;
  status: DocumentStatus;
  rejection_reason: string | null;
  signedUrl: string | null;
};

export default function DocumentReview({
  document,
}: {
  document: DocumentItem;
}) {
  const supabase = createClient();

  const [status, setStatus] =
    useState<DocumentStatus>(document.status);

  const [rejectionReason, setRejectionReason] =
    useState(document.rejection_reason ?? "");

  const [showRejectForm, setShowRejectForm] =
    useState(false);

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] =
    useState("");

  function getDocumentTypeLabel(type: string) {
    switch (type) {
      case "national_id":
        return "National ID";

      case "driving_license":
        return "Driving License";

      case "vehicle_registration":
        return "Vehicle Registration";

      case "profile_photo":
        return "Profile Photo";

      default:
        return "Document";
    }
  }

  async function updateStatus(
    nextStatus: DocumentStatus,
    reason: string | null = null
  ) {
    setSaving(true);
    setErrorMessage("");

    const { error } = await supabase
      .from("agent_documents")
      .update({
        status: nextStatus,
        rejection_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq("id", document.id);

    if (error) {
      setErrorMessage(
        `Could not update document: ${error.message}`
      );

      setSaving(false);
      return;
    }

    setStatus(nextStatus);
    setRejectionReason(reason ?? "");
    setShowRejectForm(false);
    setSaving(false);
  }

  async function handleReject() {
    const reason = rejectionReason.trim();

    if (!reason) {
      setErrorMessage(
        "Please enter a rejection reason."
      );
      return;
    }

    await updateStatus("rejected", reason);
  }

  const statusClasses =
    status === "approved"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "rejected"
        ? "border-red-200 bg-red-50 text-red-700"
        : "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white p-5">
        <div className="min-w-0">
          <h4 className="font-bold text-slate-900">
            {getDocumentTypeLabel(
              document.document_type
            )}
          </h4>

          <p className="mt-1 truncate text-xs text-slate-500">
            {document.file_name}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusClasses}`}
        >
          {status}
        </span>
      </div>

      <div className="p-5">
        {document.signedUrl ? (
          <a
            href={document.signedUrl}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-32 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center transition hover:border-cyan-300 hover:bg-cyan-50"
          >
            <div>
              <div className="text-3xl">
                📄
              </div>

              <p className="mt-3 text-sm font-semibold text-cyan-700">
                Open Document
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Opens securely in a new tab
              </p>
            </div>
          </a>
        ) : (
          <div className="flex min-h-32 items-center justify-center rounded-xl border border-dashed border-red-200 bg-red-50 px-4 py-8 text-center">
            <div>
              <div className="text-2xl">
                ⚠️
              </div>

              <p className="mt-2 text-sm font-semibold text-red-700">
                Document unavailable
              </p>
            </div>
          </div>
        )}

        {status === "rejected" &&
          rejectionReason && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
                Rejection Reason
              </p>

              <p className="mt-1 text-sm leading-6 text-red-700">
                {rejectionReason}
              </p>
            </div>
          )}

        {errorMessage && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="mt-5">
          {!showRejectForm ? (
            <div className="flex flex-wrap gap-2">
              {status !== "approved" && (
                <button
                  type="button"
                  onClick={() =>
                    updateStatus("approved")
                  }
                  disabled={saving}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : "Approve Document"}
                </button>
              )}

              {status !== "rejected" && (
                <button
                  type="button"
                  onClick={() =>
                    setShowRejectForm(true)
                  }
                  disabled={saving}
                  className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Reject Document
                </button>
              )}

              {status === "rejected" && (
                <button
                  type="button"
                  onClick={() =>
                    setShowRejectForm(true)
                  }
                  disabled={saving}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Change Decision
                </button>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-red-200 bg-white p-4">
              <label
                htmlFor={`rejection-${document.id}`}
                className="block text-sm font-semibold text-slate-800"
              >
                Rejection Reason
              </label>

              <textarea
                id={`rejection-${document.id}`}
                value={rejectionReason}
                onChange={(event) =>
                  setRejectionReason(
                    event.target.value
                  )
                }
                rows={3}
                placeholder="Explain why this document cannot be accepted..."
                className="mt-3 w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-red-400 focus:ring-4 focus:ring-red-100"
              />

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={saving}
                  className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : "Confirm Rejection"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setShowRejectForm(false)
                  }
                  disabled={saving}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}