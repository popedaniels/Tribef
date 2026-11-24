import { useEffect, useState } from "react";
import axios from "axios";
import { getApiBaseUrl } from "../../utils/api";
import { config, formatMoney } from "../helperFunctions/helperFunctions";
import styles from "./PayoutReviewChecklist.module.scss";

type Status = "pass" | "warn" | "fail";
export type Verdict = "ready" | "review" | "blocked";

interface Review {
  verdict: Verdict;
  checks: { id: string; status: Status; label: string; detail: string }[];
  campaign: { _id: string; title?: string; organizer?: string; currency?: string; raised?: number; available?: number; goal?: number };
  history: { _id: string; status: string; amount: number; createdAt: string; paidAt: string | null; hasReceipt: boolean; purpose: string; current: boolean }[];
}

const ICON: Record<Status, string> = { pass: "✓", warn: "!", fail: "✕" };
const VERDICT: Record<Verdict, { title: string; text: string }> = {
  ready: { title: "Ready to approve", text: "Every check passed." },
  review: { title: "Needs a closer look", text: "Nothing blocks approval, but read the flagged items first." },
  blocked: { title: "Don't approve yet", text: "At least one check failed. Resolve it, or decline with a reason the organiser can act on." },
};

/** Server-computed checklist for a funding request (GET /api/admin/fundingRequest/:id/review). */
export default function PayoutReviewChecklist({ id, onVerdict }: { id?: string; onVerdict?: (v: Verdict) => void }) {
  const [review, setReview] = useState<Review | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    axios
      .get(`${getApiBaseUrl()}/api/admin/fundingRequest/${id}/review`, config())
      .then((r) => {
        setReview(r.data?.data);
        onVerdict?.(r.data?.data?.verdict);
      })
      .catch(() => setError("The review checklist couldn't be loaded. Check the request manually."));
  }, [id, onVerdict]);

  if (error) return <p className={styles.error}>{error}</p>;
  if (!review) return <div className="ft-skeleton" style={{ height: 160, marginBottom: 24 }} aria-label="Loading checklist" />;

  const cur = review.campaign.currency || "USD";
  return (
    <section className={styles.wrap} aria-labelledby="review-title">
      <div className={`${styles.verdict} ${styles[review.verdict]}`}>
        <h2 id="review-title">{VERDICT[review.verdict].title}</h2>
        <p>{VERDICT[review.verdict].text}</p>
      </div>

      <div className={styles.grid}>
        <ul className={styles.checks}>
          {review.checks.map((c) => (
            <li key={c.id} className={styles[c.status]}>
              <span className={styles.icon} aria-label={c.status}>
                {ICON[c.status]}
              </span>
              <div>
                <strong>{c.label}</strong>
                <span>{c.detail}</span>
              </div>
            </li>
          ))}
        </ul>

        <div className={styles.side}>
          <dl className={styles.money}>
            <div>
              <dt>Raised</dt>
              <dd>{formatMoney(review.campaign.raised, cur)}</dd>
            </div>
            <div>
              <dt>In escrow</dt>
              <dd>{formatMoney(review.campaign.available, cur)}</dd>
            </div>
            <div>
              <dt>Goal</dt>
              <dd>{formatMoney(review.campaign.goal, cur)}</dd>
            </div>
          </dl>
          <h3>Payout history</h3>
          <ol className={styles.history}>
            {review.history.map((h) => (
              <li key={h._id} className={h.current ? styles.current : ""}>
                <span>
                  {formatMoney(h.amount, cur)} · {h.current ? "this request" : h.status}
                </span>
                <span className="ft-muted">
                  {h.paidAt ? `paid ${new Date(h.paidAt).toLocaleDateString("en-GB")}` : new Date(h.createdAt).toLocaleDateString("en-GB")}
                  {h.paidAt ? (h.hasReceipt ? " · receipt ✓" : " · no receipt") : ""}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
