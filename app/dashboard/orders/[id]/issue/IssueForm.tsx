"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type IssueFormProps = {
  orderId: string;
  customerId: string;
};

export default function IssueForm({
  orderId,
  customerId,
}: IssueFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<
    "low" | "medium" | "high" | "urgent"
  >("medium");

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    const trimmedSubject = subject.trim();
    const trimmedDescription = description.trim();

    if (!trimmedSubject) {
      setErrorMessage("Please enter a subject.");
      return;
    }

    if (!trimmedDescription) {
      setErrorMessage(
        "Please describe the issue you are experiencing."
      );
      return;
    }

    setSaving(true);

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

    if (user.id !== customerId) {
      setErrorMessage(
        "You are not authorized to report an issue for this order."
      );
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("issues").insert({
      order_id: orderId,
      customer_id: customerId,
      subject: trimmedSubject,
      description: trimmedDescription,
      priority,
      status: "open",
    });

    if (error) {
      setErrorMessage(
        `Could not submit your issue: ${error.message}`
      );
      setSaving(false);
      return;
    }

    setSuccessMessage(
      "Your issue has been submitted successfully."
    );

    setSubject("");
    setDescription("");
    setPriority("medium");

    setSaving(false);

    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">
          Issue Details
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Provide enough information so our team can help you
          quickly.
        </p>
      </div>

      <div>
        <label
          htmlFor="subject"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          Subject
        </label>

        <input
          id="subject"
          type="text"
          value={subject}
          onChange={(event) =>
            setSubject(event.target.value)
          }
          disabled={saving}
          maxLength={150}
          placeholder="e.g. Order was damaged"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 disabled:bg-slate-50"
        />
      </div>

      <div>
        <label
          htmlFor="priority"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          Priority
        </label>

        <select
          id="priority"
          value={priority}
          onChange={(event) =>
            setPriority(
              event.target.value as
                | "low"
                | "medium"
                | "high"
                | "urgent"
            )
          }
          disabled={saving}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 disabled:bg-slate-50"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="description"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          Description
        </label>

        <textarea
          id="description"
          value={description}
          onChange={(event) =>
            setDescription(event.target.value)
          }
          disabled={saving}
          rows={6}
          maxLength={2000}
          placeholder="Describe what happened..."
          className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 disabled:bg-slate-50"
        />

        <p className="mt-2 text-right text-xs text-slate-400">
          {description.length}/2000
        </p>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {successMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-xl bg-cyan-700 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? "Submitting Issue..." : "Submit Issue"}
      </button>
    </form>
  );
}