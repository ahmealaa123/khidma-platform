"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CustomerSignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          account_type: "customer",
        },
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    setSuccessMessage(
      "Your account has been created. Please check your email to confirm your account."
    );

    setLoading(false);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-32 h-[30rem] w-[30rem] rounded-full bg-cyan-700/20 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/5 blur-3xl" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(14,116,144,0.12),transparent_40%)]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-white shadow-2xl shadow-black/30 lg:grid-cols-2">
          {/* Brand Side */}
          <section className="relative hidden overflow-hidden bg-slate-900 p-10 lg:flex lg:flex-col lg:justify-between xl:p-14">
            <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-cyan-600/20 blur-3xl" />
            <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />

            <div className="relative">
              <Link href="/login" className="inline-flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-600 text-xl font-black text-white shadow-lg shadow-cyan-950/40">
                  K
                </div>

                <div>
                  <p className="text-xl font-black tracking-tight text-white">
                    Khidma
                  </p>

                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
                    Smart Services
                  </p>
                </div>
              </Link>

              <div className="mt-20 max-w-md">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-bold text-cyan-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                  Customer account
                </div>

                <h1 className="text-4xl font-black leading-tight tracking-tight text-white xl:text-5xl">
                  Everything you need,
                  <span className="mt-2 block text-cyan-400">
                    one platform.
                  </span>
                </h1>

                <p className="mt-6 text-base leading-7 text-slate-400">
                  Create your Khidma account and manage deliveries,
                  shopping, pickups, errands, and other services from one
                  place.
                </p>
              </div>
            </div>

            <div className="relative grid gap-3 sm:grid-cols-3">
              <FeatureItem
                icon="✓"
                title="Simple"
                description="Easy requests"
              />

              <FeatureItem
                icon="⚡"
                title="Fast"
                description="Quick matching"
              />

              <FeatureItem
                icon="◉"
                title="Trusted"
                description="Verified agents"
              />
            </div>
          </section>

          {/* Form Side */}
          <section className="flex min-h-[760px] flex-col justify-center bg-white px-6 py-10 sm:px-10 lg:px-12 xl:px-16">
            {/* Mobile Brand */}
            <div className="mb-8 flex items-center justify-between lg:hidden">
              <Link href="/login" className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-700 text-lg font-black text-white">
                  K
                </div>

                <div>
                  <p className="font-black text-slate-900">Khidma</p>

                  <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-700">
                    Smart Services
                  </p>
                </div>
              </Link>
            </div>

            <div className="mx-auto w-full max-w-md">
              <Link
                href="/signup"
                className="inline-flex items-center text-sm font-semibold text-slate-500 transition hover:text-cyan-700"
              >
                ← Back
              </Link>

              <div className="mt-7">
                <p className="text-sm font-bold text-cyan-700">
                  Create your account
                </p>

                <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                  Welcome to Khidma
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Create a Customer account and start requesting services.
                </p>
              </div>

              <form onSubmit={handleSignup} className="mt-8 space-y-5">
                <div>
                  <label
                    htmlFor="fullName"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Full Name
                  </label>

                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Ahmed Alaa"
                    required
                    autoComplete="name"
                    className="h-13 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-cyan-600 focus:bg-white focus:ring-4 focus:ring-cyan-600/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Email Address
                  </label>

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    className="h-13 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-cyan-600 focus:bg-white focus:ring-4 focus:ring-cyan-600/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Password
                  </label>

                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="h-13 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-cyan-600 focus:bg-white focus:ring-4 focus:ring-cyan-600/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Confirm Password
                  </label>

                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    placeholder="Re-enter your password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="h-13 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-cyan-600 focus:bg-white focus:ring-4 focus:ring-cyan-600/10"
                  />
                </div>

                {errorMessage && (
                  <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">
                      !
                    </div>

                    <p className="text-sm font-medium leading-6 text-red-700">
                      {errorMessage}
                    </p>
                  </div>
                )}

                {successMessage && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-700">
                        ✓
                      </div>

                      <div>
                        <p className="text-sm font-bold text-emerald-800">
                          Account created successfully
                        </p>

                        <p className="mt-1 text-sm leading-6 text-emerald-700">
                          {successMessage}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative flex h-13 w-full items-center justify-center overflow-hidden rounded-xl bg-cyan-700 px-5 text-sm font-bold text-white shadow-lg shadow-cyan-700/20 transition hover:bg-cyan-800 hover:shadow-cyan-700/30 focus:outline-none focus:ring-4 focus:ring-cyan-600/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {loading ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        Create Customer Account
                        <span className="transition-transform group-hover:translate-x-1">
                          →
                        </span>
                      </>
                    )}
                  </span>
                </button>
              </form>

              <div className="my-7 flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-200" />

                <span className="text-xs font-medium text-slate-400">
                  Already registered?
                </span>

                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <Link
                href="/login"
                className="flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
              >
                Sign in to your account
              </Link>

              <p className="mt-7 text-center text-xs leading-5 text-slate-400">
                By creating an account, you agree to use Khidma responsibly
                and according to the platform rules.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-sm font-bold text-cyan-400">
        {icon}
      </div>

      <p className="mt-3 text-sm font-bold text-white">
        {title}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {description}
      </p>
    </div>
  );
}