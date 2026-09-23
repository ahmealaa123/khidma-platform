"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded";

export default function PaymentStatusManager({
  paymentId,
  currentStatus,
}: {
  paymentId: string;
  currentStatus: PaymentStatus;
}) {
  const supabase = createClient();

  const [status, setStatus] =
    useState<PaymentStatus>(currentStatus);

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] =
    useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  async function updatePaymentStatus(
    nextStatus: PaymentStatus
  ) {
    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    const updateData: {
      status: PaymentStatus;
      paid_at?: string | null;
      transaction_reference?: string | null;
      updated_at: string;
    } = {
      status: nextStatus,
      updated_at: new Date().toISOString(),
    };

    if (nextStatus === "paid") {
      updateData.paid_at =
        new Date().toISOString();

      updateData.transaction_reference =
        `DEMO-${Date.now()}`;
    }

    if (nextStatus === "failed") {
      updateData.paid_at = null;
      updateData.transaction_reference = null;
    }

    if (nextStatus === "pending") {
      updateData.paid_at = null;
      updateData.transaction_reference = null;
    }

    const { error } = await supabase
      .from("payments")
      .update(updateData)
      .eq("id", paymentId);

    if (error) {
      setErrorMessage(
        `Could not update payment: ${error.message}`
      );

      setSaving(false);
      return;
    }

    setStatus(nextStatus);

    setSuccessMessage(
      `Payment status changed to ${getStatusLabel(
        nextStatus
      )}.`
    );

    setSaving(false);

    window.setTimeout(() => {
      window.location.reload();
    }, 700);
  }

  function getStatusLabel(
    paymentStatus: PaymentStatus
  ) {
    switch (paymentStatus) {
      case "pending":
        return "Pending";

      case "paid":
        return "Paid";

      case "failed":
        return "Failed";

      case "refunded":
        return "Refunded";

      default:
        return paymentStatus;
    }
  }

  function getStatusClasses(
    paymentStatus: PaymentStatus
  ) {
    switch (paymentStatus) {
      case "pending":
        return "border-amber-200 bg-amber-50 text-amber-700";

      case "paid":
        return "border-emerald-200 bg-emerald-50 text-emerald-700";

      case "failed":
        return "border-red-200 bg-red-50 text-red-700";

      case "refunded":
        return "border-purple-200 bg-purple-50 text-purple-700";

      default:
        return "border-slate-200 bg-slate-50 text-slate-600";
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-bold text-slate-900">
            Manage Payment
          </h3>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            Update the payment status using the MVP demo
            payment workflow.
          </p>
        </div>

        <span
          className={`inline-flex w-fit rounded-full border px-3 py-1.5 text-xs font-semibold ${getStatusClasses(
            status
          )}`}
        >
          {getStatusLabel(status)}
        </span>
      </div>

      {errorMessage && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-700">
          {successMessage}
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        {status === "pending" && (
          <>
            <button
              type="button"
              onClick={() =>
                updatePaymentStatus("paid")
              }
              disabled={saving}
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Updating..." : "Mark as Paid"}
            </button>

            <button
              type="button"
              onClick={() =>
                updatePaymentStatus("failed")
              }
              disabled={saving}
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Mark as Failed
            </button>
          </>
        )}

        {status === "failed" && (
          <button
            type="button"
            onClick={() =>
              updatePaymentStatus("pending")
            }
            disabled={saving}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Updating..."
              : "Move Back to Pending"}
          </button>
        )}

        {status === "paid" && (
          <button
            type="button"
            onClick={() =>
              updatePaymentStatus("refunded")
            }
            disabled={saving}
            className="rounded-xl border border-purple-200 bg-purple-50 px-4 py-2.5 text-sm font-semibold text-purple-700 transition hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Updating..."
              : "Mark as Refunded"}
          </button>
        )}

        {status === "refunded" && (
          <div className="rounded-xl border border-purple-200 bg-purple-50 px-4 py-2.5 text-sm font-semibold text-purple-700">
            Payment Refunded
          </div>
        )}
      </div>

      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Demo Payment Flow
        </p>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Pending payments can be marked as paid or failed.
          Paid payments can later be marked as refunded.
        </p>
      </div>
    </div>
  );
}