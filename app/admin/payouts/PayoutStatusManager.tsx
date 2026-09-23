"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type EarningStatus =
  | "pending"
  | "available"
  | "paid"
  | "cancelled";

export default function PayoutStatusManager({
  earningId,
  currentStatus,
}: {
  earningId: string;
  currentStatus: EarningStatus;
}) {
  const supabase = createClient();

  const [status, setStatus] =
    useState<EarningStatus>(currentStatus);

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] =
    useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  async function markAsPaid() {
    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    const paidAt = new Date().toISOString();

    const { error } = await supabase
      .from("agent_earnings")
      .update({
        status: "paid",
        paid_at: paidAt,
        updated_at: paidAt,
      })
      .eq("id", earningId);

    if (error) {
      setErrorMessage(
        `Could not update payout: ${error.message}`
      );
      setSaving(false);
      return;
    }

    setStatus("paid");
    setSuccessMessage(
      "Payout marked as paid successfully."
    );
    setSaving(false);

    window.setTimeout(() => {
      window.location.reload();
    }, 700);
  }

  if (status === "paid") {
    return (
      <span className="inline-flex rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
        Paid
      </span>
    );
  }

  if (status === "cancelled") {
    return (
      <span className="inline-flex rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
        Cancelled
      </span>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={markAsPaid}
        disabled={saving || status !== "available"}
        className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? "Processing..." : "Mark as Paid"}
      </button>

      {errorMessage && (
        <p className="mt-2 max-w-48 text-xs leading-5 text-red-600">
          {errorMessage}
        </p>
      )}

      {successMessage && (
        <p className="mt-2 max-w-48 text-xs leading-5 text-emerald-600">
          {successMessage}
        </p>
      )}
    </div>
  );
}