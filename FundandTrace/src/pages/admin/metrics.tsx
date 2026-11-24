import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import AdminLayout from "../../layouts/AdminLayout";
import Layout from "../../components/Layout";
import { config, formatMoney } from "../../components/helperFunctions/helperFunctions";
import { getApiBaseUrl } from "../../utils/api";

type RailRow = {
  rail: string;
  currency: string;
  donations: number;
  donated: number;
  avgDonation: number;
  tips: number;
  feesCollected: number;
  processorCost: number;
  revenue: number;
  margin: number;
  marginPerDonation: number;
  takeRate: number;
  tipRate: number;
  coverFeeRate: number;
  matched: number;
  giftAid: number;
};
type Metrics = {
  donations: { donations: number; uniqueDonors: number; byRail: RailRow[]; daily: { date: string; count: number }[] };
  campaigns: { launched: number; goalReached: number; frozenNow: number; withDonations: number };
  refunds: { count: number };
  payouts: { currency: string; count: number; amount: number; toVerifiedVendors: number }[];
  notes: string[];
};

const RANGES = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
  { label: "12 months", days: 365 },
];

function Tile({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 16px" }}>
      <div style={{ fontSize: 13, color: "#64748b" }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: "#0f172a", lineHeight: 1.2 }}>{value}</div>
      {sub && <div style={{ fontSize: 13, color: "#64748b" }}>{sub}</div>}
    </div>
  );
}

/** Daily donations: one series, so no legend; the title names it. Hover shows the value. */
function DailyBars({ data, days }: { data: { date: string; count: number }[]; days: number }) {
  const [hover, setHover] = useState<number | null>(null);
  // Fill missing days with zero so gaps are visible.
  const byDay = Object.fromEntries(data.map((d) => [d.date, d.count]));
  const series = Array.from({ length: days }, (_, i) => {
    const d = new Date(Date.now() - (days - 1 - i) * 864e5).toISOString().slice(0, 10);
    return { date: d, count: byDay[d] || 0 };
  });
  const max = Math.max(1, ...series.map((s) => s.count));
  const W = 720;
  const H = 160;
  const pad = 24;
  const bw = (W - pad) / series.length;
  const barW = Math.max(1, bw - 2); // 2px surface gap between bars
  const h = hover === null ? null : series[hover];
  return (
    <figure style={{ margin: 0, position: "relative" }}>
      <figcaption style={{ fontWeight: 600, marginBottom: 6 }}>Donations per day</figcaption>
      <svg viewBox={`0 0 ${W} ${H + 18}`} width="100%" role="img" aria-label={`Donations per day over the last ${days} days; peak ${max}`} onMouseLeave={() => setHover(null)}>
        <line x1={pad} x2={W} y1={H} y2={H} stroke="#cbd5e1" strokeWidth="1" />
        <text x={pad - 6} y={10} textAnchor="end" fontSize="11" fill="#64748b">{max}</text>
        <text x={pad - 6} y={H} textAnchor="end" fontSize="11" fill="#64748b">0</text>
        {series.map((s, i) => {
          const bh = (s.count / max) * (H - 8);
          const x = pad + i * bw;
          return (
            <g key={s.date} onMouseEnter={() => setHover(i)}>
              {/* hit target taller and wider than the mark */}
              <rect x={x} y={0} width={bw} height={H} fill="transparent" />
              {s.count > 0 && (
                <path
                  d={`M${x},${H} v${-(bh - Math.min(4, bh))} q0,${-Math.min(4, bh)} ${Math.min(4, barW / 2)},${-Math.min(4, bh)} h${barW - 2 * Math.min(4, barW / 2)} q${Math.min(4, barW / 2)},0 ${Math.min(4, barW / 2)},${Math.min(4, bh)} v${bh - Math.min(4, bh)} z`}
                  fill={hover === i ? "#1e3a8a" : "#3047ec"}
                />
              )}
            </g>
          );
        })}
        <text x={pad} y={H + 14} fontSize="11" fill="#64748b">{series[0]?.date}</text>
        <text x={W} y={H + 14} fontSize="11" fill="#64748b" textAnchor="end">{series[series.length - 1]?.date}</text>
      </svg>
      {h && (
        <div style={{ position: "absolute", top: 24, right: 0, background: "#0f172a", color: "#fff", fontSize: 13, padding: "4px 8px", borderRadius: 6 }}>
          {h.date}: {h.count} donation{h.count === 1 ? "" : "s"}
        </div>
      )}
    </figure>
  );
}

