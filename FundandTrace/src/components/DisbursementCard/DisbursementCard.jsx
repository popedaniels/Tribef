import { useState } from "react";
import styles from "./DisbursementCard.module.scss";

const PROOF_DUE_DAYS = 14;
const DAY = 24 * 60 * 60 * 1000;

const money = (amount, currency) => {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: currency || "GBP" }).format(Number(amount || 0));
  } catch {
    return `${currency || ""} ${Number(amount || 0).toFixed(2)}`;
  }
};

const isThirdParty = (type) => String(type || "").toLowerCase().replace(/[\s_-]+/g, "") === "thirdparty";
const isPdf = (url) => /\.pdf($|\?)/i.test(String(url || ""));

const statusOf = (d) => {
  if (d?.providerStatus === "failed") return { label: "Returned to escrow", tone: "bad" };
  if (d?.providerStatus === "pending") return { label: "Processing at the bank", tone: "pending" };
  return { label: "Paid", tone: "ok" };
};

/**
 * One public payout on the tracker. Shows what donors need to judge it:
 * amount, date, status, who was paid, purpose and proof — never bank details.
 */
export default function DisbursementCard({ disbursement, fundingRequest, last }) {
  const [open, setOpen] = useState(false);
  const d = disbursement || fundingRequest?.disbursement || {};
  const paidAt = d.dateDisbursed ? new Date(d.dateDisbursed) : null;
  const dueAt = paidAt ? new Date(paidAt.getTime() + PROOF_DUE_DAYS * DAY) : null;
  const overdue = !d.receipt && dueAt && Date.now() > dueAt.getTime();
  const status = statusOf(d);
  const panelId = `payout-${fundingRequest?._id || d.providerReference || paidAt?.getTime()}`;

  return (
    <div className={`${styles.item} ${last ? styles.last : ""}`}>
      <div className={styles.icon} aria-hidden="true">
        <img src="/images/icons/approved.svg" width="20" height="20" alt="" />
      </div>

      <button type="button" className={`ft-plain ${styles.summary}`} aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(!open)}>
        <span>
          <span className={styles.amount}>{money(d.amount, d.currency)}</span>
          <span className={styles.meta}>
            {paidAt ? paidAt.toLocaleDateString() : "—"} ·{" "}
            {isThirdParty(fundingRequest?.fundingType) ? "Paid directly to supplier" : "Paid to organiser"}
          </span>
        </span>
        <span className={styles.chips}>
          <span className={`${styles.chip} ${styles[status.tone]}`}>{status.label}</span>
          {d.receipt ? (
            <span className={`${styles.chip} ${styles.ok}`}>Proof added</span>
          ) : overdue ? (
            <span className={`${styles.chip} ${styles.bad}`}>Proof overdue</span>
          ) : (
            <span className={`${styles.chip} ${styles.pending}`}>Proof due {dueAt ? dueAt.toLocaleDateString() : ""}</span>
          )}
          <img src={open ? "/images/icons/blueup.svg" : "/images/icons/dropdown.svg"} alt="" width={15} height={16} />
        </span>
      </button>

      <div id={panelId} className={open ? styles.showdropdown : styles.hidedropdown}>
        {fundingRequest?.purposeOfFunding ? (
          <p className={styles.purpose}>{fundingRequest.purposeOfFunding}</p>
        ) : null}
        {d.receipt ? (
          isPdf(d.receipt) ? (
            <a href={d.receipt} target="_blank" rel="noopener noreferrer" className={styles.proofLink}>
              Open receipt (PDF)
            </a>
          ) : (
            <a href={d.receipt} target="_blank" rel="noopener noreferrer" className={styles.proofImage}>
              <img src={d.receipt} alt="Receipt or invoice for this payout" loading="lazy" />
            </a>
          )
        ) : (
          <p className={styles.noProof}>
            The organiser hasn&rsquo;t uploaded proof of spend for this payout yet.
            {overdue ? " It is overdue, which lowers the campaign's Transparency Score." : ""}
          </p>
        )}
      </div>
    </div>
  );
}
