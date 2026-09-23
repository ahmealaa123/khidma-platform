import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type CustomerDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CustomerDetailsPage({
  params,
}: CustomerDetailsPageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
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
    redirect("/admin/login");
  }

  const { data: customer, error } = await supabase
    .from("profiles")
    .select(`
      id,
      full_name,
      role,
      created_at,
      updated_at
    `)
    .eq("id", id)
    .eq("role", "customer")
    .single();

  if (error || !customer) {
    notFound();
  }

  const initials = customer.full_name
  ? customer.full_name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((name: string) => name.charAt(0).toUpperCase())
      .join("")
  : "C";
  function formatDate(date: string) {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
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
                Customer Details
              </h1>
            </div>
          </div>

          <Link
            href="/admin/customers"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Back to Customers
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Customer Management
          </p>

          <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            {customer.full_name || "Unnamed Customer"}
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Review customer account information.
          </p>
        </div>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4 border-b border-slate-200 pb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-50 text-xl font-bold text-cyan-700">
                {initials}
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {customer.full_name ||
                    "Unnamed Customer"}
                </h3>

                <span className="mt-2 inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                  Customer
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              <InfoRow
                label="Full Name"
                value={
                  customer.full_name ||
                  "Not provided"
                }
              />

              <InfoRow
                label="Account Type"
                value="Customer"
              />

              <InfoRow
                label="Customer ID"
                value={customer.id}
                mono
              />

              <InfoRow
                label="Registered"
                value={formatDate(
                  customer.created_at
                )}
              />

              <InfoRow
                label="Last Profile Update"
                value={formatDate(
                  customer.updated_at
                )}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Account Status
              </p>

              <div className="mt-4 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  ✓
                </span>

                <div>
                  <p className="font-bold text-slate-900">
                    Active
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Customer account is registered.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Customer Activity
              </p>

              <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
                <div className="text-2xl">
                  📦
                </div>

                <p className="mt-3 text-sm font-semibold text-slate-800">
                  Orders
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Customer order history will appear
                  here once the Orders module is
                  implemented.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h3 className="font-bold text-slate-900">
              Administrative Actions
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Customer account actions will be
              available here as the platform modules
              are completed.
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              disabled
              className="cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-400"
            >
              Suspend Account
            </button>

            <button
              type="button"
              disabled
              className="cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-400"
            >
              View Orders
            </button>
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
          mono ? "break-all font-mono text-xs" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}