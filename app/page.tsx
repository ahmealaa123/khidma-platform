import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  const isConnected =
    !error ||
    error.name === "AuthSessionMissingError" ||
    error.message === "Auth session missing!";

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-16">
        <div className="w-full max-w-3xl text-center">
          {/* Logo / Brand */}
          <div className="mb-8 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-600 text-2xl font-black shadow-lg shadow-cyan-900/30">
              K
            </div>
          </div>

          {/* Main Content */}
          <h1 className="text-5xl font-black tracking-tight sm:text-6xl">
            Khidma
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
            On-demand services and delivery made simple.
            <br />
            Get the help you need, when you need it.
          </p>

          {/* Actions */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="w-full rounded-xl bg-cyan-600 px-8 py-4 text-center font-bold text-white shadow-lg shadow-cyan-900/30 transition hover:bg-cyan-500 sm:w-auto"
            >
              Create an Account
            </Link>

            <Link
              href="/login"
              className="w-full rounded-xl border border-slate-600 bg-slate-900 px-8 py-4 text-center font-bold text-white transition hover:border-slate-400 hover:bg-slate-800 sm:w-auto"
            >
              Login
            </Link>
          </div>

          {/* Platform Features */}
          <div className="mt-16 grid gap-4 text-left sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-950 text-xl">
                📦
              </div>

              <h2 className="text-lg font-bold">
                Request a Service
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Create a delivery, shopping, pickup, or errand request
                بسهولة.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-950 text-xl">
                🚴
              </div>

              <h2 className="text-lg font-bold">
                Become an Agent
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Join the platform, complete your application, and start
                receiving tasks after approval.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-950 text-xl">
                🛡️
              </div>

              <h2 className="text-lg font-bold">
                Track Your Request
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Follow your order status from creation until completion.
              </p>
            </div>
          </div>

          {/* Supabase Connection Status */}
          <div className="mt-12 rounded-2xl border border-slate-800 bg-slate-900/50 px-5 py-4">
            <p className="text-sm text-slate-400">
              {isConnected
                ? user
                  ? "Supabase Connected — User Authenticated"
                  : "Supabase Connected Successfully — No User Logged In"
                : "Supabase Connection Error"}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}