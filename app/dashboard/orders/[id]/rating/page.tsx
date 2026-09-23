import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RatingForm from "./RatingForm";

type RatingPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function RatingPage({
  params,
}: RatingPageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(
      `
        id,
        customer_id,
        agent_id,
        service_type,
        status,
        total_amount
      `
    )
    .eq("id", id)
    .eq("customer_id", user.id)
    .single();

  if (orderError || !order) {
    notFound();
  }

  if (order.status !== "delivered" || !order.agent_id) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-2xl">
              ★
            </div>

            <h1 className="mt-5 text-2xl font-bold text-slate-900">
              Rating is not available yet
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              You can rate the agent after your order has been
              successfully delivered.
            </p>

            <Link
              href={`/dashboard/orders/${order.id}`}
              className="mt-6 inline-flex rounded-xl bg-cyan-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-cyan-800"
            >
              Back to Order
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const { data: existingReview } = await supabase
    .from("reviews")
    .select("id, rating, comment")
    .eq("order_id", order.id)
    .eq("customer_id", user.id)
    .maybeSingle();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <Link
            href={`/dashboard/orders/${order.id}`}
            className="text-sm font-semibold text-cyan-700 transition hover:text-cyan-800"
          >
            ← Back to Order
          </Link>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            Rate Your Experience
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Your order has been delivered. Share your experience
            with the agent.
          </p>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="rounded-xl bg-slate-50 p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Order
            </p>

            <p className="mt-1 font-bold text-slate-900">
              {order.id}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              {order.service_type
                .replace(/_/g, " ")
                .replace(
                  /\b\w/g,
                  (char: string) => char.toUpperCase()
                )}
            </p>
          </div>

          <div className="mt-8">
            <RatingForm
              orderId={order.id}
              agentId={order.agent_id!}
              existingReview={existingReview}
            />
          </div>
        </section>
      </div>
    </main>
  );
}