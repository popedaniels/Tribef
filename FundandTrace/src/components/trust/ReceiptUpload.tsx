import React, { useState } from "react";
import axios from "axios";
import { getApiBaseUrl } from "../../utils/api";
import { useCloudinaryUpload } from "../../hooks/useCloudinaryUpload";
import styles from "./trust.module.scss";
import Link from "next/link";
import { apiUrl } from "../../utils/evidence";

type Props = {
  fundingRequestId: string;
  /** When given, offers live capture (sealed, shown to donors as "captured live"). */
  campaignId?: string;
  existingReceipt?: string;
  overdue?: boolean;
  onUploaded?: (url: string) => void;
};

/** Organiser adds proof of spend (receipt/invoice) after a payout. */
export default function ReceiptUpload({ fundingRequestId, campaignId, existingReceipt, overdue, onUploaded }: Props) {
  const { upload, loading } = useCloudinaryUpload("campaignImage", process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME);
  const [receipt, setReceipt] = useState(existingReceipt || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const inputId = `receipt-${fundingRequestId}`;

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    if (file.size > 10 * 1024 * 1024) {
      setError("Files must be 10 MB or smaller.");
      return;
    }
    const url = await upload(file);
    if (!url) {
      setError("Upload failed. Please try again.");
      return;
    }
    setSaving(true);
    try {
      await axios.post(
        `${getApiBaseUrl()}/api/fundingRequests/${fundingRequestId}/receipt`,
        { receiptUrl: url },
        { withCredentials: true }
      );
      setReceipt(url);
      onUploaded?.(url);
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.error : "";
      setError(message || "Couldn't save the receipt. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (receipt) {
    return (
      <p className={styles.receiptDone}>
        ✓ Proof uploaded ·{" "}
        <a href={apiUrl(receipt)} target="_blank" rel="noopener noreferrer">
          view
        </a>
      </p>
    );
  }

  return (
    <div className={styles.receipt}>
      {overdue && <span className={styles.badgeWarn}>Proof overdue</span>}
      {campaignId && (
        <Link href={`/dashboard/${campaignId}/evidence?purpose=receipt&fr=${fundingRequestId}`} className="ft-btn ft-btn--primary ft-btn--sm">
          Capture receipt live (recommended)
        </Link>
      )}
      <label htmlFor={inputId} className={styles.receiptButton}>
        {loading || saving ? "Uploading…" : campaignId ? "Or upload a PDF/file" : "Upload receipt or invoice"}
      </label>
      <input
        id={inputId}
        type="file"
        accept="image/*,application/pdf"
        className="sr-only"
        onChange={onFile}
        disabled={loading || saving}
      />
      {error && (
        <p className={styles.fieldError} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
