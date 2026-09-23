"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setErrorMessage("Unable to verify your account.");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || profile.role !== "admin") {
      await supabase.auth.signOut();

      setErrorMessage(
        "Access denied. This account does not have administrator access."
      );

      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto flex min-h-[85vh] max-w-6xl items-center justify-center">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm md:grid-cols-2">
          {/* Brand Section */}
          <div className="hidden bg-slate-900 p-10 text-white md:flex md:flex-col md:justify-between">
            <div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-700 text-2xl font-bold">
                K
              </div>

              <p className="mt-10 text-sm font-semibold uppercase tracking-wider text-cyan-400">
                Administration
              </p>

              <h1 className="mt-4 text-4xl font-bold leading-tight">
                Khidma Admin Portal
              </h1>

              <p className="mt-5 max-w-md leading-7 text-slate-300">
                Manage Agent applications, orders, customers, operations,
                payments, and platform activity from one secure workspace.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-5">
              <p className="text-sm font-semibold text-white">
                Restricted Access
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                This portal is reserved for authorized Khidma administrators.
              </p>
            </div>
          </div>

          {/* Login Form */}
          <div className="p-7 sm:p-10">
            <div className="mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-50 text-xl font-bold text-cyan-700 md:hidden">
                K
              </div>

              <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-cyan-700">
                Admin Portal
              </p>

              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                Welcome back
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Sign in with your administrator account to continue.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Admin Email
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@example.com"
                  required
                  autoComplete="email"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
                />
              </div>

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
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
                />
              </div>

              {errorMessage && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-cyan-700 px-5 py-3.5 font-semibold text-white shadow-sm transition hover:bg-cyan-800 focus:outline-none focus:ring-4 focus:ring-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing In..." : "Sign In to Admin Portal"}
              </button>
            </form>

            <div className="mt-7 border-t border-slate-200 pt-6 text-center">
              <p className="text-xs leading-5 text-slate-400">
                Authorized administrators only.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}