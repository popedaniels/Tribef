import React, { useState } from "react";
import axios from "axios";
import AdminLayout from "../../layouts/AdminLayout";
import Layout from "../../components/Layout";
import { config } from "../../components/helperFunctions/helperFunctions";
import { getApiBaseUrl } from "../../utils/api";

const API = () => `${getApiBaseUrl()}/api/admin`;
const errMsg = (e: unknown) => (e as { response?: { data?: { error?: string } } })?.response?.data?.error || "Request failed";

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, fontWeight: 600, fontSize: 14 }}>
      {label}
      {children}
      {hint && <span className="ft-muted" style={{ fontWeight: 400, fontSize: 13 }}>{hint}</span>}
    </label>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20, marginBottom: 20 }}>
      <h2 style={{ fontSize: 20 }}>{title}</h2>
      {children}
    </section>
  );
}

const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, alignItems: "end", margin: "12px 0" };

export default function AdminGiving() {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const say = (ok: boolean, text: string) => setMsg({ ok, text });

  // Matching
  const [mCampaign, setMCampaign] = useState("");
  const [sponsor, setSponsor] = useState("");
  const [cap, setCap] = useState("");
  const [ratio, setRatio] = useState("1");
  const [endsAt, setEndsAt] = useState("");
  const [active, setActive] = useState(true);
  const [payAmount, setPayAmount] = useState("");
  const [payRef, setPayRef] = useState("");

  // Gift Aid
  const [charityId, setCharityId] = useState("");
  const [hmrcRef, setHmrcRef] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [markClaimed, setMarkClaimed] = useState(false);

  const saveMatching = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.put(`${API()}/campaigns/${mCampaign.trim()}/matching`, { sponsorName: sponsor, cap: Number(cap), ratio: Number(ratio), endsAt: endsAt || null, active }, config());
      say(true, `Matching saved for campaign ${mCampaign.trim()}.`);
    } catch (err) {
      say(false, errMsg(err));
    }
  };
  const recordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.confirm(`Credit ${payAmount} to the campaign's escrow as a matching payment (ref ${payRef})? This is recorded on the public ledger.`)) return;
    try {
      await axios.post(`${API()}/campaigns/${mCampaign.trim()}/matching/payments`, { amount: Number(payAmount), reference: payRef }, config());
      say(true, "Sponsor payment credited and recorded on the ledger.");
      setPayAmount("");
      setPayRef("");
    } catch (err) {
      say(false, errMsg(err));
    }
  };
  const setGiftAid = async (enabled: boolean) => {
    try {
      await axios.put(`${API()}/charities/${charityId.trim()}/gift-aid`, { hmrcReference: hmrcRef, giftAidEnabled: enabled }, config());
      say(true, enabled ? "Gift Aid enabled for this charity's GBP campaigns." : "Gift Aid turned off for this charity.");
    } catch (err) {
      say(false, errMsg(err));
    }
  };
  const exportCsv = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const q = new URLSearchParams({ charityId: charityId.trim(), ...(from ? { from } : {}), ...(to ? { to } : {}), ...(markClaimed ? { markClaimed: "true" } : {}) });
      const res = await axios.get(`${API()}/gift-aid/export?${q}`, { ...config(), responseType: "blob" });
      const rows = Number(res.headers["x-rows"] || 0);
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = /filename="([^"]+)"/.exec(String(res.headers["content-disposition"] || ""))?.[1] || "gift-aid.csv";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      say(true, `${rows} donation${rows === 1 ? "" : "s"} exported${res.headers["x-more"] === "true" ? ". HMRC schedules hold 1,000 lines, so export again for the rest" : ""}.`);
    } catch (err) {
      say(false, errMsg(err));
    }
  };

  return (
    <Layout title="Giving | Fund&Trace Admin" description="Matched giving and Gift Aid">
      <AdminLayout active="Giving">
        <div style={{ maxWidth: 900, margin: "24px auto", padding: "0 16px" }}>
          <h1 style={{ fontSize: 26 }}>Matched giving and Gift Aid</h1>
          {msg && (
            <p role="status" style={{ padding: "10px 12px", borderRadius: 8, background: msg.ok ? "#ecfdf5" : "#fef2f2", color: msg.ok ? "#065f46" : "#991b1b" }}>
              {msg.text}
            </p>
          )}

          <Card title="Matching sponsor">
            <p className="ft-muted">
              Confirm who the sponsor is and that they&apos;ve agreed in writing before turning this on: donors see &quot;{sponsor || "Sponsor"} is matching donations&quot;. Pledges
              aren&apos;t added to the campaign&apos;s balance until you record the sponsor&apos;s payment below.
            </p>
            <form onSubmit={saveMatching}>
              <div style={grid}>
                <Field label="Campaign ID">
                  <input className="form-control" value={mCampaign} onChange={(e) => setMCampaign(e.target.value)} required pattern="[a-fA-F0-9]{24}" />
                </Field>
                <Field label="Sponsor name">
                  <input className="form-control" value={sponsor} onChange={(e) => setSponsor(e.target.value)} required maxLength={80} />
                </Field>
                <Field label="Cap (campaign currency)">
                  <input className="form-control" type="number" min="1" step="0.01" value={cap} onChange={(e) => setCap(e.target.value)} required />
                </Field>
                <Field label="Ratio" hint="1 = £1 matched per £1 given">
                  <input className="form-control" type="number" min="0.1" max="5" step="0.1" value={ratio} onChange={(e) => setRatio(e.target.value)} />
                </Field>
                <Field label="Ends (optional)">
                  <input className="form-control" type="date" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
                </Field>
                <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input type="checkbox" checked={active} onChange={() => setActive(!active)} /> Active
                </label>
              </div>
              <button type="submit" className="ft-btn ft-btn--primary">Save matching</button>
            </form>
            <hr />
            <form onSubmit={recordPayment}>
              <h3 style={{ fontSize: 16 }}>Record a sponsor payment</h3>
              <div style={grid}>
                <Field label="Amount received">
                  <input className="form-control" type="number" min="0.01" step="0.01" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} required />
                </Field>
                <Field label="Bank/processor reference" hint="Must be unique; shown on the ledger">
                  <input className="form-control" value={payRef} onChange={(e) => setPayRef(e.target.value)} required maxLength={80} />
                </Field>
              </div>
              <button type="submit" className="ft-btn ft-btn--secondary" disabled={!mCampaign}>Credit to escrow</button>
            </form>
          </Card>

          <Card title="Gift Aid (UK charities)">
            <p className="ft-muted">
              Check the charity&apos;s HMRC reference before enabling. Once enabled, donors to its GBP campaigns can make a Gift Aid declaration at checkout. Only the donation is
              exported: never tips or card fees. Declarations must be kept for 6 years after the last donation they cover.
            </p>
            <div style={grid}>
              <Field label="Charity ID">
                <input className="form-control" value={charityId} onChange={(e) => setCharityId(e.target.value)} />
              </Field>
              <Field label="HMRC charities reference" hint="e.g. XR12345">
                <input className="form-control" value={hmrcRef} onChange={(e) => setHmrcRef(e.target.value.toUpperCase())} />
              </Field>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" className="ft-btn ft-btn--primary" disabled={!charityId} onClick={() => setGiftAid(true)}>Enable</button>
                <button type="button" className="ft-btn ft-btn--secondary" disabled={!charityId} onClick={() => setGiftAid(false)}>Disable</button>
              </div>
            </div>
            <form onSubmit={exportCsv}>
              <h3 style={{ fontSize: 16 }}>Export a claim (HMRC schedule columns)</h3>
              <div style={grid}>
                <Field label="From">
                  <input className="form-control" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                </Field>
                <Field label="To">
                  <input className="form-control" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
                </Field>
                <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input type="checkbox" checked={markClaimed} onChange={() => setMarkClaimed(!markClaimed)} /> Mark as claimed
                </label>
              </div>
              <button type="submit" className="ft-btn ft-btn--primary" disabled={!charityId}>Download CSV</button>
              <p className="ft-muted" style={{ fontSize: 13, marginTop: 8 }}>
                Paste the rows into HMRC&apos;s Gift Aid schedule spreadsheet (ODS/Excel) and upload it through Charities Online. Tick &quot;Mark as claimed&quot; only for the export you
                actually submit, so the next export doesn&apos;t repeat these donations.
              </p>
            </form>
          </Card>
        </div>
      </AdminLayout>
    </Layout>
  );
}
