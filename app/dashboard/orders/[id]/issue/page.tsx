import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import IssueForm from "./IssueForm";

type IssuePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CustomerIssuePage({
  params,
}: IssuePageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: order, error } = await supabase
    .from("orders")
    .select(
      `
        id,
        customer_id,
        service_type,
        status,
        pickup_address,
        delivery_address
      `
    )
    .eq("id", id)
    .eq("customer_id", user.id)
    .single();

  if (error || !order) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <Link
            href={`/dashboard/orders/${order.id}`}
            className="text-sm font-semibold text-cyan-700 transition hover:text-cyan-800"
          >
            ← Back to Order
          </Link>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            Report an Issue
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Tell us about a problem with your order and our
            support team will review it.
          </p>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="rounded-xl bg-slate-50 p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Related Order
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

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-white p-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  Pickup
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  {order.pickup_address}
                </p>
              </div>

              <div className="rounded-lg bg-white p-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  Delivery
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  {order.delivery_address ||
                    "Not specified"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <IssueForm
              orderId={order.id}
              customerId={user.id}
            />
          </div>
        </section>
      </div>
    </main>
  );
}