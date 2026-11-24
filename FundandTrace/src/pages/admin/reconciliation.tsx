import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import AdminLayout from "../../layouts/AdminLayout";
import Layout from "../../components/Layout";
import { config, formatMoney } from "../../components/helperFunctions/helperFunctions";
import { getApiBaseUrl } from "../../utils/api";

type Item = Record<string, unknown>;
type Gateway = {
  gatewayCount: number;
  dbCount: number;
  discrepancies: number;
  missingInDb: Item[];
  creditedWithoutPayment: Item[];
  amountMismatches: Item[];
  currencyMismatches: Item[];
  totals: Record<string, { gatewayCharged: number; recordedCharged: number; donated: number; tips: number; fees: number; count: number }>;
};
type Report = {
  _id: string;
  ranAt: string;
  windowDays: number;
  discrepancies: number;
  gateways: Record<string, Gateway>;
  errors: { gateway: string; error: string }[];
  resolution?: { note: string; adminName: string; at: string | null };
};

const API = () => `${getApiBaseUrl()}/api/admin/reconciliation`;
const when = (d: string) => new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const LABELS: Record<string, string> = {
  missingInDb: "Charged at the gateway but not recorded (lost webhook: the donor paid, the campaign wasn't credited)",
  creditedWithoutPayment: "Credited, but the gateway has no successful payment (investigate before any payout)",
  amountMismatches: "Charged total ≠ donation + tip + card fee",
  currencyMismatches: "Charged in a different currency from the campaign",
};

