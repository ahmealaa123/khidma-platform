"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type OrderStatus =
  | "created"
  | "confirmed"
  | "searching_agent"
  | "agent_assigned"
  | "going_to_pickup"
  | "arrived_at_pickup"
  | "item_collected"
  | "on_the_way"
  | "delivered"
  | "cancelled";

type Order = {
  id: string;
  customer_id: string;
  agent_id: string | null;
  service_type: string;
  pickup_address: string;
  delivery_address: string | null;
  description: string | null;
  status: OrderStatus;
  total_amount: number;
  created_at: string;
};

type FilterStatus = "all" | OrderStatus;

export default function AdminOrdersPage() {
  const supabase = createClient();

  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] =
    useState<FilterStatus>("all");

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadOrders() {
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
      .from("orders")
      .select(`
        id,
        customer_id,
        agent_id,
        service_type,
        pickup_address,
        delivery_address,
        description,
        status,
        total_amount,
        created_at
      `)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      setErrorMessage(
        `Could not load orders: ${error.message}`
      );

      setLoading(false);
      return;
    }

    setOrders((data ?? []) as Order[]);
    setLoading(false);
  }

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    let result = orders;

    if (filter !== "all") {
      result = result.filter(
        (order) => order.status === filter
      );
    }

    const query = search.trim().toLowerCase();

    if (query) {
      result = result.filter((order) => {
        return (
          order.id.toLowerCase().includes(query) ||
          order.customer_id
            .toLowerCase()
            .includes(query) ||
          order.service_type
            .toLowerCase()
            .includes(query) ||
          order.pickup_address
            .toLowerCase()
            .includes(query)
        );
      });
    }

    return result;
  }, [orders, filter, search]);

  const counts = useMemo(() => {
    return {
      all: orders.length,

      created: orders.filter(
        (order) => order.status === "created"
      ).length,

      confirmed: orders.filter(
        (order) => order.status === "confirmed"
      ).length,

      searching_agent: orders.filter(
        (order) => order.status === "searching_agent"
      ).length,

      agent_assigned: orders.filter(
        (order) => order.status === "agent_assigned"
      ).length,

      active: orders.filter((order) =>
        [
          "going_to_pickup",
          "arrived_at_pickup",
          "item_collected",
          "on_the_way",
        ].includes(order.status)
      ).length,

      delivered: orders.filter(
        (order) => order.status === "delivered"
      ).length,

      cancelled: orders.filter(
        (order) => order.status === "cancelled"
      ).length,
    };
  }, [orders]);

  function getStatusLabel(status: OrderStatus) {
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

  function getStatusClasses(status: OrderStatus) {
    switch (status) {
      case "created":
        return "border-slate-200 bg-slate-50 text-slate-700";

      case "confirmed":
        return "border-cyan-200 bg-cyan-50 text-cyan-700";

      case "searching_agent":
        return "border-amber-200 bg-amber-50 text-amber-700";

      case "agent_assigned":
        return "border-indigo-200 bg-indigo-50 text-indigo-700";

      case "going_to_pickup":
      case "arrived_at_pickup":
      case "item_collected":
      case "on_the_way":
        return "border-blue-200 bg-blue-50 text-blue-700";

      case "delivered":
        return "border-emerald-200 bg-emerald-50 text-emerald-700";

      case "cancelled":
        return "border-red-200 bg-red-50 text-red-700";

      default:
        return "border-slate-200 bg-slate-50 text-slate-600";
    }
  }

  function formatDate(date: string) {
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
                Order Management
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
            Orders
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Monitor customer requests, track order
            progress, and manage platform operations.
          </p>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Orders"
            value={counts.all}
            active={filter === "all"}
            onClick={() => setFilter("all")}
          />

          <StatCard
            label="New Orders"
            value={counts.created}
            active={filter === "created"}
            onClick={() => setFilter("created")}
          />

          <StatCard
            label="Active Orders"
            value={counts.active}
            active={false}
            onClick={() => {
              setFilter("all");
              setSearch("");
            }}
          />

          <StatCard
            label="Delivered"
            value={counts.delivered}
            active={filter === "delivered"}
            onClick={() => setFilter("delivered")}
          />
        </section>

        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <StatusFilter
            label="Confirmed"
            value={counts.confirmed}
            active={filter === "confirmed"}
            onClick={() => setFilter("confirmed")}
          />

          <StatusFilter
            label="Searching Agent"
            value={counts.searching_agent}
            active={filter === "searching_agent"}
            onClick={() =>
              setFilter("searching_agent")
            }
          />

          <StatusFilter
            label="Agent Assigned"
            value={counts.agent_assigned}
            active={filter === "agent_assigned"}
            onClick={() =>
              setFilter("agent_assigned")
            }
          />

          <StatusFilter
            label="Delivered"
            value={counts.delivered}
            active={filter === "delivered"}
            onClick={() => setFilter("delivered")}
          />

          <StatusFilter
            label="Cancelled"
            value={counts.cancelled}
            active={filter === "cancelled"}
            onClick={() => setFilter("cancelled")}
          />
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
                Order List
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {filteredOrders.length} order
                {filteredOrders.length === 1
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
                placeholder="Search orders..."
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 sm:w-72"
              />

              <button
                type="button"
                onClick={loadOrders}
                disabled={loading}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Refreshing..."
                  : "Refresh"}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-72 items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-cyan-700" />

                <p className="mt-4 text-sm text-slate-500">
                  Loading orders...
                </p>
              </div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex min-h-72 items-center justify-center px-6">
              <div className="max-w-md text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                  📦
                </div>

                <h3 className="mt-5 text-lg font-bold text-slate-900">
                  No orders found
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {search.trim() || filter !== "all"
                    ? "No orders match the current filters."
                    : "There are no orders on the platform yet."}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px]">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200 text-left">
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Order
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Service
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Customer
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Pickup
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Agent
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Amount
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>

                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-6 py-5">
                        <div>
                          <p className="font-mono text-xs font-semibold text-slate-900">
                            #{order.id.slice(0, 8)}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {formatDate(
                              order.created_at
                            )}
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <span className="text-sm font-semibold capitalize text-slate-700">
                          {order.service_type.replace(
                            /_/g,
                            " "
                          )}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <span className="font-mono text-xs text-slate-500">
                          {order.customer_id.slice(0, 8)}
                        </span>
                      </td>

                      <td className="max-w-[220px] px-6 py-5">
                        <p className="truncate text-sm text-slate-600">
                          {order.pickup_address}
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        {order.agent_id ? (
                          <span className="font-mono text-xs text-slate-500">
                            {order.agent_id.slice(0, 8)}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400">
                            Unassigned
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-5">
                        <span className="text-sm font-semibold text-slate-900">
                          {formatAmount(
                            order.total_amount
                          )}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(
                            order.status
                          )}`}
                        >
                          {getStatusLabel(
                            order.status
                          )}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex justify-end">
                          <Link
                            href={`/admin/orders/${order.id}`}
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

function StatusFilter({
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
      className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
        active
          ? "border-cyan-300 bg-cyan-50 ring-2 ring-cyan-100"
          : "border-slate-200 bg-white hover:bg-slate-50"
      }`}
    >
      <span className="text-sm font-medium text-slate-600">
        {label}
      </span>

      <span className="font-bold text-slate-900">
        {value}
      </span>
    </button>
  );
}