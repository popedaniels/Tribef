import React, { useState } from "react";
import axios from "axios";
import { getApiBaseUrl } from "../../utils/api";
import styles from "./trust.module.scss";

export type RefundPolicy = { enabled: boolean; windowDays: number };

type Props = {
  donationId?: string;
  amount: number;
  currency?: string;
  createdAt: string | Date;
  refundStatus?: string;
  policy: RefundPolicy | null;
  onRefunded?: () => void;
};

/** Donor self-service refund with an inline two-step confirmation. */
export default function RefundAction({ donationId, amount, currency, createdAt, refundStatus, policy, onRefunded }: Props) {
  const [step, setStep] = useState<"idle" | "confirm" | "working" | "done">("idle");
  const [error, setError] = useState("");

  if (!policy?.enabled || !donationId) return null;
  if (refundStatus && refundStatus !== "failed") {
    return <p className={styles.receiptDone}>{refundStatus === "succeeded" ? "✓ Refunded" : "Refund processing"}</p>;
  }
  const deadline = new Date(new Date(createdAt).getTime() + policy.windowDays * 24 * 60 * 60 * 1000);
  if (Date.now() > deadline.getTime()) return null;

  const label = `${currency ? `${currency} ` : ""}${Number(amount).toLocaleString()}`;

  const confirm = async () => {
    setStep("working");
    setError("");
    try {
      await axios.post(`${getApiBaseUrl()}/api/donations/${donationId}/refund`, {}, { withCredentials: true });
      setStep("done");
      onRefunded?.();
    } catch (err) {
      setStep("confirm");
      setError((axios.isAxiosError(err) && err.response?.data?.error) || "The refund couldn't be processed. Please try again later.");
    }
  };

  if (step === "done") return <p className={styles.receiptDone}>✓ Refund requested. It can take 5–10 days to reach your account.</p>;

  return (
    <div className={styles.refundRow}>
      {step === "idle" ? (
        <button type="button" className={styles.linkButton} onClick={() => setStep("confirm")}>
          Changed your mind? Refund this donation (until {deadline.toLocaleDateString()})
        </button>
      ) : (
        <div className={styles.refundConfirm} role="group" aria-label="Confirm refund">
          <span>Refund {label} to your original payment method?</span>
          <button type="button" className="btn-brand-primary" onClick={confirm} disabled={step === "working"}>
            {step === "working" ? "Refunding…" : "Yes, refund"}
          </button>
          <button type="button" className={styles.linkButton} onClick={() => setStep("idle")} disabled={step === "working"}>
            Cancel
          </button>
        </div>
      )}
      {error && (
        <p className={styles.fieldError} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
