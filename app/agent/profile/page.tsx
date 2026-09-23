"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AgentProfile = {
  agent_type: string;
  phone: string;
  city: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_year: number | null;
  vehicle_plate_number: string | null;
};

function formatAgentType(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function AgentProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<AgentProfile | null>(
    null
  );

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");

  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleYear, setVehicleYear] = useState("");
  const [vehiclePlateNumber, setVehiclePlateNumber] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      setEmail(user.email ?? "");

      const { data: userProfile, error: profileError } =
        await supabase
          .from("profiles")
          .select("full_name, role, agent_status")
          .eq("id", user.id)
          .single();

      if (profileError || !userProfile) {
        setErrorMessage(
          "Could not load your account information."
        );
        setLoading(false);
        return;
      }

      if (userProfile.role === "admin") {
        router.replace("/admin");
        return;
      }

      if (userProfile.role !== "agent") {
        router.replace("/dashboard");
        return;
      }

      if (userProfile.agent_status !== "approved") {
        router.replace("/signup/agent/pending");
        return;
      }

      setFullName(userProfile.full_name ?? "");

      const { data: agentProfile, error: agentError } =
        await supabase
          .from("agent_profiles")
          .select(
            `
              agent_type,
              phone,
              city,
              vehicle_make,
              vehicle_model,
              vehicle_year,
              vehicle_plate_number
            `
          )
          .eq("id", user.id)
          .single();

      if (agentError || !agentProfile) {
        setErrorMessage(
          "Could not load your agent information."
        );
        setLoading(false);
        return;
      }

      setProfile(agentProfile);

      setPhone(agentProfile.phone ?? "");
      setCity(agentProfile.city ?? "");
      setVehicleMake(agentProfile.vehicle_make ?? "");
      setVehicleModel(agentProfile.vehicle_model ?? "");
      setVehicleYear(
        agentProfile.vehicle_year
          ? String(agentProfile.vehicle_year)
          : ""
      );
      setVehiclePlateNumber(
        agentProfile.vehicle_plate_number ?? ""
      );

      setLoading(false);
    }

    loadProfile();
  }, [router, supabase]);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setErrorMessage("");

    const trimmedName = fullName.trim();
    const trimmedPhone = phone.trim();
    const trimmedCity = city.trim();
    const trimmedVehicleMake = vehicleMake.trim();
    const trimmedVehicleModel = vehicleModel.trim();
    const trimmedVehicleYear = vehicleYear.trim();
    const trimmedPlateNumber =
      vehiclePlateNumber.trim();

    if (!trimmedName) {
      setErrorMessage("Please enter your full name.");
      setSaving(false);
      return;
    }

    if (!trimmedPhone) {
      setErrorMessage("Please enter your phone number.");
      setSaving(false);
      return;
    }

    if (trimmedVehicleYear) {
      const year = Number(trimmedVehicleYear);

      if (
        !Number.isInteger(year) ||
        year < 1950 ||
        year > new Date().getFullYear() + 1
      ) {
        setErrorMessage(
          "Please enter a valid vehicle year."
        );
        setSaving(false);
        return;
      }
    }

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

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: trimmedName,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (profileError) {
      setErrorMessage(
        `Could not update your name: ${profileError.message}`
      );
      setSaving(false);
      return;
    }

    const { error: agentError } = await supabase
      .from("agent_profiles")
      .update({
        phone: trimmedPhone,
        city: trimmedCity || null,
        vehicle_make: trimmedVehicleMake || null,
        vehicle_model: trimmedVehicleModel || null,
        vehicle_year: trimmedVehicleYear
          ? Number(trimmedVehicleYear)
          : null,
        vehicle_plate_number:
          trimmedPlateNumber || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (agentError) {
      setErrorMessage(
        `Could not update your agent information: ${agentError.message}`
      );
      setSaving(false);
      return;
    }

    setFullName(trimmedName);
    setPhone(trimmedPhone);
    setCity(trimmedCity);
    setVehicleMake(trimmedVehicleMake);
    setVehicleModel(trimmedVehicleModel);
    setVehicleYear(trimmedVehicleYear);
    setVehiclePlateNumber(trimmedPlateNumber);

    setMessage("Profile updated successfully.");
    setSaving(false);

    router.refresh();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Loading your agent profile...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/agent"
            className="text-sm font-semibold text-cyan-700 transition hover:text-cyan-800"
          >
            ← Back to Agent Dashboard
          </Link>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            Agent Profile
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage your account and vehicle information.
          </p>
        </div>

        {/* Account Card */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-2xl font-bold text-cyan-700">
              {fullName.charAt(0).toUpperCase() || "A"}
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {fullName || "Agent"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {email}
              </p>

              {profile?.agent_type && (
                <span className="mt-3 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                  {formatAgentType(profile.agent_type)}
                </span>
              )}
            </div>
          </div>

          <div className="mt-8 border-t border-slate-100 pt-8">
            <form
              onSubmit={handleSave}
              className="space-y-6"
            >
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Personal Information
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Keep your contact information up to date.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label
                    htmlFor="fullName"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Full Name
                  </label>

                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(event) =>
                      setFullName(event.target.value)
                    }
                    disabled={saving}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 disabled:bg-slate-50"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Email
                  </label>

                  <input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Phone Number
                  </label>

                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(event) =>
                      setPhone(event.target.value)
                    }
                    disabled={saving}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 disabled:bg-slate-50"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="city"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    City
                  </label>

                  <input
                    id="city"
                    type="text"
                    value={city}
                    onChange={(event) =>
                      setCity(event.target.value)
                    }
                    disabled={saving}
                    placeholder="Enter your city"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 disabled:bg-slate-50"
                  />
                </div>
              </div>

              {/* Vehicle Information */}
              <div className="border-t border-slate-100 pt-8">
                <h3 className="text-lg font-bold text-slate-900">
                  Vehicle Information
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Update your current vehicle information.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="vehicleMake"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Vehicle Make
                  </label>

                  <input
                    id="vehicleMake"
                    type="text"
                    value={vehicleMake}
                    onChange={(event) =>
                      setVehicleMake(event.target.value)
                    }
                    disabled={saving}
                    placeholder="e.g. Toyota"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 disabled:bg-slate-50"
                  />
                </div>

                <div>
                  <label
                    htmlFor="vehicleModel"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Vehicle Model
                  </label>

                  <input
                    id="vehicleModel"
                    type="text"
                    value={vehicleModel}
                    onChange={(event) =>
                      setVehicleModel(event.target.value)
                    }
                    disabled={saving}
                    placeholder="e.g. Corolla"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 disabled:bg-slate-50"
                  />
                </div>

                <div>
                  <label
                    htmlFor="vehicleYear"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Vehicle Year
                  </label>

                  <input
                    id="vehicleYear"
                    type="number"
                    value={vehicleYear}
                    onChange={(event) =>
                      setVehicleYear(event.target.value)
                    }
                    disabled={saving}
                    placeholder="e.g. 2024"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 disabled:bg-slate-50"
                  />
                </div>

                <div>
                  <label
                    htmlFor="vehiclePlateNumber"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Plate Number
                  </label>

                  <input
                    id="vehiclePlateNumber"
                    type="text"
                    value={vehiclePlateNumber}
                    onChange={(event) =>
                      setVehiclePlateNumber(event.target.value)
                    }
                    disabled={saving}
                    placeholder="Enter plate number"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 disabled:bg-slate-50"
                  />
                </div>
              </div>

              {/* Messages */}
              {message && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                  {message}
                </div>
              )}

              {errorMessage && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {errorMessage}
                </div>
              )}

              <div className="border-t border-slate-100 pt-6">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-xl bg-cyan-700 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving Changes..."
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Navigation */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Link
            href="/agent/tasks"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <p className="font-bold text-slate-900">
              Available Tasks
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Browse available requests.
            </p>
          </Link>

          <Link
            href="/agent/orders"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <p className="font-bold text-slate-900">
              My Orders
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Manage your assigned orders.
            </p>
          </Link>

          <Link
            href="/agent/earnings"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <p className="font-bold text-slate-900">
              Earnings
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Review your earnings.
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}