function Detail({ g }: { g: Gateway }) {
  return (
    <>
      <table className="table table-sm" style={{ fontSize: 14, fontVariantNumeric: "tabular-nums" }}>
        <thead>
          <tr>
            <th scope="col">Currency</th>
            <th scope="col">Payments</th>
            <th scope="col">Gateway charged</th>
            <th scope="col">We recorded</th>
            <th scope="col">Donations</th>
            <th scope="col">Tips</th>
            <th scope="col">Card fees</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(g.totals || {}).map(([c, t]) => (
            <tr key={c}>
              <th scope="row">{c}</th>
              <td>{t.count}</td>
              <td>{formatMoney(t.gatewayCharged, c, { exact: true })}</td>
              <td style={{ color: Math.abs(t.gatewayCharged - t.recordedCharged) > 0.01 ? "#b91c1c" : undefined }}>{formatMoney(t.recordedCharged, c, { exact: true })}</td>
              <td>{formatMoney(t.donated, c, { exact: true })}</td>
              <td>{formatMoney(t.tips, c, { exact: true })}</td>
              <td>{formatMoney(t.fees, c, { exact: true })}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {(["missingInDb", "creditedWithoutPayment", "amountMismatches", "currencyMismatches"] as const).map((k) =>
        g[k]?.length ? (
          <details key={k} open style={{ marginBottom: 8 }}>
            <summary style={{ fontWeight: 600, color: "#b91c1c" }}>
              {g[k].length} · {LABELS[k]}
            </summary>
            <pre style={{ fontSize: 12, background: "#f8fafc", padding: 10, borderRadius: 8, maxHeight: 260, overflow: "auto" }}>{JSON.stringify(g[k].slice(0, 50), null, 2)}</pre>
          </details>
        ) : null
      )}
    </>
  );
}

export default function AdminReconciliation() {
  const [reports, setReports] = useState<Report[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  const load = useCallback(() => {
    axios
      .get(API(), config())
      .then((r) => {
        setReports(r.data?.data || []);
        setOpen((o) => o || r.data?.data?.[0]?._id || null);
      })
      .catch(() => setReports([]));
  }, []);
  useEffect(load, [load]);

  const run = async () => {
    setBusy(true);
    setMsg("");
    try {
      const r = await axios.post(`${API()}/run`, { days: 2 }, config());
      setMsg(r.data?.data?.discrepancies ? `Found ${r.data.data.discrepancies} discrepancies.` : "No discrepancies.");
      setOpen(null);
      load();
    } catch (e) {
      setMsg((e as { response?: { data?: { error?: string } } })?.response?.data?.error || "Run failed");
    } finally {
      setBusy(false);
    }
  };
  const resolve = async (id: string) => {
    try {
      await axios.post(`${API()}/${id}/resolve`, { note }, config());
      setNote("");
      load();
    } catch (e) {
      setMsg((e as { response?: { data?: { error?: string } } })?.response?.data?.error || "Couldn't save");
    }
  };

  return (
    <Layout title="Reconciliation | Fund&Trace Admin" description="Gateway reconciliation">
      <AdminLayout active="Reconciliation">
        <div style={{ maxWidth: 1000, margin: "24px auto", padding: "0 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <h1 style={{ fontSize: 26, margin: 0 }}>Gateway reconciliation</h1>
            <button type="button" className="ft-btn ft-btn--primary" onClick={run} disabled={busy}>
              {busy ? "Running…" : "Run now (last 2 days)"}
            </button>
          </div>
          <p className="ft-muted" style={{ fontSize: 14 }}>
            Every day each gateway&apos;s successful payments are matched to our donations in both directions. Payments in the last 30 minutes are skipped (webhooks may still be
            arriving).
          </p>
          {msg && <p role="status">{msg}</p>}
          {reports === null ? (
            <p>Loading…</p>
          ) : !reports.length ? (
            <p className="ft-muted">No runs yet.</p>
          ) : (
            reports.map((r) => (
              <section key={r._id} style={{ background: "#fff", border: `1px solid ${r.discrepancies || r.errors?.length ? "#fca5a5" : "#e2e8f0"}`, borderRadius: 12, padding: 14, marginBottom: 10 }}>
                <button type="button" onClick={() => setOpen(open === r._id ? null : r._id)} aria-expanded={open === r._id} style={{ all: "unset", cursor: "pointer", display: "flex", justifyContent: "space-between", width: "100%", gap: 10 }}>
                  <strong>{when(r.ranAt)}</strong>
                  <span>
                    {Object.keys(r.gateways).join(", ") || "no gateways"} ·{" "}
                    {r.discrepancies ? <span style={{ color: "#b91c1c", fontWeight: 700 }}>⚠ {r.discrepancies} discrepancies</span> : <span style={{ color: "#166534" }}>✓ clean</span>}
                    {r.errors?.length ? <span style={{ color: "#b45309" }}> · {r.errors.length} gateway error(s)</span> : null}
                    {r.resolution?.at ? <span className="ft-muted"> · resolved by {r.resolution.adminName}</span> : null}
                  </span>
                </button>
                {open === r._id && (
                  <div style={{ marginTop: 12 }}>
                    {r.errors?.map((e) => (
                      <p key={e.gateway} style={{ color: "#b45309" }}>
                        {e.gateway}: couldn&apos;t fetch transactions ({e.error}). This run says nothing about {e.gateway}.
                      </p>
                    ))}
                    {Object.entries(r.gateways).map(([name, g]) => (
                      <div key={name} style={{ marginBottom: 14 }}>
                        <h2 style={{ fontSize: 17, textTransform: "capitalize" }}>
                          {name} <span className="ft-muted" style={{ fontWeight: 400 }}>· {g.gatewayCount} at gateway, {g.dbCount} recorded</span>
                        </h2>
                        <Detail g={g} />
                      </div>
                    ))}
                    {r.resolution?.at ? (
                      <p style={{ background: "#f0fdf4", padding: 10, borderRadius: 8 }}>
                        <strong>{r.resolution.adminName}</strong> ({when(r.resolution.at)}): {r.resolution.note}
                      </p>
                    ) : r.discrepancies ? (
                      <div style={{ display: "grid", gap: 8 }}>
                        <textarea className="form-control" rows={2} placeholder="What you found and did (e.g. replayed webhook for ref-9; refunded duplicate)" value={note} onChange={(e) => setNote(e.target.value)} />
                        <button type="button" className="ft-btn ft-btn--secondary" onClick={() => resolve(r._id)} disabled={note.trim().length < 10}>
                          Mark as investigated
                        </button>
                      </div>
                    ) : null}
                  </div>
                )}
              </section>
            ))
          )}
        </div>
      </AdminLayout>
    </Layout>
  );
}
