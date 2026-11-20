import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import DashboardLayout from "../../layouts/DashboardLayout";
import { getApiBaseUrl } from "../../utils/api";
import styles from "../../components/trust/trust.module.scss";

type Subscription = {
  _id: string;
  amount: number;
  currency: string;
  interval: string;
  status: string;
  totalDonated?: number;
  createdAt: string;
  canceledAt?: string | null;
  campaignId?: { _id: string; basicInformation?: { campaignTitle?: string } } | null;
};

const money = (n: number, currency: string) => {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: (currency || "GBP").toUpperCase() }).format(n || 0);
  } catch {
    return `${currency} ${n}`;
  }
};

const STATUS: Record<string, string> = {
  active: "Active",
  trialing: "Active",
  canceling: "Ends at the end of this period",
  canceled: "Cancelled",
  incomplete: "Setting up",
  past_due: "Payment failed — update your card",
};

/** Monthly giving: see and cancel recurring donations (gap C-4). */
export default function Subscriptions() {
  const [subs, setSubs] = useState<Subscription[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await axios.get(`${getApiBaseUrl()}/api/recurring/mine`, { withCredentials: true });
      setSubs(r.data?.data || []);
    } catch {
      setError("We couldn't load your monthly giving right now.");
      setSubs([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const cancel = async (id: string) => {
    setBusy(id);
    setError("");
    try {
      await axios.post(`${getApiBaseUrl()}/api/recurring/cancel/${id}`, {}, { withCredentials: true });
      await load();
    } catch (err) {
      setError((axios.isAxiosError(err) && err.response?.data?.error) || "Cancellation failed. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <DashboardLayout active={2} page="Monthly giving">
      <section className="custom-container my-5" style={{ maxWidth: 820 }}>
        <h1 className="text-heading mb-2" style={{ fontSize: 28 }}>
          Monthly giving
        </h1>
        <p className={styles.muted}>
          Recurring donations go into each campaign&rsquo;s escrow like any other gift. Cancelling stops future payments; it
          doesn&rsquo;t refund past ones.
        </p>
        {error && (
          <p className={styles.fieldError} role="alert">
            {error}
          </p>
        )}
        {subs === null ? (
          <div className={styles.scoreSkeleton} aria-label="Loading" />
        ) : subs.length === 0 ? (
          <div className={styles.scoreCard}>
            <p className="mb-2">You don&rsquo;t have any monthly donations.</p>
            <Link href="/Categories" className={styles.linkButton}>
              Find a campaign to support monthly
            </Link>
          </div>
        ) : (
          <ul className="list-unstyled d-grid" style={{ gap: 12 }}>
            {subs.map((s) => {
              const active = ["active", "trialing", "past_due"].includes(s.status);
              return (
                <li key={s._id} className={styles.scoreCard}>
                  <div className="d-flex flex-wrap justify-content-between align-items-start" style={{ gap: 12 }}>
                    <div>
                      <p className="mb-1" style={{ fontWeight: 700 }}>
                        {s.campaignId?._id ? (
                          <Link href={`/campaign/${s.campaignId._id}`}>{s.campaignId.basicInformation?.campaignTitle || "Campaign"}</Link>
                        ) : (
                          "Campaign"
                        )}
                      </p>
                      <p className="mb-1">
                        {money(s.amount, s.currency)} every {s.interval || "month"} · {STATUS[s.status] || s.status}
                      </p>
                      <p className={styles.muted}>
                        Since {new Date(s.createdAt).toLocaleDateString()}
                        {s.totalDonated ? ` · ${money(s.totalDonated, s.currency)} given so far` : ""}
                      </p>
                    </div>
                    {active && (
                      <button
                        type="button"
                        className="btn-secondary-action"
                        onClick={() => cancel(s._id)}
                        disabled={busy === s._id}
                      >
                        {busy === s._id ? "Cancelling…" : "Cancel"}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </DashboardLayout>
  );
}
