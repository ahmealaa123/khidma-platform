"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AgentType =
  | "driver"
  | "motorcycle_rider"
  | "personal_shopper";

export default function AgentSignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [agentType, setAgentType] =
    useState<AgentType>("motorcycle_rider");

  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");

  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleYear, setVehicleYear] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [requiresVehicle, setRequiresVehicle] = useState(true);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);

  async function handleSignup(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage(
        "Password must be at least 6 characters."
      );
      return;
    }

    if (!acceptedTerms) {
      setErrorMessage(
        "Please agree to the Agent Terms and Conditions."
      );
      return;
    }

    if (requiresVehicle) {
      if (
        !vehicleMake.trim() ||
        !vehicleModel.trim() ||
        !vehicleYear.trim() ||
        !vehiclePlate.trim()
      ) {
        setErrorMessage(
          "Please complete all required vehicle information."
        );
        return;
      }
    }

    setLoading(true);

    try {
      const redirectUrl =
        `${window.location.origin}/auth/callback`;

      const { data, error } =
        await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: redirectUrl,

            data: {
              full_name: fullName.trim(),

              account_type: "agent",

              agent_type: agentType,

              phone: phone.trim(),

              city: city.trim(),

              vehicle_make: requiresVehicle
                ? vehicleMake.trim()
                : null,

              vehicle_model: requiresVehicle
                ? vehicleModel.trim()
                : null,

              vehicle_year: requiresVehicle
                ? vehicleYear.trim()
                : null,

              vehicle_plate_number: requiresVehicle
                ? vehiclePlate.trim()
                : null,
            },
          },
        });

      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      /*
       * CASE 1:
       * Supabase created the account and returned
       * an active session.
       *
       * This happens when email confirmation
       * is disabled.
       */
      if (data.session) {
        setAccountCreated(true);

        setSuccessMessage(
          "Your account has been created successfully. You can now continue to the document upload page."
        );

        setLoading(false);

        return;
      }

      /*
       * CASE 2:
       * Account was created but email confirmation
       * is required.
       *
       * IMPORTANT:
       * We DO NOT call signUp() again.
       */
      setAccountCreated(true);

      setSuccessMessage(
        "Your account has been created successfully. Please check your email and confirm your account. After confirmation, you will be redirected automatically to the document upload page."
      );

      setLoading(false);
    } catch (error) {
      console.error(
        "Agent signup error:",
        error
      );

      setErrorMessage(
        "Something went wrong while creating your account. Please try again."
      );

      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto flex min-h-[85vh] max-w-6xl items-center justify-center">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm md:grid-cols-2">

          {/* LEFT SIDE */}
          <div className="hidden bg-slate-900 p-10 text-white md:flex md:flex-col md:justify-between">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-700 text-xl font-bold">
                K
              </div>

              <p className="mt-10 text-sm font-semibold uppercase tracking-wider text-cyan-400">
                Agent Account
              </p>

              <h1 className="mt-4 text-4xl font-bold leading-tight">
                Work with Khidma.
              </h1>

              <p className="mt-5 max-w-md leading-7 text-slate-300">
                Join the Khidma network and receive service
                requests from customers in your area.
              </p>
            </div>

            <div className="mt-10 rounded-2xl border border-slate-700 bg-slate-800/60 p-5">
              <p className="text-sm font-medium text-white">
                Flexible work. Real opportunities.
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Create your agent account, confirm your email,
                submit your documents, and wait for your
                application to be reviewed.
              </p>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="p-7 sm:p-10">

            {/* HEADER */}
            <div className="mb-8">
              <Link
                href="/signup"
                className="text-sm font-medium text-slate-500 transition hover:text-cyan-700"
              >
                ← Back
              </Link>

              <h2 className="mt-6 text-3xl font-bold tracking-tight text-slate-900">
                Create Agent Account
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Complete your information to start your Agent
                application.
              </p>
            </div>

            {/* FORM */}
            <form
              onSubmit={handleSignup}
              className="space-y-5"
            >

              {/* Full Name */}
              <div>
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
                  placeholder="Ahmed Alaa"
                  required
                  autoComplete="name"
                  disabled={accountCreated}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 disabled:bg-slate-100"
                />
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Email Address
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  disabled={accountCreated}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 disabled:bg-slate-100"
                />
              </div>

              {/* Phone */}
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
                  placeholder="+20 100 000 0000"
                  required
                  autoComplete="tel"
                  disabled={accountCreated}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 disabled:bg-slate-100"
                />
              </div>

              {/* City */}
              <div>
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
                  placeholder="Cairo"
                  required
                  disabled={accountCreated}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 disabled:bg-slate-100"
                />
              </div>

              {/* Agent Type */}
              <div>
                <label
                  htmlFor="agentType"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Agent Type
                </label>

                <select
                  id="agentType"
                  value={agentType}
                  onChange={(event) =>
                    setAgentType(
                      event.target.value as AgentType
                    )
                  }
                  disabled={accountCreated}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 disabled:bg-slate-100"
                >
                  <option value="driver">
                    Driver
                  </option>

                  <option value="motorcycle_rider">
                    Motorcycle Rider
                  </option>

                  <option value="personal_shopper">
                    Personal Shopper
                  </option>
                </select>
              </div>

              {/* VEHICLE */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

                <div className="flex items-start gap-3">

                  <input
                    id="requiresVehicle"
                    type="checkbox"
                    checked={requiresVehicle}
                    onChange={(event) =>
                      setRequiresVehicle(
                        event.target.checked
                      )
                    }
                    disabled={accountCreated}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-cyan-700 focus:ring-cyan-600"
                  />

                  <div>
                    <label
                      htmlFor="requiresVehicle"
                      className="text-sm font-semibold text-slate-800"
                    >
                      I will use a vehicle
                    </label>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Provide your vehicle information if you
                      will use a vehicle for deliveries.
                    </p>
                  </div>
                </div>

                {requiresVehicle && (
                  <div className="mt-5 space-y-4">

                    {/* Vehicle Make */}
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
                          setVehicleMake(
                            event.target.value
                          )
                        }
                        placeholder="Honda"
                        disabled={accountCreated}
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 disabled:bg-slate-100"
                      />
                    </div>

                    {/* Vehicle Model */}
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
                          setVehicleModel(
                            event.target.value
                          )
                        }
                        placeholder="CB 150"
                        disabled={accountCreated}
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 disabled:bg-slate-100"
                      />
                    </div>

                    {/* Vehicle Year */}
                    <div>
                      <label
                        htmlFor="vehicleYear"
                        className="mb-2 block text-sm font-semibold text-slate-700"
                      >
                        Vehicle Year
                      </label>

                      <input
                        id="vehicleYear"
                        type="text"
                        value={vehicleYear}
                        onChange={(event) =>
                          setVehicleYear(
                            event.target.value
                          )
                        }
                        placeholder="2024"
                        disabled={accountCreated}
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 disabled:bg-slate-100"
                      />
                    </div>

                    {/* Plate */}
                    <div>
                      <label
                        htmlFor="vehiclePlate"
                        className="mb-2 block text-sm font-semibold text-slate-700"
                      >
                        Plate Number
                      </label>

                      <input
                        id="vehiclePlate"
                        type="text"
                        value={vehiclePlate}
                        onChange={(event) =>
                          setVehiclePlate(
                            event.target.value
                          )
                        }
                        placeholder="ABC 1234"
                        disabled={accountCreated}
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 disabled:bg-slate-100"
                      />
                    </div>

                  </div>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Password
                </label>

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  disabled={accountCreated}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 disabled:bg-slate-100"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Confirm Password
                </label>

                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value
                    )
                  }
                  placeholder="Re-enter your password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  disabled={accountCreated}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 disabled:bg-slate-100"
                />
              </div>

              {/* Terms */}
              <div className="flex items-start gap-3">
                <input
                  id="acceptedTerms"
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(event) =>
                    setAcceptedTerms(
                      event.target.checked
                    )
                  }
                  disabled={accountCreated}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-cyan-700 focus:ring-cyan-600"
                />

                <label
                  htmlFor="acceptedTerms"
                  className="text-sm leading-6 text-slate-600"
                >
                  I agree to the Agent Terms and Conditions and
                  confirm that the information provided is accurate.
                </label>
              </div>

              {/* ERROR */}
              {errorMessage && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                  {errorMessage}
                </div>
              )}

              {/* SUCCESS */}
              {successMessage && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-black text-emerald-700">
                      ✓
                    </div>

                    <div>
                      <p className="font-semibold text-emerald-800">
                        Account created successfully
                      </p>

                      <p className="mt-1 text-sm leading-6 text-emerald-700">
                        {successMessage}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-xl border border-emerald-200 bg-white/70 p-4">
                    <p className="text-sm font-bold text-slate-800">
                      Next step
                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Confirm your email first. After confirmation,
                      you can upload the documents required to complete
                      your Agent application.
                    </p>

                    <Link
                      href="/signup/agent/documents"
                      className="mt-4 inline-flex items-center justify-center rounded-xl bg-cyan-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-cyan-800"
                    >
                      Open Document Upload Page →
                    </Link>
                  </div>
                </div>
              )}

              {/* SUBMIT BUTTON */}
              {!accountCreated && (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-cyan-700 px-5 py-3.5 font-semibold text-white shadow-sm transition hover:bg-cyan-800 focus:outline-none focus:ring-4 focus:ring-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? "Creating Account..."
                    : "Submit Application"}
                </button>
              )}

              {/* DOCUMENT UPLOAD INSTRUCTIONS */}
              {!accountCreated && (
                <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-sm shadow-sm">
                      📄
                    </div>

                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        Document Upload
                      </p>

                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        First submit your Agent application and confirm
                        your email. After confirmation, you can upload
                        your verification documents from the page below.
                      </p>

                      <Link
                        href="/signup/agent/documents"
                        className="mt-3 inline-flex text-sm font-bold text-cyan-700 transition hover:text-cyan-800"
                      >
                        Open Document Upload Page →
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </form>

            {/* LOGIN */}
            <p className="mt-7 text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-cyan-700 hover:text-cyan-800"
              >
                Login
              </Link>
            </p>

          </div>
        </div>
      </div>
    </main>
  );
}