"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

const statusFlow: OrderStatus[] = [
  "agent_assigned",
  "going_to_pickup",
  "arrived_at_pickup",
  "item_collected",
  "on_the_way",
  "delivered",
];

export default function AgentOrderStatusManager({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: OrderStatus;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [status, setStatus] =
    useState<OrderStatus>(currentStatus);

  const [saving, setSaving] = useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [otpCode, setOtpCode] = useState("");

  const [enteredOtp, setEnteredOtp] =
    useState("");

  const [loadingProof, setLoadingProof] =
    useState(false);

  const [otpVerified, setOtpVerified] =
    useState(false);

  const [photoPath, setPhotoPath] =
    useState<string | null>(null);

  const [selectedPhoto, setSelectedPhoto] =
    useState<File | null>(null);

  const [uploadingPhoto, setUploadingPhoto] =
    useState(false);

  const [photoUploaded, setPhotoUploaded] =
    useState(false);

  useEffect(() => {
    async function loadDeliveryProof() {
      if (status !== "on_the_way") {
        return;
      }

      setLoadingProof(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("order_proofs")
        .select(
          "otp_code, otp_verified, photo_path"
        )
        .eq("order_id", orderId)
        .single();

      if (error) {
        setErrorMessage(
          `Could not load delivery verification: ${error.message}`
        );

        setLoadingProof(false);
        return;
      }

      if (data) {
        setOtpCode(data.otp_code);
        setOtpVerified(data.otp_verified);
        setPhotoPath(data.photo_path);

        setPhotoUploaded(
          Boolean(data.photo_path)
        );
      }

      setLoadingProof(false);
    }

    loadDeliveryProof();
  }, [orderId, status, supabase]);

  const currentIndex =
    statusFlow.indexOf(status);

  const nextStatus =
    currentIndex >= 0 &&
    currentIndex < statusFlow.length - 1
      ? statusFlow[currentIndex + 1]
      : null;

  function getStatusLabel(
    nextStatusValue: OrderStatus
  ) {
    switch (nextStatusValue) {
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

      default:
        return nextStatusValue;
    }
  }

  function handlePhotoSelection(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      setSelectedPhoto(null);
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    if (!file.type.startsWith("image/")) {
      setErrorMessage(
        "Please select a valid image file."
      );

      event.target.value = "";
      setSelectedPhoto(null);
      return;
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      setErrorMessage(
        "Image size must be 5 MB or less."
      );

      event.target.value = "";
      setSelectedPhoto(null);
      return;
    }

    setSelectedPhoto(file);
  }

  async function uploadDeliveryPhoto() {
    if (!selectedPhoto) {
      setErrorMessage(
        "Please select an image first."
      );
      return;
    }

    setUploadingPhoto(true);
    setErrorMessage("");
    setSuccessMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setErrorMessage(
        "Your session has expired. Please log in again."
      );

      setUploadingPhoto(false);
      return;
    }

    const fileExtension =
      selectedPhoto.name
        .split(".")
        .pop()
        ?.toLowerCase() || "jpg";

    const filePath =
      `${user.id}/${orderId}/delivery-proof-${Date.now()}.${fileExtension}`;

    const { error: uploadError } =
      await supabase.storage
        .from("order-proofs")
        .upload(
          filePath,
          selectedPhoto,
          {
            cacheControl: "3600",
            upsert: false,
            contentType: selectedPhoto.type,
          }
        );

    if (uploadError) {
      setErrorMessage(
        `Could not upload delivery photo: ${uploadError.message}`
      );

      setUploadingPhoto(false);
      return;
    }

    const { error: updateError } =
      await supabase
        .from("order_proofs")
        .update({
          photo_path: filePath,
          updated_at: new Date().toISOString(),
        })
        .eq("order_id", orderId)
        .eq("agent_id", user.id);

    if (updateError) {
      await supabase.storage
        .from("order-proofs")
        .remove([filePath]);

      setErrorMessage(
        `Could not save delivery photo: ${updateError.message}`
      );

      setUploadingPhoto(false);
      return;
    }

    setPhotoPath(filePath);
    setPhotoUploaded(true);
    setSelectedPhoto(null);

    setSuccessMessage(
      "Delivery photo uploaded successfully."
    );

    setUploadingPhoto(false);
  }

  async function verifyOtp() {
    const cleanOtp = enteredOtp.trim();

    if (!cleanOtp) {
      setErrorMessage(
        "Please enter the delivery OTP."
      );

      setSuccessMessage("");
      return;
    }

    if (cleanOtp.length !== 4) {
      setErrorMessage(
        "OTP must contain 4 digits."
      );

      setSuccessMessage("");
      return;
    }

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

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

    const { data: proof, error: proofError } =
      await supabase
        .from("order_proofs")
        .select(
          "id, order_id, agent_id, otp_code, otp_verified"
        )
        .eq("order_id", orderId)
        .eq("agent_id", user.id)
        .single();

    if (proofError || !proof) {
      setErrorMessage(
        "Delivery verification was not found for this order."
      );

      setSaving(false);
      return;
    }

    if (proof.otp_verified) {
      setOtpVerified(true);

      setSuccessMessage(
        "Delivery OTP is already verified."
      );

      setSaving(false);
      return;
    }

    if (cleanOtp !== proof.otp_code) {
      setErrorMessage(
        "Incorrect OTP. Please enter the correct delivery code."
      );

      setSaving(false);
      return;
    }

    const verifiedAt =
      new Date().toISOString();

    const { error: updateError } =
      await supabase
        .from("order_proofs")
        .update({
          otp_verified: true,
          verified_at: verifiedAt,
          updated_at: verifiedAt,
        })
        .eq("id", proof.id)
        .eq("agent_id", user.id);

    if (updateError) {
      setErrorMessage(
        `Could not verify OTP: ${updateError.message}`
      );

      setSaving(false);
      return;
    }

    setOtpVerified(true);

    setSuccessMessage(
      "Delivery OTP verified successfully."
    );

    setSaving(false);
  }

  async function updateStatus(
    nextStatusValue: OrderStatus
  ) {
    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

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

    const { data: order, error: orderError } =
      await supabase
        .from("orders")
        .select("id, agent_id, status")
        .eq("id", orderId)
        .eq("agent_id", user.id)
        .single();

    if (orderError || !order) {
      setErrorMessage(
        "This order is not assigned to your account."
      );

      setSaving(false);
      return;
    }

    if (nextStatusValue === "delivered") {
      if (!otpVerified) {
        setErrorMessage(
          "Please verify the delivery OTP before marking the order as delivered."
        );

        setSaving(false);
        return;
      }
    }

    const { error } = await supabase
      .from("orders")
      .update({
        status: nextStatusValue,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .eq("agent_id", user.id);

    if (error) {
      setErrorMessage(
        `Could not update order status: ${error.message}`
      );

      setSaving(false);
      return;
    }

    setStatus(nextStatusValue);

    setSuccessMessage(
      `Order status changed to ${getStatusLabel(
        nextStatusValue
      )}.`
    );

    setSaving(false);

    router.refresh();
  }

  const isDelivered =
    status === "delivered";

  const isCancelled =
    status === "cancelled";

  const isOnTheWay =
    status === "on_the_way";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          Task Execution
        </p>

        <h2 className="mt-2 text-xl font-bold text-slate-900">
          Manage Order Status
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Update the order as you complete each delivery step.
        </p>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Current Status
        </p>

        <p className="mt-2 text-lg font-bold text-slate-900">
          {getStatusLabel(status)}
        </p>
      </div>

      {isOnTheWay && (
        <div className="mt-6 space-y-5">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <div>
              <p className="text-sm font-bold text-amber-900">
                Delivery Verification
              </p>

              <p className="mt-1 text-sm leading-6 text-amber-800">
                Ask the customer for the 4-digit delivery OTP
                before completing the order.
              </p>
            </div>

            {loadingProof ? (
              <div className="mt-4 rounded-xl bg-white/70 px-4 py-3 text-sm text-slate-600">
                Loading delivery verification...
              </div>
            ) : otpVerified ? (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <p className="text-sm font-semibold text-emerald-700">
                  ✓ Delivery OTP verified
                </p>

                <p className="mt-1 text-xs text-emerald-600">
                  The order can now be marked as delivered.
                </p>
              </div>
            ) : (
              <div className="mt-4">
                <label
                  htmlFor="delivery-otp"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Delivery OTP
                </label>

                <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                  <input
                    id="delivery-otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={enteredOtp}
                    onChange={(event) =>
                      setEnteredOtp(
                        event.target.value.replace(
                          /\D/g,
                          ""
                        )
                      )
                    }
                    placeholder="Enter 4-digit OTP"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-lg font-bold tracking-[0.35em] text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100 sm:max-w-xs"
                  />

                  <button
                    type="button"
                    onClick={verifyOtp}
                    disabled={
                      saving ||
                      loadingProof
                    }
                    className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving
                      ? "Verifying..."
                      : "Verify OTP"}
                  </button>
                </div>
              </div>
            )}

            {process.env.NODE_ENV ===
              "development" &&
              otpCode && (
                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Development Test OTP
                  </p>

                  <p className="mt-1 text-2xl font-bold tracking-[0.25em] text-slate-900">
                    {otpCode}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    This test-only value is visible in development.
                    It will not be exposed this way in production.
                  </p>
                </div>
              )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div>
              <p className="text-sm font-bold text-slate-900">
                Proof of Delivery Photo
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Upload an optional photo as delivery evidence.
                Maximum size: 5 MB.
              </p>
            </div>

            {photoUploaded ? (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4">
                <p className="text-sm font-semibold text-emerald-700">
                  ✓ Delivery photo uploaded
                </p>

                <p className="mt-1 break-all text-xs text-emerald-600">
                  {photoPath}
                </p>
              </div>
            ) : (
              <div className="mt-4">
                <label
                  htmlFor="delivery-proof-photo"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Select Photo
                </label>

                <input
                  id="delivery-proof-photo"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelection}
                  className="mt-2 block w-full cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
                />

                {selectedPhoto && (
                  <div className="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <p className="text-sm font-semibold text-slate-800">
                      {selectedPhoto.name}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {(
                        selectedPhoto.size /
                        1024 /
                        1024
                      ).toFixed(2)}{" "}
                      MB
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={uploadDeliveryPhoto}
                  disabled={
                    !selectedPhoto ||
                    uploadingPhoto ||
                    saving
                  }
                  className="mt-4 w-full rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {uploadingPhoto
                    ? "Uploading Photo..."
                    : "Upload Delivery Photo"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {successMessage}
        </div>
      )}

      {!isDelivered &&
        !isCancelled &&
        nextStatus && (
          <div className="mt-6">
            <button
              type="button"
              onClick={() =>
                updateStatus(nextStatus)
              }
              disabled={
                saving ||
                loadingProof ||
                uploadingPhoto ||
                (nextStatus ===
                  "delivered" &&
                  !otpVerified)
              }
              className="w-full rounded-xl bg-cyan-700 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Updating..."
                : `Mark as ${getStatusLabel(
                    nextStatus
                  )}`}
            </button>

            {nextStatus ===
              "delivered" &&
              !otpVerified && (
                <p className="mt-2 text-center text-xs text-slate-500">
                  Verify the customer OTP before completing the delivery.
                </p>
              )}
          </div>
        )}

      {isDelivered && (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4">
          <p className="text-sm font-bold text-emerald-700">
            Order Delivered
          </p>

          <p className="mt-1 text-sm text-emerald-600">
            This task has been completed successfully.
          </p>
        </div>
      )}

      {isCancelled && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-4">
          <p className="text-sm font-bold text-red-700">
            Order Cancelled
          </p>

          <p className="mt-1 text-sm text-red-600">
            This order can no longer be executed.
          </p>
        </div>
      )}
    </section>
  );
}