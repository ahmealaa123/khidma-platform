import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type ReviewsPageProps = {
  searchParams: Promise<{
    search?: string;
  }>;
};

type Review = {
  id: string;
  order_id: string;
  customer_id: string;
  agent_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

type Profile = {
  id: string;
  full_name: string | null;
};

function formatDate(date: string) {
  return new Date(date).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getRatingLabel(rating: number) {
  if (rating === 5) return "Excellent";
  if (rating === 4) return "Very Good";
  if (rating === 3) return "Good";
  if (rating === 2) return "Needs Improvement";
  return "Poor";
}

function renderStars(rating: number) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={
            star <= rating
              ? "text-amber-400"
              : "text-slate-300"
          }
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default async function AdminReviewsPage({
  searchParams,
}: ReviewsPageProps) {
  const params = await searchParams;
  const search = params.search?.trim() ?? "";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/admin/login");
  }

  const { data: reviewsData, error: reviewsError } =
    await supabase
      .from("reviews")
      .select(
        `
          id,
          order_id,
          customer_id,
          agent_id,
          rating,
          comment,
          created_at
        `
      )
      .order("created_at", {
        ascending: false,
      });

  if (reviewsError) {
    throw new Error(reviewsError.message);
  }

  const reviews: Review[] = reviewsData ?? [];

  const customerIds = [
    ...new Set(reviews.map((review) => review.customer_id)),
  ];

  const agentIds = [
    ...new Set(reviews.map((review) => review.agent_id)),
  ];

  const allProfileIds = [
    ...new Set([...customerIds, ...agentIds]),
  ];

  let profiles: Profile[] = [];

  if (allProfileIds.length > 0) {
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", allProfileIds);

    profiles = profilesData ?? [];
  }

  const profileMap = new Map(
    profiles.map((item) => [item.id, item])
  );

  const filteredReviews = reviews.filter((review) => {
    if (!search) {
      return true;
    }

    const customerName =
      profileMap.get(review.customer_id)?.full_name ?? "";

    const agentName =
      profileMap.get(review.agent_id)?.full_name ?? "";

    const searchText = [
      review.id,
      review.order_id,
      review.customer_id,
      review.agent_id,
      customerName,
      agentName,
      review.comment ?? "",
      String(review.rating),
    ]
      .join(" ")
      .toLowerCase();

    return searchText.includes(search.toLowerCase());
  });

  const totalReviews = reviews.length;

  const averageRating =
    totalReviews > 0
      ? reviews.reduce(
          (sum, review) => sum + review.rating,
          0
        ) / totalReviews
      : 0;

  const ratingCounts = {
    5: reviews.filter((review) => review.rating === 5)
      .length,
    4: reviews.filter((review) => review.rating === 4)
      .length,
    3: reviews.filter((review) => review.rating === 3)
      .length,
    2: reviews.filter((review) => review.rating === 2)
      .length,
    1: reviews.filter((review) => review.rating === 1)
      .length,
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="text-sm font-semibold text-cyan-700 transition hover:text-cyan-800"
          >
            ← Back to Admin Dashboard
          </Link>

          <div className="mt-4">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Reviews
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Monitor customer feedback and agent ratings.
            </p>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Total Reviews
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {totalReviews}
            </p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Average Rating
            </p>

            <div className="mt-2 flex items-center gap-3">
              <p className="text-3xl font-bold text-slate-900">
                {averageRating.toFixed(1)}
              </p>

              <div>
                {renderStars(Math.round(averageRating))}

                <p className="mt-1 text-xs text-slate-400">
                  Out of 5
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              5 Star Reviews
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-600">
              {ratingCounts[5]}
            </p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Low Ratings
            </p>

            <p className="mt-2 text-3xl font-bold text-red-600">
              {ratingCounts[1] + ratingCounts[2]}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              1–2 star reviews
            </p>
          </section>
        </div>

        {/* Rating Breakdown */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            Rating Breakdown
          </h2>

          <div className="mt-5 grid gap-3 sm:grid-cols-5">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div
                key={rating}
                className="rounded-xl bg-slate-50 p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-700">
                    {rating} ★
                  </span>

                  <span className="text-sm font-bold text-slate-900">
                    {
                      ratingCounts[
                        rating as keyof typeof ratingCounts
                      ]
                    }
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Search */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <form
            method="GET"
            className="flex flex-col gap-3 sm:flex-row"
          >
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Search by order, customer, agent, rating or comment..."
              className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
            />

            <button
              type="submit"
              className="rounded-xl bg-cyan-700 px-6 py-3 text-sm font-bold text-white transition hover:bg-cyan-800"
            >
              Search
            </button>

            {search && (
              <Link
                href="/admin/reviews"
                className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-center text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Clear
              </Link>
            )}
          </form>
        </section>

        {/* Reviews Table */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Customer Reviews
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Showing {filteredReviews.length} of{" "}
                  {totalReviews} reviews.
                </p>
              </div>
            </div>
          </div>

          {filteredReviews.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">
                ★
              </div>

              <h3 className="mt-4 text-lg font-bold text-slate-900">
                No reviews found
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                There are no reviews matching your search.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[1050px] w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Review
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Customer
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Agent
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Order
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Rating
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Comment
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Date
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredReviews.map((review) => {
                    const customer =
                      profileMap.get(review.customer_id);

                    const agent =
                      profileMap.get(review.agent_id);

                    return (
                      <tr
                        key={review.id}
                        className="border-b border-slate-100 last:border-b-0"
                      >
                        <td className="px-6 py-5">
                          <p className="font-semibold text-slate-900">
                            {getRatingLabel(review.rating)}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            ID: {review.id}
                          </p>
                        </td>

                        <td className="px-6 py-5">
                          <p className="font-semibold text-slate-900">
                            {customer?.full_name ||
                              "Unknown Customer"}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {review.customer_id}
                          </p>
                        </td>

                        <td className="px-6 py-5">
                          <p className="font-semibold text-slate-900">
                            {agent?.full_name ||
                              "Unknown Agent"}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {review.agent_id}
                          </p>
                        </td>

                        <td className="px-6 py-5">
                          <Link
                            href={`/admin/orders/${review.order_id}`}
                            className="font-semibold text-cyan-700 transition hover:text-cyan-800"
                          >
                            View Order
                          </Link>

                          <p className="mt-1 text-xs text-slate-400">
                            {review.order_id}
                          </p>
                        </td>

                        <td className="px-6 py-5">
                          {renderStars(review.rating)}

                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {review.rating}/5
                          </p>
                        </td>

                        <td className="max-w-xs px-6 py-5">
                          <p className="truncate text-sm text-slate-700">
                            {review.comment ||
                              "No comment provided."}
                          </p>
                        </td>

                        <td className="whitespace-nowrap px-6 py-5 text-sm text-slate-500">
                          {formatDate(review.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}