export default function AdminMetrics() {
  const [days, setDays] = useState(30);
  const [m, setM] = useState<Metrics | null>(null);
  const [err, setErr] = useState("");
  const load = useCallback(() => {
    setM(null);
    setErr("");
    const to = new Date();
    const from = new Date(to.getTime() - days * 864e5);
    axios
      .get(`${getApiBaseUrl()}/api/admin/metrics`, { ...config(), params: { from: from.toISOString(), to: to.toISOString() } })
      .then((r) => setM(r.data?.data))
      .catch((e) => setErr(e?.response?.data?.error || "Couldn't load metrics"));
  }, [days]);
  useEffect(load, [load]);

  const d = m?.donations;
  return (
    <Layout title="Metrics | Fund&Trace Admin" description="Donations, margin and payouts">
      <AdminLayout active="Metrics">
        <div style={{ maxWidth: 1100, margin: "24px auto", padding: "0 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <h1 style={{ fontSize: 26, margin: 0 }}>Metrics</h1>
            <div role="group" aria-label="Time range" style={{ display: "flex", gap: 6 }}>
              {RANGES.map((r) => (
                <button key={r.days} type="button" aria-pressed={days === r.days} className={`ft-btn ft-btn--sm ${days === r.days ? "ft-btn--primary" : "ft-btn--secondary"}`} onClick={() => setDays(r.days)}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          {err && <p role="alert" style={{ color: "#b91c1c" }}>{err}</p>}
          {!m && !err && <p>Loading…</p>}
          {m && d && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, margin: "18px 0" }}>
                <Tile label="Donations" value={d.donations.toLocaleString("en-GB")} sub={`${d.uniqueDonors.toLocaleString("en-GB")} unique donors`} />
                <Tile label="Campaigns receiving" value={m.campaigns.withDonations} sub={`${m.campaigns.launched} launched in range`} />
                <Tile label="Reached goal" value={m.campaigns.goalReached} />
                <Tile label="Refunds" value={m.refunds.count} />
                <Tile label="Frozen now" value={m.campaigns.frozenNow} sub="under dispute review" />
              </div>
              <section style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, marginBottom: 18 }}>
                <DailyBars data={d.daily} days={days} />
              </section>

              <h2 style={{ fontSize: 20 }}>Revenue and margin by payment rail</h2>
              <p className="ft-muted" style={{ fontSize: 14 }}>
                Margin = tips + card fees donors paid − estimated processor cost. Amounts are per currency and never added across currencies.
              </p>
              <div style={{ overflowX: "auto", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12 }}>
                <table className="table mb-0" style={{ fontSize: 14, fontVariantNumeric: "tabular-nums" }}>
                  <thead>
                    <tr>
                      {["Rail", "Donations", "Donated", "Avg", "Tips", "Fees paid by donors", "Est. processor cost", "Margin", "Margin / donation", "Take rate", "Tip %", "Covered fee %"].map((h) => (
                        <th key={h} scope="col" style={{ whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {d.byRail.length ? (
                      d.byRail.map((r) => (
                        <tr key={r.rail + r.currency}>
                          <th scope="row" style={{ whiteSpace: "nowrap" }}>{r.rail} · {r.currency}</th>
                          <td>{r.donations}</td>
                          <td>{formatMoney(r.donated, r.currency)}</td>
                          <td>{formatMoney(r.avgDonation, r.currency)}</td>
                          <td>{formatMoney(r.tips, r.currency)}</td>
                          <td>{formatMoney(r.feesCollected, r.currency)}</td>
                          <td>{formatMoney(r.processorCost, r.currency)}</td>
                          <td style={{ fontWeight: 600 }}>{r.margin < 0 ? "▼ " : ""}{formatMoney(r.margin, r.currency, { exact: true })}</td>
                          <td>{formatMoney(r.marginPerDonation, r.currency, { exact: true })}</td>
                          <td>{r.takeRate}%</td>
                          <td>{r.tipRate}%</td>
                          <td>{r.coverFeeRate}%</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={12} className="ft-muted">No donations in this range.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <h2 style={{ fontSize: 20, marginTop: 24 }}>Payouts</h2>
              {m.payouts.length ? (
                <ul>
                  {m.payouts.map((p) => (
                    <li key={p.currency}>
                      {formatMoney(p.amount, p.currency)} in {p.count} payout{p.count === 1 ? "" : "s"} ({p.toVerifiedVendors} to verified vendors)
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="ft-muted">No payouts in this range.</p>
              )}
              <ul className="ft-muted" style={{ fontSize: 13 }}>
                {m.notes.map((n) => <li key={n}>{n}</li>)}
              </ul>
            </>
          )}
        </div>
      </AdminLayout>
    </Layout>
  );
}
