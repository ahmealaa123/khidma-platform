import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PaymentStatusManager from "./PaymentStatusManager";

type PaymentDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded";

type PaymentMethod =
  | "demo_card"
  | "demo_cash";

export default async function PaymentDetailsPage({
  params,
}: PaymentDetailsPageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const {
    data: adminProfile,
    error: adminProfileError,
  } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (
    adminProfileError ||
    !adminProfile ||
    adminProfile.role !== "admin"
  ) {
    redirect("/admin/login");
  }

  const {
    data: payment,
    error: paymentError,
  } = await supabase
    .from("payments")
    .select(`
      id,
      order_id,
      customer_id,
      amount,
      status,
      method,
      transaction_reference,
      paid_at,
      created_at,
      updated_at
    `)
    .eq("id", id)
    .single();

  if (paymentError || !payment) {
    notFound();
  }

  const { data: order } = await supabase
    .from("orders")
    .select(`
      id,
      service_type,
      pickup_address,
      delivery_address,
      description,
      status,
      total_amount,
      created_at
    `)
    .eq("id", payment.order_id)
    .single();

  const { data: customer } = await supabase
    .from("profiles")
    .select(`
      id,
      full_name
    `)
    .eq("id", payment.customer_id)
    .single();

  function getStatusLabel(status: PaymentStatus) {
    switch (status) {
      case "pending":
        return "Pending";

      case "paid":
        return "Paid";

      case "failed":
        return "Failed";

      case "refunded":
        return "Refunded";

      default:
        return status;
    }
  }

  function getStatusClasses(status: PaymentStatus) {
    switch (status) {
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

  function getMethodLabel(method: PaymentMethod) {
    switch (method) {
      case "demo_card":
        return "Demo Card";

      case "demo_cash":
        return "Demo Cash";

      default:
        return method;
    }
  }

  function getOrderStatusLabel(status: string) {
    switch (status) {
      case "created":
        return "Created";

      case "confirmed":
        return "Confirmed";

      case "searching_agent":
        return "Searching Agent";

      case "agent_assigned":
        return "Agent Assigned";

      case "going_to_pickup":
        return "Going to Pickup";

      case "arrived_at_pickup":
        return "Arrived at Pickup";

      case "item_collected":
        return "Item Collected";

      case "on_the_way":
        return "On the Way";

      case "delivered":
        return "Delivered";

      case "cancelled":
        return "Cancelled";

      default:
        return status;
    }
  }

  function formatDate(date: string | null) {
    if (!date) {
      return "—";
    }

    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  }

  function formatAmount(amount: number) {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-700 text-xl font-bold text-white transition hover:bg-cyan-800"
            >
              K
            </Link>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-700">
                Administration
              </p>

              <h1 className="text-xl font-bold text-slate-900">
                Payment Details
              </h1>
            </div>
          </div>

          <Link
            href="/admin/payments"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Back to Payments
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Platform Finance
          </p>

          <div className="mt-1 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                Payment #{payment.id.slice(0, 8)}
              </h2>

              <p className="mt-2 font-mono text-xs text-slate-400">
                {payment.id}
              </p>
            </div>

            <span
              className={`inline-flex w-fit rounded-full border px-4 py-2 text-sm font-semibold ${getStatusClasses(
                payment.status
              )}`}
            >
              {getStatusLabel(payment.status)}
            </span>
          </div>
        </div>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-bold text-slate-900">
                Payment Information
              </h3>

              <div className="mt-6 space-y-5">
                <InfoRow
                  label="Payment ID"
                  value={payment.id}
                  mono
                />

                <InfoRow
                  label="Order ID"
                  value={payment.order_id}
                  mono
                />

                <InfoRow
                  label="Customer ID"
                  value={payment.customer_id}
                  mono
                />

                <InfoRow
                  label="Customer"
                  value={
                    customer?.full_name ||
                    "Unknown Customer"
                  }
                />

                <InfoRow
                  label="Payment Method"
                  value={getMethodLabel(payment.method)}
                />

                <InfoRow
                  label="Transaction Reference"
                  value={
                    payment.transaction_reference ||
                    "Not available"
                  }
                  mono={Boolean(
                    payment.transaction_reference
                  )}
                />

                <InfoRow
                  label="Created"
                  value={formatDate(payment.created_at)}
                />

                <InfoRow
                  label="Last Updated"
                  value={formatDate(payment.updated_at)}
                />

                <InfoRow
                  label="Paid At"
                  value={formatDate(payment.paid_at)}
                />
              </div>
            </div>

            {order && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900">
                      Related Order
                    </h3>

                    <p className="mt-1 font-mono text-xs text-slate-400">
                      {order.id}
                    </p>
                  </div>

                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2.5 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100"
                  >
                    View Order
                  </Link>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Service
                    </p>

                    <p className="mt-2 text-sm font-semibold capitalize text-slate-900">
                      {order.service_type.replace(
                        /_/g,
                        " "
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Order Status
                    </p>

                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {getOrderStatusLabel(
                        order.status
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Pickup
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-900">
                      {order.pickup_address}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Delivery
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-900">
                      {order.delivery_address ||
                        "No delivery address"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
              <p className="text-sm font-medium text-emerald-700">
                Payment Amount
              </p>

              <p className="mt-3 text-5xl font-bold text-emerald-800">
                {formatAmount(Number(payment.amount))}
              </p>

              <p className="mt-2 text-sm font-semibold text-emerald-600">
                SAR
              </p>
            </div>

            <PaymentStatusManager
              paymentId={payment.id}
              currentStatus={payment.status}
            />

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-bold text-slate-900">
                Payment Status
              </h3>

              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-5">
                <span
                  className={`inline-flex rounded-full border px-3 py-1.5 text-sm font-semibold ${getStatusClasses(
                    payment.status
                  )}`}
                >
                  {getStatusLabel(payment.status)}
                </span>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Payment processing is currently handled
                  through the MVP demo payment flow.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <p className="text-sm font-bold text-amber-800">
                MVP Payment
              </p>

              <p className="mt-2 text-sm leading-6 text-amber-700">
                This payment is part of the demo payment
                system. Real payment gateway processing will
                be integrated later.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5 border-b border-slate-100 pb-4 last:border-b-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <p className="text-sm font-medium text-slate-500">
        {label}
      </p>

      <p
        className={`text-sm font-semibold text-slate-900 sm:max-w-[65%] sm:text-right ${
          mono
            ? "break-all font-mono text-xs"
            : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}