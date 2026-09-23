"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type ServiceType =
  | "delivery"
  | "shopping"
  | "pickup"
  | "errand";

export default function CreateRequestPage() {
  const router = useRouter();
  const supabase = createClient();

  const [serviceType, setServiceType] =
    useState<ServiceType>("delivery");

  const [pickupAddress, setPickupAddress] =
    useState("");

  const [deliveryAddress, setDeliveryAddress] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [customerNotes, setCustomerNotes] =
    useState("");

  const [totalAmount, setTotalAmount] =
    useState("0");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] =
    useState("");

  const [successOrderId, setSuccessOrderId] =
    useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setErrorMessage("");
    setSuccessOrderId("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.push("/login");
      return;
    }

    const amount = Number(totalAmount);

    if (Number.isNaN(amount) || amount < 0) {
      setErrorMessage(
        "Please enter a valid amount."
      );

      setLoading(false);
      return;
    }

    const { data: customerProfile, error: profileError } =
      await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (
      profileError ||
      !customerProfile ||
      customerProfile.role !== "customer"
    ) {
      setErrorMessage(
        "Only customer accounts can create requests."
      );

      setLoading(false);
      return;
    }

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        customer_id: user.id,
        service_type: serviceType,
        pickup_address: pickupAddress.trim(),
        delivery_address:
          deliveryAddress.trim() || null,
        description:
          description.trim() || null,
        customer_notes:
          customerNotes.trim() || null,
        total_amount: amount,
        status: "created",
      })
      .select("id")
      .single();

    if (error || !order) {
      setErrorMessage(
        error?.message ||
          "Could not create your request."
      );

      setLoading(false);
      return;
    }

    setSuccessOrderId(order.id);
    setLoading(false);

    setPickupAddress("");
    setDeliveryAddress("");
    setDescription("");
    setCustomerNotes("");
    setTotalAmount("0");
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-700 text-xl font-bold text-white transition hover:bg-cyan-800"
            >
              K
            </Link>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-700">
                Customer
              </p>

              <h1 className="text-xl font-bold text-slate-900">
                Create Request
              </h1>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-10">
        <div>
          <p className="text-sm font-medium text-slate-500">
            New Service Request
          </p>

          <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            What do you need?
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Tell us what you need and provide the
            pickup and delivery details.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-6"
        >
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-bold text-slate-900">
              Service Type
            </h3>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <ServiceOption
                value="delivery"
                title="Delivery"
                description="Deliver an item from one location to another."
                selected={serviceType === "delivery"}
                onClick={() =>
                  setServiceType("delivery")
                }
              />

              <ServiceOption
                value="shopping"
                title="Shopping"
                description="Purchase and deliver items for you."
                selected={serviceType === "shopping"}
                onClick={() =>
                  setServiceType("shopping")
                }
              />

              <ServiceOption
                value="pickup"
                title="Pickup"
                description="Pick up an item on your behalf."
                selected={serviceType === "pickup"}
                onClick={() =>
                  setServiceType("pickup")
                }
              />

              <ServiceOption
                value="errand"
                title="Errand"
                description="Handle a simple task for you."
                selected={serviceType === "errand"}
                onClick={() =>
                  setServiceType("errand")
                }
              />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-bold text-slate-900">
              Locations
            </h3>

            <div className="mt-5 space-y-5">
              <div>
                <label
                  htmlFor="pickupAddress"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Pickup Address
                </label>

                <input
                  id="pickupAddress"
                  type="text"
                  value={pickupAddress}
                  onChange={(event) =>
                    setPickupAddress(
                      event.target.value
                    )
                  }
                  required
                  placeholder="Enter pickup location"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                />
              </div>

              <div>
                <label
                  htmlFor="deliveryAddress"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Delivery Address
                </label>

                <input
                  id="deliveryAddress"
                  type="text"
                  value={deliveryAddress}
                  onChange={(event) =>
                    setDeliveryAddress(
                      event.target.value
                    )
                  }
                  placeholder="Enter delivery location"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                />

                <p className="mt-2 text-xs text-slate-400">
                  Leave empty if this request does not
                  require delivery.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-bold text-slate-900">
              Request Details
            </h3>

            <div className="mt-5 space-y-5">
              <div>
                <label
                  htmlFor="description"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  What do you need?
                </label>

                <textarea
                  id="description"
                  value={description}
                  onChange={(event) =>
                    setDescription(
                      event.target.value
                    )
                  }
                  required
                  rows={4}
                  placeholder="Describe the item or task..."
                  className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                />
              </div>

              <div>
                <label
                  htmlFor="customerNotes"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Additional Notes
                  <span className="ml-1 font-normal text-slate-400">
                    (Optional)
                  </span>
                </label>

                <textarea
                  id="customerNotes"
                  value={customerNotes}
                  onChange={(event) =>
                    setCustomerNotes(
                      event.target.value
                    )
                  }
                  rows={3}
                  placeholder="Any special instructions?"
                  className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                />
              </div>

              <div>
                <label
                  htmlFor="totalAmount"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Estimated Amount
                </label>

                <div className="relative">
                  <input
                    id="totalAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={totalAmount}
                    onChange={(event) =>
                      setTotalAmount(
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-16 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                  />

                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                    SAR
                  </span>
                </div>

                <p className="mt-2 text-xs text-slate-400">
                  MVP uses a demo amount. Real payment
                  processing will be added later.
                </p>
              </div>
            </div>
          </section>

          {errorMessage && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
              {errorMessage}
            </div>
          )}

          {successOrderId && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 font-bold text-emerald-700">
                  ✓
                </div>

                <div>
                  <h3 className="font-bold text-emerald-900">
                    Request Created Successfully
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-emerald-700">
                    Your request has been created and is
                    now registered on the platform.
                  </p>

                  <p className="mt-3 font-mono text-xs text-emerald-700">
                    Order ID: {successOrderId}
                  </p>

                  <Link
                    href="/admin/orders"
                    className="mt-4 inline-flex rounded-lg bg-emerald-700 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-800"
                  >
                    View in Admin Orders
                  </Link>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-cyan-700 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Creating Request..."
              : "Create Request"}
          </button>
        </form>
      </div>
    </main>
  );
}

function ServiceOption({
  value,
  title,
  description,
  selected,
  onClick,
}: {
  value: ServiceType;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition ${
        selected
          ? "border-cyan-400 bg-cyan-50 ring-2 ring-cyan-100"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className={`font-semibold ${
              selected
                ? "text-cyan-800"
                : "text-slate-900"
            }`}
          >
            {title}
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>

        <span
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
            selected
              ? "border-cyan-600 bg-cyan-600 text-white"
              : "border-slate-300 bg-white"
          }`}
        >
          {selected && (
            <span className="text-xs font-bold">
              ✓
            </span>
          )}
        </span>
      </div>
    </button>
  );
}