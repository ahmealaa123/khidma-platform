import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DocumentReview from "./DocumentReview";

type AgentStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "suspended";

type AgentType =
  | "driver"
  | "motorcycle_rider"
  | "personal_shopper";

type DocumentType =
  | "national_id"
  | "driving_license"
  | "vehicle_registration"
  | "profile_photo";

type DocumentStatus =
  | "pending"
  | "approved"
  | "rejected";

type AgentProfile = {
  agent_type: AgentType;
  phone: string;
  city: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_year: number | null;
  vehicle_plate_number: string | null;
};

type AgentDocument = {
  id: string;
  document_type: DocumentType;
  file_name: string;
  file_path: string;
  status: DocumentStatus;
  rejection_reason: string | null;
  created_at: string;
};

export default async function AgentVerificationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!adminProfile || adminProfile.role !== "admin") {
    redirect("/admin/login");
  }

  const { data: agent, error: agentError } =
    await supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        role,
        agent_status,
        created_at,
        updated_at,
        agent_profiles (
          agent_type,
          phone,
          city,
          vehicle_make,
          vehicle_model,
          vehicle_year,
          vehicle_plate_number
        )
      `)
      .eq("id", id)
      .eq("role", "agent")
      .single();

  if (agentError || !agent) {
    notFound();
  }

  const agentProfile: AgentProfile | null =
    Array.isArray(agent.agent_profiles)
      ? agent.agent_profiles[0] ?? null
      : agent.agent_profiles;

  const {
    data: documents,
    error: documentsError,
  } = await supabase
    .from("agent_documents")
    .select(`
      id,
      document_type,
      file_name,
      file_path,
      status,
      rejection_reason,
      created_at
    `)
    .eq("agent_id", id)
    .order("created_at", {
      ascending: true,
    });

  const agentDocuments: AgentDocument[] =
    documents ?? [];

  const documentsWithUrls = await Promise.all(
    agentDocuments.map(async (document) => {
      const { data } = await supabase.storage
        .from("agent-documents")
        .createSignedUrl(
          document.file_path,
          60 * 60
        );

      return {
        id: document.id,
        document_type: document.document_type,
        file_name: document.file_name,
        file_path: document.file_path,
        status: document.status,
        rejection_reason:
          document.rejection_reason,
        created_at: document.created_at,
        signedUrl: data?.signedUrl ?? null,
      };
    })
  );

  const requiredDocumentTypes: DocumentType[] = [
    "national_id",
    "profile_photo",
  ];

  if (
    agentProfile?.agent_type === "driver" ||
    agentProfile?.agent_type === "motorcycle_rider"
  ) {
    requiredDocumentTypes.push(
      "driving_license",
      "vehicle_registration"
    );
  }

  const uploadedRequiredDocuments =
    requiredDocumentTypes.filter((type) =>
      agentDocuments.some(
        (document) =>
          document.document_type === type
      )
    ).length;

  const verificationComplete =
    uploadedRequiredDocuments ===
    requiredDocumentTypes.length;

  const approvedDocuments =
    agentDocuments.filter(
      (document) =>
        document.status === "approved"
    ).length;

  const rejectedDocuments =
    agentDocuments.filter(
      (document) =>
        document.status === "rejected"
    ).length;

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
                Agent Verification
              </h1>
            </div>
          </div>

          <Link
            href="/admin/agents"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Back to Agents
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Agent Application
          </p>

          <div className="mt-1 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                {agent.full_name ||
                  "Unnamed Agent"}
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Application submitted on{" "}
                {new Intl.DateTimeFormat(
                  "en-US",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }
                ).format(
                  new Date(agent.created_at)
                )}
              </p>
            </div>

            <StatusBadge
              status={
                agent.agent_status as
                  | AgentStatus
                  | null
              }
            />
          </div>
        </div>

        {!verificationComplete && (
          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-lg">
                ⚠️
              </div>

              <div>
                <p className="font-semibold text-amber-800">
                  Verification requirements are
                  incomplete
                </p>

                <p className="mt-1 text-sm leading-6 text-amber-700">
                  This Agent has uploaded{" "}
                  {uploadedRequiredDocuments} of{" "}
                  {requiredDocumentTypes.length}{" "}
                  required documents.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-700">
                Personal Information
              </p>

              <h3 className="mt-1 text-xl font-bold text-slate-900">
                Agent Details
              </h3>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <InfoItem
                label="Full Name"
                value={
                  agent.full_name || "—"
                }
              />

              <InfoItem
                label="Phone Number"
                value={
                  agentProfile?.phone || "—"
                }
              />

              <InfoItem
                label="Agent Type"
                value={getAgentTypeLabel(
                  agentProfile?.agent_type
                )}
              />

              <InfoItem
                label="City"
                value={
                  agentProfile?.city || "—"
                }
              />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-cyan-700">
              Application
            </p>

            <h3 className="mt-1 text-xl font-bold text-slate-900">
              Verification Status
            </h3>

            <div className="mt-6">
              <StatusBadge
                status={
                  agent.agent_status as
                    | AgentStatus
                    | null
                }
              />
            </div>

            <div className="mt-5 border-t border-slate-200 pt-5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Required Documents
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {uploadedRequiredDocuments}/
                {requiredDocumentTypes.length}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Required documents uploaded
              </p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-emerald-50 p-3">
                <p className="text-xs text-emerald-600">
                  Approved
                </p>

                <p className="mt-1 text-xl font-bold text-emerald-700">
                  {approvedDocuments}
                </p>
              </div>

              <div className="rounded-xl bg-red-50 p-3">
                <p className="text-xs text-red-600">
                  Rejected
                </p>

                <p className="mt-1 text-xl font-bold text-red-700">
                  {rejectedDocuments}
                </p>
              </div>
            </div>
          </section>
        </div>

        {(agentProfile?.vehicle_make ||
          agentProfile?.vehicle_model) && (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-700">
                Vehicle Information
              </p>

              <h3 className="mt-1 text-xl font-bold text-slate-900">
                Registered Vehicle
              </h3>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <InfoItem
                label="Make"
                value={
                  agentProfile?.vehicle_make ||
                  "—"
                }
              />

              <InfoItem
                label="Model"
                value={
                  agentProfile?.vehicle_model ||
                  "—"
                }
              />

              <InfoItem
                label="Year"
                value={
                  agentProfile?.vehicle_year
                    ? String(
                        agentProfile.vehicle_year
                      )
                    : "—"
                }
              />

              <InfoItem
                label="Plate Number"
                value={
                  agentProfile?.vehicle_plate_number ||
                  "—"
                }
              />
            </div>
          </section>
        )}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-cyan-700">
              Document Verification
            </p>

            <h3 className="mt-1 text-xl font-bold text-slate-900">
              Submitted Documents
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Review each document and approve or
              reject it individually.
            </p>
          </div>

          {documentsError && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Could not load Agent documents.
            </div>
          )}

          {documentsWithUrls.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                📄
              </div>

              <h4 className="mt-4 font-semibold text-slate-900">
                No documents uploaded
              </h4>

              <p className="mt-1 text-sm text-slate-500">
                This Agent has not submitted any
                documents yet.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {documentsWithUrls.map(
                (document) => (
                  <DocumentReview
                    key={document.id}
                    document={document}
                  />
                )
              )}
            </div>
          )}
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-cyan-700">
              Admin Actions
            </p>

            <h3 className="mt-1 text-xl font-bold text-slate-900">
              Application Decision
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Agent account status can be managed from
              the Agent Management page after reviewing
              the submitted documents.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/admin/agents"
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Return to Agent Management
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: AgentStatus | null;
}) {
  const styles =
    status === "approved"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "rejected"
        ? "border-red-200 bg-red-50 text-red-700"
        : status === "suspended"
          ? "border-slate-200 bg-slate-100 text-slate-700"
          : "border-amber-200 bg-amber-50 text-amber-700";

  const label =
    status === "approved"
      ? "Approved"
      : status === "rejected"
        ? "Rejected"
        : status === "suspended"
          ? "Suspended"
          : "Pending";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold ${styles}`}
    >
      {label}
    </span>
  );
}

function getAgentTypeLabel(
  type?: AgentType
) {
  switch (type) {
    case "driver":
      return "Driver";

    case "motorcycle_rider":
      return "Motorcycle Rider";

    case "personal_shopper":
      return "Personal Shopper";

    default:
      return "—";
  }
}