import Link from "next/link";

export default function AgentPendingPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto flex min-h-[85vh] max-w-4xl items-center justify-center">
        <div className="w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

          {/* Header */}
          <div className="bg-slate-900 px-7 py-10 text-white sm:px-10">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-700 text-2xl">
              K
            </div>

            <p className="mt-7 text-sm font-semibold uppercase tracking-wider text-cyan-400">
              Agent Application
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Application Submitted
            </h1>

            <p className="mt-3 max-w-2xl leading-7 text-slate-300">
              Thank you for applying to become a Khidma Agent. Your
              application has been submitted successfully and is now waiting
              for verification.
            </p>
          </div>

          {/* Main Content */}
          <div className="p-7 sm:p-10">

            {/* Status Card */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <div className="flex items-start gap-4">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xl">
                  ⏳
                </div>

                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">
                    Current Status
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-slate-900">
                    Under Review
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Our team will review your information and submitted
                    requirements before your Agent account can accept tasks.
                  </p>
                </div>

              </div>
            </div>

            {/* Verification Steps */}
            <div className="mt-8">
              <h2 className="text-xl font-bold text-slate-900">
                What happens next?
              </h2>

              <div className="mt-6 space-y-6">

                {/* Step 1 */}
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-sm font-bold text-cyan-700">
                    1
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900">
                      Application received
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Your Agent registration has been successfully received
                      by Khidma.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-sm font-bold text-cyan-700">
                    2
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900">
                      Verification in progress
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Our team will review your profile, vehicle information,
                      and required documents.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-500">
                    3
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900">
                      Account approval
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Once approved, you will be able to access your Agent
                      dashboard and start accepting available tasks.
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* Important Notice */}
            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-800">
                Important
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Your Agent account will remain restricted while your
                application is under review. You will receive access after
                the verification process is completed.
              </p>
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">

              <Link
                href="/login"
                className="flex-1 rounded-xl bg-cyan-700 px-5 py-3.5 text-center font-semibold text-white transition hover:bg-cyan-800 focus:outline-none focus:ring-4 focus:ring-cyan-200"
              >
                Go to Login
              </Link>

              <Link
                href="/"
                className="flex-1 rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-center font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Back to Home
              </Link>

            </div>

          </div>
        </div>
      </div>
    </main>
  );
}