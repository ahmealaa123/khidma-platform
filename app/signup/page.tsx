"use client";

import Link from "next/link";

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto flex min-h-[80vh] max-w-6xl items-center justify-center">
        <div className="w-full">
          {/* Header */}
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-700 text-2xl font-bold text-white shadow-sm">
              K
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Welcome to Khidma
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-500 sm:text-lg">
              Choose how you would like to use Khidma and get started in a few
              simple steps.
            </p>
          </div>

          {/* Account Type Cards */}
          <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
            {/* Customer */}
            <Link
              href="/signup/customer"
              className="group rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-cyan-200 hover:shadow-lg"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-50 text-2xl">
                🛍️
              </div>

              <h2 className="mt-6 text-2xl font-bold text-slate-900">
                I need a service
              </h2>

              <p className="mt-3 min-h-[56px] leading-7 text-slate-500">
                Request deliveries, shopping, pickups, errands, and other
                on-demand services.
              </p>

              <div className="mt-8 flex items-center font-semibold text-cyan-700">
                Continue as Customer
                <span className="ml-2 transition-transform duration-200 group-hover:translate-x-1">
                  →
                </span>
              </div>
            </Link>

            {/* Agent */}
            <Link
              href="/signup/agent"
              className="group rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-cyan-200 hover:shadow-lg"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                🚴
              </div>

              <h2 className="mt-6 text-2xl font-bold text-slate-900">
                I want to become an Agent
              </h2>

              <p className="mt-3 min-h-[56px] leading-7 text-slate-500">
                Join Khidma, complete your verification, accept tasks, and
                earn from completed services.
              </p>

              <div className="mt-8 flex items-center font-semibold text-cyan-700">
                Become an Agent
                <span className="ml-2 transition-transform duration-200 group-hover:translate-x-1">
                  →
                </span>
              </div>
            </Link>
          </div>

          {/* Login */}
          <div className="mt-10 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-cyan-700 hover:text-cyan-800"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}