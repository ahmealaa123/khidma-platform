"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type OrderStatus =
  | "created"
  | "confirmed"
  | "searching_agent"
  | "agent_assigned"
  | "going_to_pickup"
  | "arrived_at_pickup"
  | "item_collected"
  | "on_the_way"
  | "delivered"
  | "cancelled";

const statusOptions: {
  value: OrderStatus;
  label: string;
}[] = [
  {
    value: "created",
    label: "Created",
  },
  {
    value: "confirmed",
    label: "Confirmed",
  },
  {
    value: "searching_agent",
    label: "Searching Agent",
  },
  {
    value: "agent_assigned",
    label: "Agent Assigned",
  },
  {
    value: "going_to_pickup",
    label: "Going to Pickup",
  },
  {
    value: "arrived_at_pickup",
    label: "Arrived at Pickup",
  },
  {
    value: "item_collected",
    label: "Item Collected",
  },
  {
    value: "on_the_way",
    label: "On the Way",
  },
  {
    value: "delivered",
    label: "Delivered",
  },
  {
    value: "cancelled",
    label: "Cancelled",
  },
];

export default function OrderStatusManager({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: OrderStatus;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [selectedStatus, setSelectedStatus] =
    useState<OrderStatus>(currentStatus);

  const [note, setNote] = useState("");

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  async function handleUpdateStatus() {
    setErrorMessage("");
    setSuccessMessage("");

    if (selectedStatus === currentStatus) {
      setErrorMessage(
        "Please select a different status."
      );
      return;
    }

    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/admin/login");
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
      router.push("/admin/login");
      return;
    }

    const { error } = await supabase
      .from("orders")
      .update({
        status: selectedStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (error) {
      setErrorMessage(
        `Could not update order: ${error.message}`
      );
      setSaving(false);
      return;
    }

    if (note.trim()) {
      const { error: noteError } = await supabase
        .from("order_status_history")
        .update({
          note: note.trim(),
        })
        .eq("order_id", orderId)
        .eq("status", selectedStatus)
        .order("created_at", {
          ascending: false,
        })
        .limit(1);

      if (noteError) {
        console.error(
          "Could not save status note:",
          noteError
        );
      }
    }

    setSuccessMessage(
      "Order status updated successfully."
    );

    setNote("");
    setSaving(false);

    router.refresh();
  }

  const currentLabel =
    statusOptions.find(
      (option) => option.value === currentStatus
    )?.label ?? currentStatus;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h3 className="font-bold text-slate-900">
          Manage Order
        </h3>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          Update the order status as the request
          progresses through the delivery workflow.
        </p>
      </div>

      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Current Status
        </p>

        <p className="mt-1 text-sm font-bold text-slate-900">
          {currentLabel}
        </p>
      </div>

      <div className="mt-5">
        <label
          htmlFor="order-status"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          New Status
        </label>

        <select
          id="order-status"
          value={selectedStatus}
          onChange={(event) =>
            setSelectedStatus(
              event.target.value as OrderStatus
            )
          }
          disabled={saving}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-50"
        >
          {statusOptions.map((option) => (
            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5">
        <label
          htmlFor="status-note"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          Internal Note
          <span className="ml-1 font-normal text-slate-400">
            (Optional)
          </span>
        </label>

        <textarea
          id="status-note"
          value={note}
          onChange={(event) =>
            setNote(event.target.value)
          }
          disabled={saving}
          rows={3}
          placeholder="Add a note about this status change..."
          className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-50"
        />
      </div>

      {errorMessage && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-700">
          {successMessage}
        </div>
      )}

      <button
        type="button"
        onClick={handleUpdateStatus}
        disabled={
          saving ||
          selectedStatus === currentStatus
        }
        className="mt-5 w-full rounded-xl bg-cyan-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving
          ? "Updating..."
          : "Update Order Status"}
      </button>
    </div>
  );
}