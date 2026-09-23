"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Customer = {
  id: string;
  full_name: string | null;
  role: "customer";
  created_at: string;
};

export default function AdminCustomersPage() {
  const supabase = createClient();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadCustomers() {
    setLoading(true);
    setErrorMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/admin/login";
      return;
    }

    const { data: adminProfile, error: adminProfileError } =
      await supabase
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
      .from("profiles")
      .select(`
        id,
        full_name,
        role,
        created_at
      `)
      .eq("role", "customer")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      setErrorMessage(
        `Could not load customers: ${error.message}`
      );

      setLoading(false);
      return;
    }

    setCustomers((data ?? []) as Customer[]);
    setLoading(false);
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return customers;
    }

    return customers.filter((customer) => {
      const name = customer.full_name?.toLowerCase() ?? "";
      const email = "";

      return (
        name.includes(query) ||
        email.includes(query) ||
        customer.id.toLowerCase().includes(query)
      );
    });
  }, [customers, search]);

  function formatDate(date: string) {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(date));
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
                Customer Management
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
            Platform Operations
          </p>

          <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Customers
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            View registered customers and monitor customer
            accounts across the platform.
          </p>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Total Customers
            </p>

            <p className="mt-3 text-3xl font-bold text-slate-900">
              {customers.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Showing
            </p>

            <p className="mt-3 text-3xl font-bold text-slate-900">
              {filteredCustomers.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Account Type
            </p>

            <p className="mt-3 text-lg font-bold text-cyan-700">
              Customer
            </p>
          </div>
        </section>

        {errorMessage && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
            {errorMessage}
          </div>
        )}

        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="font-bold text-slate-900">
                Customer Accounts
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {filteredCustomers.length} customer
                {filteredCustomers.length === 1
                  ? ""
                  : "s"} found
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search customers..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 sm:w-72"
                />
              </div>

              <button
                type="button"
                onClick={loadCustomers}
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
                  Loading customers...
                </p>
              </div>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="flex min-h-72 items-center justify-center px-6">
              <div className="max-w-md text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                  👤
                </div>

                <h3 className="mt-5 text-lg font-bold text-slate-900">
                  No customers found
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {search.trim()
                    ? "No customers match your search."
                    : "There are no registered customers yet."}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px]">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200 text-left">
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Customer
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Account Type
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Customer ID
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Registered
                    </th>

                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {filteredCustomers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-sm font-bold text-cyan-700">
                            {customer.full_name
                              ? customer.full_name
                                  .charAt(0)
                                  .toUpperCase()
                              : "C"}
                          </div>

                          <div>
                            <p className="font-semibold text-slate-900">
                              {customer.full_name ||
                                "Unnamed Customer"}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              Customer Account
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <span className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                          Customer
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <span className="font-mono text-xs text-slate-500">
                          {customer.id}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <span className="text-sm text-slate-600">
                          {formatDate(customer.created_at)}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex justify-end">
                          <Link
                            href={`/admin/customers/${customer.id}`}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700"
                          >
                            View Details
                          </Link>
                        </div>
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