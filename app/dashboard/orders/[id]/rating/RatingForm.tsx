"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type ExistingReview = {
  id: string;
  rating: number;
  comment: string | null;
} | null;

type RatingFormProps = {
  orderId: string;
  agentId: string;
  existingReview: ExistingReview;
};

export default function RatingForm({
  orderId,
  agentId,
  existingReview,
}: RatingFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [rating, setRating] = useState(
    existingReview?.rating ?? 0
  );

  const [comment, setComment] = useState(
    existingReview?.comment ?? ""
  );

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (rating < 1 || rating > 5) {
      setErrorMessage(
        "Please select a rating from 1 to 5 stars."
      );
      return;
    }

    if (!agentId) {
      setErrorMessage(
        "No agent is associated with this order."
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

    const reviewData = {
      order_id: orderId,
      customer_id: user.id,
      agent_id: agentId,
      rating,
      comment: comment.trim() || null,
    };

    let error;

    if (existingReview) {
      const result = await supabase
        .from("reviews")
        .update({
          rating: reviewData.rating,
          comment: reviewData.comment,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingReview.id)
        .eq("customer_id", user.id);

      error = result.error;
    } else {
      const result = await supabase
        .from("reviews")
        .insert(reviewData);

      error = result.error;
    }

    if (error) {
      setErrorMessage(
        `Could not save your review: ${error.message}`
      );
      setSaving(false);
      return;
    }

    setSuccessMessage(
      existingReview
        ? "Your review has been updated successfully."
        : "Thank you! Your review has been submitted successfully."
    );

    setSaving(false);

    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <h2 className="text-lg font-bold text-slate-900">
          How was your experience?
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Select a rating from 1 to 5 stars.
        </p>
      </div>

      <div className="mt-6 flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => {
          const selected = rating >= star;

          return (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              disabled={saving}
              aria-label={`Rate ${star} out of 5`}
              className={`text-4xl leading-none transition ${
                selected
                  ? "text-amber-400"
                  : "text-slate-300 hover:text-amber-300"
              } disabled:cursor-not-allowed`}
            >
              ★
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-sm font-semibold text-slate-600">
        {rating === 0
          ? "No rating selected"
          : `${rating} out of 5`}
      </p>

      <div className="mt-7">
        <label
          htmlFor="comment"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          Comment
          <span className="ml-1 font-normal text-slate-400">
            (Optional)
          </span>
        </label>

        <textarea
          id="comment"
          value={comment}
          onChange={(event) =>
            setComment(event.target.value)
          }
          disabled={saving}
          rows={5}
          maxLength={1000}
          placeholder="Tell us about your experience..."
          className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 disabled:bg-slate-50"
        />

        <p className="mt-2 text-right text-xs text-slate-400">
          {comment.length}/1000
        </p>
      </div>

      {errorMessage && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {successMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={saving || rating === 0}
        className="mt-6 w-full rounded-xl bg-cyan-700 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving
          ? "Submitting Review..."
          : existingReview
            ? "Update Review"
            : "Submit Review"}
      </button>
    </form>
  );
}