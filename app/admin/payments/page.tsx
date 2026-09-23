"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded";

type PaymentMethod =
  | "demo_card"
  | "demo_cash";

type Payment = {
  id: string;
  order_id: string;
  customer_id: string;
  amount: number;
  status: PaymentStatus;
  method: PaymentMethod;
  transaction_reference: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

type FilterStatus = "all" | PaymentStatus;

export default function AdminPaymentsPage() {
  const supabase = createClient();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [filter, setFilter] =
    useState<FilterStatus>("all");

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadPayments() {
    setLoading(true);
    setErrorMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/admin/login";
      return;
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
      window.location.href = "/admin/login";
      return;
    }

    const { data, error } = await supabase
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
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      setErrorMessage(
        `Could not load payments: ${error.message}`
      );

      setLoading(false);
      return;
    }

    setPayments((data ?? []) as Payment[]);
    setLoading(false);
  }

  useEffect(() => {
    loadPayments();
  }, []);

  const filteredPayments = useMemo(() => {
    let result = payments;

    if (filter !== "all") {
      result = result.filter(
        (payment) => payment.status === filter
      );
    }

    const query = search.trim().toLowerCase();

    if (query) {
      result = result.filter((payment) => {
        return (
          payment.id
            .toLowerCase()
            .includes(query) ||
          payment.order_id
            .toLowerCase()
            .includes(query) ||
          payment.customer_id
            .toLowerCase()
            .includes(query) ||
          payment.transaction_reference
            ?.toLowerCase()
            .includes(query)
        );
      });
    }

    return result;
  }, [payments, filter, search]);

  const totals = useMemo(() => {
    return {
      all: payments.length,

      paid: payments.filter(
        (payment) => payment.status === "paid"
      ).length,

      pending: payments.filter(
        (payment) => payment.status === "pending"
      ).length,

      failed: payments.filter(
        (payment) => payment.status === "failed"
      ).length,

      refunded: payments.filter(
        (payment) => payment.status === "refunded"
      ).length,

      paidAmount: payments
        .filter(
          (payment) => payment.status === "paid"
        )
        .reduce(
          (sum, payment) => sum + Number(payment.amount),
          0
        ),

      totalAmount: payments.reduce(
        (sum, payment) => sum + Number(payment.amount),
        0
      ),
    };
  }, [payments]);

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

  function formatDate(date: string | null) {
    if (!date) {
      return "—";
    }

    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
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
                Payment Management
              </h1>
            </div>
          </div>

          <Link
            href="/admin"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Platform Finance
          </p>

          <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Payments
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Monitor payment records, transaction status,
            and financial activity across the platform.
          </p>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Payments"
            value={totals.all}
            active={filter === "all"}
            onClick={() => setFilter("all")}
          />

          <StatCard
            label="Paid"
            value={totals.paid}
            active={filter === "paid"}
            onClick={() => setFilter("paid")}
          />

          <StatCard
            label="Pending"
            value={totals.pending}
            active={filter === "pending"}
            onClick={() => setFilter("pending")}
          />

          <StatCard
            label="Failed"
            value={totals.failed}
            active={filter === "failed"}
            onClick={() => setFilter("failed")}
          />
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Total Recorded Amount
            </p>

            <p className="mt-3 text-3xl font-bold text-slate-900">
              {formatAmount(totals.totalAmount)}
              <span className="ml-2 text-sm font-semibold text-slate-400">
                SAR
              </span>
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <p className="text-sm font-medium text-emerald-700">
              Paid Amount
            </p>

            <p className="mt-3 text-3xl font-bold text-emerald-800">
              {formatAmount(totals.paidAmount)}
              <span className="ml-2 text-sm font-semibold text-emerald-600">
                SAR
              </span>
            </p>
          </div>
        </section>

        <div className="mt-6 flex flex-wrap gap-3">
          <FilterButton
            label="All"
            value={totals.all}
            active={filter === "all"}
            onClick={() => setFilter("all")}
          />

          <FilterButton
            label="Paid"
            value={totals.paid}
            active={filter === "paid"}
            onClick={() => setFilter("paid")}
          />

          <FilterButton
            label="Pending"
            value={totals.pending}
            active={filter === "pending"}
            onClick={() => setFilter("pending")}
          />

          <FilterButton
            label="Failed"
            value={totals.failed}
            active={filter === "failed"}
            onClick={() => setFilter("failed")}
          />

          <FilterButton
            label="Refunded"
            value={totals.refunded}
            active={filter === "refunded"}
            onClick={() => setFilter("refunded")}
          />
        </div>

        {errorMessage && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
            {errorMessage}
          </div>
        )}

        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="font-bold text-slate-900">
                Payment Transactions
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {filteredPayments.length} payment
                {filteredPayments.length === 1
                  ? ""
                  : "s"} found
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search payments..."
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 sm:w-72"
              />

              <button
                type="button"
                onClick={loadPayments}
                disabled={loading}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-72 items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-cyan-700" />

                <p className="mt-4 text-sm text-slate-500">
                  Loading payments...
                </p>
              </div>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="flex min-h-72 items-center justify-center px-6">
              <div className="max-w-md text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                  💳
                </div>

                <h3 className="mt-5 text-lg font-bold text-slate-900">
                  No payments found
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {search.trim() || filter !== "all"
                    ? "No payments match the current filters."
                    : "Payment records will appear here once payments are created."}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px]">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200 text-left">
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Payment
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Order
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Customer
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Amount
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Method
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Date
                    </th>

                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Reference
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {filteredPayments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-6 py-5">
                        <p className="font-mono text-xs font-semibold text-slate-900">
                          #{payment.id.slice(0, 8)}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {formatDate(payment.created_at)}
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <Link
                          href={`/admin/orders/${payment.order_id}`}
                          className="font-mono text-xs font-semibold text-cyan-700 hover:text-cyan-800"
                        >
                          #{payment.order_id.slice(0, 8)}
                        </Link>
                      </td>

                      <td className="px-6 py-5">
                        <span className="font-mono text-xs text-slate-500">
                          {payment.customer_id.slice(0, 8)}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <span className="text-sm font-bold text-slate-900">
                          {formatAmount(
                            Number(payment.amount)
                          )}{" "}
                          <span className="text-xs font-semibold text-slate-400">
                            SAR
                          </span>
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <span className="text-sm text-slate-600">
                          {getMethodLabel(payment.method)}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(
                            payment.status
                          )}`}
                        >
                          {getStatusLabel(payment.status)}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <div>
                          <p className="text-sm text-slate-600">
                            {formatDate(
                              payment.paid_at ||
                                payment.created_at
                            )}
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-5 text-right">
                        <span className="font-mono text-xs text-slate-400">
                          {payment.transaction_reference ||
                            "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        active
          ? "border-cyan-300 ring-2 ring-cyan-100"
          : "border-slate-200"
      }`}
    >
      <p className="text-sm font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-3 text-3xl font-bold text-slate-900">
        {value}
      </p>
    </button>
  );
}

function FilterButton({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
        active
          ? "border-cyan-300 bg-cyan-50 text-cyan-700 ring-2 ring-cyan-100"
          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      {label}
      <span className="ml-2 text-slate-400">
        {value}
      </span>
    </button>
  );
}