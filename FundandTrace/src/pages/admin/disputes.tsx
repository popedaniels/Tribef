import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import AdminLayout from "../../layouts/AdminLayout";
import Layout from "../../components/Layout";
import { config } from "../../components/helperFunctions/helperFunctions";
import { getApiBaseUrl } from "../../utils/api";
import styles from "../../components/trust/trust.module.scss";

type Frozen = {
  _id: string;
  basicInformation?: { campaignTitle?: string };
  funding?: { currency?: string; amountRaised?: number; availableBalance?: number };
  disputeGovernance?: {
    lockedAt?: string;
    lockReason?: string;
    totalDisputeVolumeUSD?: number;
    disputeReports?: { disputeCategory?: string; description?: string; donorName?: string; createdAt?: string }[];
  };
};

const money = (n = 0, c = "GBP") => {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: c }).format(n);
  } catch {
    return `${c} ${n}`;
  }
};

/** Resolve dispute-frozen campaigns: unlock, or refund the remaining escrow pro-rata. */
export default function AdminDisputes() {
  const [items, setItems] = useState<Frozen[] | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await axios.get(`${getApiBaseUrl()}/api/admin/disputes/frozen`, config());
      setItems(r.data?.data || []);
    } catch {
      setItems([]);
      setMessage({ tone: "bad", text: "Couldn't load frozen campaigns." });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resolve = async (id: string, action: "unlock" | "refund") => {
    const note = (notes[id] || "").trim();
    if (note.length < 10) {
      setMessage({ tone: "bad", text: "Write a short note explaining the decision (10+ characters)." });
      return;
    }
    setBusy(`${id}:${action}`);
    setMessage(null);
    try {
      const r = await axios.post(`${getApiBaseUrl()}/api/admin/disputes/${id}/resolve`, { action, note }, config());
      const summary = r.data?.data?.summary;
      setMessage({
        tone: r.status === 207 ? "bad" : "ok",
        text:
          action === "unlock"
            ? "Campaign unlocked. Donations and payouts resume."
            : `Refunded ${summary?.refunded?.length || 0} donations (${Math.round((summary?.ratio || 0) * 100)}% of each).${
                summary?.failed?.length ? ` ${summary.failed.length} failed and can be retried from Refunds.` : ""
              }`,
      });
      await load();
    } catch (err) {
      setMessage({ tone: "bad", text: (axios.isAxiosError(err) && err.response?.data?.error) || "Action failed." });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Layout title="Disputes | Fund&Trace Admin" description="Frozen campaigns awaiting review">
    <AdminLayout active="Disputes">
      <section className="mx-auto my-4" style={{ maxWidth: 980, padding: "0 16px" }}>
        <h1 className="text-heading mb-2" style={{ fontSize: 26 }}>
          Frozen campaigns
        </h1>
        <p className={styles.muted}>
          Campaigns are frozen automatically when 3+ verified donors, or donors representing 15%+ of funds, raise a dispute.
          Investigate, then unlock or refund what&rsquo;s left in escrow to every donor pro-rata. Every decision is recorded in
          the audit log and refunds appear on the public ledger.
        </p>
        {message && (
          <p className={message.tone === "ok" ? styles.verdictOk : styles.verdictBad} role="status">
            {message.text}
          </p>
        )}
        {items === null ? (
          <div className={styles.scoreSkeleton} />
        ) : items.length === 0 ? (
          <div className={styles.scoreCard}>No campaigns are frozen right now.</div>
        ) : (
          items.map((c) => {
            const reports = c.disputeGovernance?.disputeReports || [];
            const currency = c.funding?.currency || "GBP";
            return (
              <article key={c._id} className={styles.scoreCard}>
                <div className="d-flex flex-wrap justify-content-between" style={{ gap: 12 }}>
                  <div>
                    <h2 style={{ fontSize: 18, margin: 0 }}>
                      <Link href={`/admin/campaign/${c._id}`}>{c.basicInformation?.campaignTitle || c._id}</Link>
                    </h2>
                    <p className={styles.muted}>
                      Frozen {c.disputeGovernance?.lockedAt ? new Date(c.disputeGovernance.lockedAt).toLocaleString() : ""} ·{" "}
                      {reports.length} report(s)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="mb-0" style={{ fontWeight: 700 }}>
                      {money(c.funding?.availableBalance, currency)} in escrow
                    </p>
                    <p className={styles.muted}>of {money(c.funding?.amountRaised, currency)} raised</p>
                  </div>
                </div>
                {c.disputeGovernance?.lockReason && <p className="mt-2 mb-2">{c.disputeGovernance.lockReason}</p>}
                {reports.length > 0 && (
                  <details className="mb-3">
                    <summary style={{ cursor: "pointer", fontWeight: 600 }}>Donor reports</summary>
                    <ul className="mt-2">
                      {reports.map((r, i) => (
                        <li key={i} className="mb-2">
                          <strong>{r.disputeCategory}</strong> — {r.description}{" "}
                          <span className={styles.muted}>({r.donorName || "donor"})</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
                <label htmlFor={`note-${c._id}`} className={styles.fieldLabel}>
                  Decision note (shown in the audit log)
                </label>
                <textarea
                  id={`note-${c._id}`}
                  className="form-control mb-3"
                  rows={2}
                  value={notes[c._id] || ""}
                  onChange={(e) => setNotes({ ...notes, [c._id]: e.target.value })}
                />
                <div className="d-flex flex-wrap" style={{ gap: 10 }}>
                  <button type="button" className="btn-secondary-action" disabled={!!busy} onClick={() => resolve(c._id, "unlock")}>
                    {busy === `${c._id}:unlock` ? "Unlocking…" : "Concerns unfounded — unlock"}
                  </button>
                  <button type="button" className="btn-brand-primary" disabled={!!busy} onClick={() => resolve(c._id, "refund")}>
                    {busy === `${c._id}:refund` ? "Refunding…" : "Misuse confirmed — suspend & refund donors"}
                  </button>
                </div>
              </article>
            );
          })
        )}
      </section>
    </AdminLayout>
    </Layout>
  );
}
