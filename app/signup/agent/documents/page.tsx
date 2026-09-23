"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AgentType =
  | "driver"
  | "motorcycle_rider"
  | "personal_shopper";

type DocumentType =
  | "national_id"
  | "driving_license"
  | "vehicle_registration"
  | "profile_photo";

type DocumentItem = {
  type: DocumentType;
  title: string;
  description: string;
  accept: string;
  required: boolean;
  icon: string;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function AgentDocumentsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [agentType, setAgentType] = useState<AgentType | null>(null);

  const [files, setFiles] = useState<
    Partial<Record<DocumentType, File>>
  >({});

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadAgent() {
      try {
        setLoading(true);
        setErrorMessage("");

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          if (mounted) {
            setErrorMessage(
              `Could not verify your session: ${userError.message}`
            );
            setLoading(false);
          }

          return;
        }

        if (!user) {
          router.replace("/login");
          return;
        }

        const {
          data: profile,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select("role, agent_status")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          if (mounted) {
            setErrorMessage(
              `Could not load your account profile: ${profileError.message}`
            );
            setLoading(false);
          }

          return;
        }

        if (!profile) {
          if (mounted) {
            setErrorMessage(
              "Your account profile was not found. Please sign out and sign in again."
            );
            setLoading(false);
          }

          return;
        }

        if (profile.role !== "agent") {
          if (mounted) {
            setErrorMessage(
              `This account is registered as "${profile.role}", not as an Agent.`
            );
            setLoading(false);
          }

          return;
        }

        const {
          data: agentProfile,
          error: agentError,
        } = await supabase
          .from("agent_profiles")
          .select("agent_type")
          .eq("id", user.id)
          .maybeSingle();

        if (agentError) {
          if (mounted) {
            setErrorMessage(
              `Could not load your Agent profile: ${agentError.message}`
            );
            setLoading(false);
          }

          return;
        }

        if (!agentProfile) {
          if (mounted) {
            setErrorMessage(
              "Your Agent profile was not found. Please restart the Agent application."
            );
            setLoading(false);
          }

          return;
        }

        if (mounted) {
          setAgentType(agentProfile.agent_type as AgentType);
          setLoading(false);
        }
      } catch (error) {
        if (mounted) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Something went wrong while loading your Agent application."
          );
          setLoading(false);
        }
      }
    }

    loadAgent();

    return () => {
      mounted = false;
    };
  }, [router, supabase]);

  const documents = useMemo<DocumentItem[]>(() => {
    const requiresVehicle =
      agentType === "driver" ||
      agentType === "motorcycle_rider";

    return [
      {
        type: "national_id",
        title: "National ID",
        description:
          "Upload a clear photo or PDF of your valid national ID.",
        accept:
          "image/jpeg,image/png,image/webp,application/pdf",
        required: true,
        icon: "🪪",
      },
      {
        type: "driving_license",
        title: "Driving License",
        description:
          "Upload your valid driving license.",
        accept:
          "image/jpeg,image/png,image/webp,application/pdf",
        required: requiresVehicle,
        icon: "📄",
      },
      {
        type: "vehicle_registration",
        title: "Vehicle Registration",
        description:
          "Upload the vehicle registration document.",
        accept:
          "image/jpeg,image/png,image/webp,application/pdf",
        required: requiresVehicle,
        icon: "🚘",
      },
      {
        type: "profile_photo",
        title: "Profile Photo",
        description:
          "Upload a clear recent photo of yourself.",
        accept:
          "image/jpeg,image/png,image/webp",
        required: true,
        icon: "👤",
      },
    ];
  }, [agentType]);

  function handleFileChange(
    type: DocumentType,
    file?: File
  ) {
    setErrorMessage("");

    if (!file) {
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage(
        `${file.name} is larger than 10 MB. Please choose a smaller file.`
      );
      return;
    }

    setFiles((current) => ({
      ...current,
      [type]: file,
    }));
  }

  function getAgentTypeLabel(type: AgentType | null) {
    switch (type) {
      case "driver":
        return "Driver";

      case "motorcycle_rider":
        return "Motorcycle Rider";

      case "personal_shopper":
        return "Personal Shopper";

      default:
        return "";
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage("");

    if (!agentType) {
      setErrorMessage(
        "We could not determine your Agent type. Please restart your application."
      );
      return;
    }

    const missingDocuments = documents
      .filter((document) => document.required)
      .filter((document) => !files[document.type]);

    if (missingDocuments.length > 0) {
      setErrorMessage(
        `Please upload: ${missingDocuments
          .map((document) => document.title)
          .join(", ")}.`
      );
      return;
    }

    setSubmitting(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw new Error(
          `Could not verify your session: ${userError.message}`
        );
      }

      if (!user) {
        router.replace("/login");
        return;
      }

      for (const document of documents) {
        const file = files[document.type];

        if (!file) {
          continue;
        }

        const extension =
          file.name.split(".").pop()?.toLowerCase() ||
          "file";

        const filePath = `${user.id}/${document.type}-${crypto.randomUUID()}.${extension}`;

        const { error: uploadError } =
          await supabase.storage
            .from("agent-documents")
            .upload(filePath, file, {
              cacheControl: "3600",
              upsert: false,
            });

        if (uploadError) {
          throw new Error(
            `Could not upload ${document.title}: ${uploadError.message}`
          );
        }

        const { data: existingDocument } =
          await supabase
            .from("agent_documents")
            .select("file_path")
            .eq("agent_id", user.id)
            .eq("document_type", document.type)
            .maybeSingle();

        const { error: databaseError } =
          await supabase
            .from("agent_documents")
            .upsert(
              {
                agent_id: user.id,
                document_type: document.type,
                file_name: file.name,
                file_path: filePath,
                status: "pending",
                rejection_reason: null,
                updated_at: new Date().toISOString(),
              },
              {
                onConflict:
                  "agent_id,document_type",
              }
            );

        if (databaseError) {
          await supabase.storage
            .from("agent-documents")
            .remove([filePath]);

          throw new Error(
            `Could not save ${document.title}: ${databaseError.message}`
          );
        }

        if (existingDocument?.file_path) {
          await supabase.storage
            .from("agent-documents")
            .remove([
              existingDocument.file_path,
            ]);
        }
      }

      router.push("/signup/agent/pending");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while uploading your documents."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4">
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-cyan-600/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/20 border-t-cyan-400" />
          </div>

          <p className="mt-5 text-sm font-medium text-slate-300">
            Loading your application...
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Preparing your verification workspace
          </p>
        </div>
      </main>
    );
  }

  const uploadedCount = documents.filter(
    (document) => files[document.type]
  ).length;

  const requiredCount = documents.filter(
    (document) => document.required
  ).length;

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-6 sm:px-6 lg:px-8">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-cyan-600/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-[32rem] w-[32rem] rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-400/5 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(14,116,144,0.16),transparent_42%)]" />
      </div>

      <div className="relative mx-auto max-w-6xl">
        {/* Top Bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/signup/agent"
            className="flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-600 text-lg font-black text-white shadow-lg shadow-cyan-950/30">
              K
            </div>

            <div>
              <p className="font-black tracking-tight text-white">
                Khidma
              </p>

              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-400">
                Smart Services
              </p>
            </div>
          </Link>

          <div className="hidden items-center gap-3 sm:flex">
            <span className="text-xs font-medium text-slate-500">
              Application
            </span>

            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500 text-xs font-black text-white">
                1
              </div>

              <div className="h-px w-8 bg-cyan-500/40" />

              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-400/10 text-xs font-black text-cyan-300">
                2
              </div>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="mt-6 overflow-hidden rounded-[2rem] border border-white/10 bg-white shadow-2xl shadow-black/30">
          {/* Header */}
          <div className="relative overflow-hidden bg-slate-900 px-6 py-10 sm:px-10 lg:px-14">
            <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full bg-cyan-600/20 blur-3xl" />
            <div className="absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />

            <div className="relative">
              <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-bold text-cyan-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                    Step 2 of 2
                  </div>

                  <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl">
                    Verify your
                    <span className="block text-cyan-400">
                      identity.
                    </span>
                  </h1>

                  <p className="mt-5 max-w-xl text-sm leading-7 text-slate-400 sm:text-base">
                    Upload the documents required to complete your
                    Agent application. Clear documents help our team
                    review your application faster.
                  </p>

                  {agentType && (
                    <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 backdrop-blur-sm">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/20 text-xs">
                        ✓
                      </span>

                      Applying as{" "}
                      <span className="text-cyan-300">
                        {getAgentTypeLabel(agentType)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm lg:min-w-[220px]">
                  <div className="flex items-center justify-between gap-6">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Documents
                      </p>

                      <p className="mt-1 text-2xl font-black text-white">
                        {uploadedCount}
                        <span className="text-slate-500">
                          /{documents.length}
                        </span>
                      </p>
                    </div>

                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-xl">
                      📁
                    </div>
                  </div>

                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-cyan-500 transition-all duration-300"
                      style={{
                        width: `${
                          documents.length
                            ? (uploadedCount /
                                documents.length) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 sm:p-10 lg:p-14">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">
                  Verification Center
                </p>

                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                  Required Documents
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Upload clear, readable files. Maximum size is 10 MB
                  per document.
                </p>
              </div>

              <div className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600">
                {requiredCount} required
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mt-8 grid gap-5 md:grid-cols-2">
                {documents.map((document, index) => {
                  const selectedFile =
                    files[document.type];

                  return (
                    <div
                      key={document.type}
                      className={`group rounded-2xl border p-5 transition duration-200 ${
                        selectedFile
                          ? "border-emerald-200 bg-emerald-50/30 shadow-sm"
                          : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div
                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl ${
                              selectedFile
                                ? "bg-emerald-100"
                                : "bg-slate-100"
                            }`}
                          >
                            {selectedFile
                              ? "✓"
                              : document.icon}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-black text-slate-900">
                                {document.title}
                              </h3>

                              <span className="text-xs font-bold text-slate-300">
                                0{index + 1}
                              </span>
                            </div>

                            <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
                              {document.description}
                            </p>
                          </div>
                        </div>

                        {document.required ? (
                          <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-600">
                            Required
                          </span>
                        ) : (
                          <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500">
                            Optional
                          </span>
                        )}
                      </div>

                      <label
                        htmlFor={`document-${document.type}`}
                        className={`mt-5 flex cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed px-4 py-4 transition ${
                          selectedFile
                            ? "border-emerald-300 bg-white"
                            : "border-slate-200 bg-slate-50 hover:border-cyan-400 hover:bg-cyan-50/40"
                        }`}
                      >
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-black ${
                            selectedFile
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-white text-cyan-700 shadow-sm"
                          }`}
                        >
                          {selectedFile ? "✓" : "↑"}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-slate-800">
                            {selectedFile
                              ? "Document selected"
                              : "Click to upload"}
                          </p>

                          <p className="mt-0.5 truncate text-xs text-slate-500">
                            {selectedFile
                              ? selectedFile.name
                              : "JPG, PNG, WEBP or PDF · Max 10 MB"}
                          </p>
                        </div>

                        {!selectedFile && (
                          <span className="hidden rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-600 shadow-sm sm:block">
                            Browse
                          </span>
                        )}

                        <input
                          id={`document-${document.type}`}
                          type="file"
                          accept={document.accept}
                          onChange={(event) =>
                            handleFileChange(
                              document.type,
                              event.target.files?.[0]
                            )
                          }
                          className="sr-only"
                        />
                      </label>
                    </div>
                  );
                })}
              </div>

              {errorMessage && (
                <div className="mt-7 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-black text-red-600">
                    !
                  </div>

                  <div>
                    <p className="text-sm font-black text-red-800">
                      We could not load your Agent application
                    </p>

                    <p className="mt-1 text-sm leading-6 text-red-700">
                      {errorMessage}
                    </p>
                  </div>
                </div>
              )}

              {/* Privacy */}
              <div className="mt-8 overflow-hidden rounded-2xl border border-cyan-100 bg-cyan-50/60">
                <div className="flex items-start gap-4 p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-lg shadow-sm">
                    🔒
                  </div>

                  <div>
                    <p className="text-sm font-black text-slate-900">
                      Your documents are private
                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Uploaded documents are stored in private secure
                      storage and are only accessible through authorized
                      access during the verification process.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-9 flex flex-col-reverse gap-4 border-t border-slate-200 pt-8 sm:flex-row sm:items-center sm:justify-between">
                <Link
                  href="/signup/agent"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  ← Back to Application
                </Link>

                <button
                  type="submit"
                  disabled={submitting}
                  className="group inline-flex items-center justify-center rounded-xl bg-cyan-700 px-7 py-3.5 text-sm font-black text-white shadow-lg shadow-cyan-700/20 transition hover:bg-cyan-800 hover:shadow-cyan-700/30 focus:outline-none focus:ring-4 focus:ring-cyan-600/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Uploading Documents...
                    </>
                  ) : (
                    <>
                      Submit Application
                      <span className="ml-2 transition-transform group-hover:translate-x-1">
                        →
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        <p className="mx-auto mt-6 max-w-3xl text-center text-xs leading-5 text-slate-500">
          By submitting your documents, you confirm that the information
          provided is accurate and belongs to you.
        </p>
      </div>
    </main>
  );
}