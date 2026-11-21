import { useState } from "react";
import ApproveCampaignModal from "../composed/Modal/DefaultModal/ApproveCampaignModal";
import DeclineCampaignModal from "../composed/Modal/DefaultModal/DeclineCampaignModal";
import ReceiptUpload from "../trust/ReceiptUpload";
import { formatMoney } from "../helperFunctions/helperFunctions";
import styles from "./PaymentHistoryCard.module.scss";

const STATUS = {
  Approved: { chip: "ft-chip--ok", icon: "approved", label: "Approved" },
  Pending: { chip: "ft-chip--warn", icon: "pending", label: "Awaiting review" },
};
const statusOf = (s) => STATUS[s] || { chip: "ft-chip--bad", icon: "rejected", label: s || "Declined" };

const PROOF_DUE_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * One funding request in a timeline.
 *  - public tracker: read-only
 *  - `owner` (organiser dashboard): can upload proof of spend after payout
 *  - `admin`: can approve / decline pending requests
 */
export default function PaymentHistoryCard({ fundingRequest, last, admin = false, owner = false, campaignDetail = null, reload = () => {} }) {
  const [open, setOpen] = useState(false);
  const [approveModal, setApproveModal] = useState(false);
  const [declineModal, setDeclineModal] = useState(false);

  const fr = fundingRequest || {};
  const status = statusOf(fr.status);
  const panelId = `fr-${fr._id || fr.createdAt}`;
  const created = fr.createdAt ? new Date(fr.createdAt) : null;
  const paidAt = fr.disbursement?.dateDisbursed ? new Date(fr.disbursement.dateDisbursed) : null;
  const overdue = paidAt && !fr.disbursement?.receipt && Date.now() - paidAt.getTime() > PROOF_DUE_MS;

  return (
    <div className={`${styles.item} ${last ? styles.last : ""}`}>
      <div className={styles.icon} aria-hidden="true">
        <img src={`/images/icons/${status.icon}.svg`} width="20" height="20" alt="" />
      </div>

      <button type="button" className={`ft-plain ${styles.summary}`} aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(!open)}>
        <span>
          <span className={styles.amount}>{formatMoney(fr.amount, fr.currency)}</span>
          <span className={styles.meta}>
            Requested {created ? created.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : ""}
            {paidAt ? ` · paid ${paidAt.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : ""}
          </span>
        </span>
        <span className={styles.right}>
          <span className={`ft-chip ${status.chip}`}>{status.label}</span>
          <svg className={open ? styles.chevronUp : ""} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>

      <div id={panelId} hidden={!open} className={styles.panel}>
        <dl>
          <dt>What it&apos;s for</dt>
          <dd style={{ whiteSpace: "pre-wrap" }}>{fr.purposeOfFunding || "—"}</dd>
          {fr.proofOfFunding && (
            <>
              <dt>Supporting document</dt>
              <dd>
                <a href={fr.proofOfFunding} target="_blank" rel="noopener noreferrer" className={styles.proof}>
                  <img src={fr.proofOfFunding} alt="Supporting document for this request" />
                </a>
              </dd>
            </>
          )}
          {fr.declineReason && (
            <>
              <dt>Why it was declined</dt>
              <dd style={{ whiteSpace: "pre-wrap" }}>{fr.declineReason}</dd>
            </>
          )}
        </dl>

        {owner && !admin && fr.status === "Approved" && paidAt && (
          <div className={styles.upload}>
            <h3>Proof of spend</h3>
            <p>Upload the receipt or invoice for this payout. Donors see it on your public tracker, and it raises your Transparency Score.</p>
            <ReceiptUpload fundingRequestId={fr._id} existingReceipt={fr.disbursement?.receipt} overdue={overdue} />
          </div>
        )}

        {admin && fr.status === "Pending" && (
          <div className="d-flex align-items-center mt-3" style={{ gap: 12 }}>
            <button type="button" className="ft-btn ft-btn--primary ft-btn--sm" onClick={() => setApproveModal(true)}>
              Approve
            </button>
            <button type="button" className="ft-btn ft-btn--secondary ft-btn--sm" onClick={() => setDeclineModal(true)}>
              Decline
            </button>
          </div>
        )}
      </div>

      {admin && (
        <>
          <ApproveCampaignModal showModal={approveModal} fundingRequest={fundingRequest} reload={() => reload()} onModalClose={() => setApproveModal(false)} />
          <DeclineCampaignModal
            showModal={declineModal}
            organizer={campaignDetail?.organizer}
            organizerId={fr.organizerId}
            id={fr._id}
            reload={() => reload()}
            onModalClose={() => setDeclineModal(false)}
          />
        </>
      )}
    </div>
  );
}
