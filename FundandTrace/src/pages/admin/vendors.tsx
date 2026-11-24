import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import AdminLayout from "../../layouts/AdminLayout";
import Layout from "../../components/Layout";
import { config } from "../../components/helperFunctions/helperFunctions";
import { getApiBaseUrl } from "../../utils/api";
import { countryName } from "../../types/vendor";

type AdminVendor = {
  id: string;
  legalName: string;
  tradingName?: string;
  category: string;
  country: string;
  city?: string;
  address?: string;
  registrationNumber: string;
  registryUrl?: string;
  taxId?: string;
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
  status: string;
  createdAt: string;
  submittedBy: { name: string; email: string } | null;
  bank: { bankName: string; bankCode?: string; last4: string; currency: string; accountName?: string; resolvedName?: string; method?: string };
  review?: { notes?: string; adminName?: string; decidedAt?: string };
};

const API = () => `${getApiBaseUrl()}/api/admin/vendors`;
const errMsg = (e: unknown) => (e as { response?: { data?: { error?: string } } })?.response?.data?.error || "Request failed";

function Review({ v, onDone }: { v: AdminVendor; onDone: (msg: string) => void }) {
  const [checks, setChecks] = useState({ registryChecked: false, bankNameMatches: false, contactConfirmed: false });
  const [registryUrl, setRegistryUrl] = useState(v.registryUrl || "");
  const [notes, setNotes] = useState("");
  const [manualBank, setManualBank] = useState(false);
  const [resolved, setResolved] = useState<{ resolvedName: string; matchesLegalName: boolean } | null>(v.bank.resolvedName ? { resolvedName: v.bank.resolvedName, matchesLegalName: false } : null);
  const [err, setErr] = useState("");

  const resolveBank = async () => {
    setErr("");
    try {
      const r = await axios.post(`${API()}/${v.id}/resolve-bank`, {}, config());
      setResolved(r.data.data);
    } catch (e) {
      setErr(errMsg(e));
    }
  };
  const decide = async (decision: "verify" | "reject" | "suspend") => {
    setErr("");
    try {
      await axios.post(`${API()}/${v.id}/review`, { decision, checks, notes, registryUrl, bankConfirmedManually: manualBank }, config());
      onDone(`${v.legalName}: ${decision === "verify" ? "verified" : decision === "reject" ? "rejected" : "suspended"}`);
    } catch (e) {
      setErr(errMsg(e));
    }
  };

  const row = (label: string, value?: React.ReactNode) =>
    value ? (
      <>
        <dt className="ft-muted">{label}</dt>
        <dd style={{ margin: 0 }}>{value}</dd>
      </>
    ) : null;

  return (
    <article style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18, marginBottom: 16 }}>
      <h2 style={{ fontSize: 19, marginBottom: 4 }}>{v.legalName}</h2>
      <p className="ft-muted" style={{ marginTop: 0 }}>
        {v.category} · {[v.city, countryName(v.country)].filter(Boolean).join(", ")} · submitted {new Date(v.createdAt).toLocaleDateString("en-GB")}
        {v.submittedBy ? ` by ${v.submittedBy.name || v.submittedBy.email}` : ""}
      </p>
      <dl style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: "4px 12px", fontSize: 14 }}>
        {row("Trading name", v.tradingName)}
        {row("Registration no.", v.registrationNumber)}
        {row("Tax ID", v.taxId)}
        {row("Address", v.address)}
        {row("Website", v.website && <a href={v.website} target="_blank" rel="noopener noreferrer nofollow">{v.website}</a>)}
        {row("Contact", [v.contactEmail, v.contactPhone].filter(Boolean).join(" · "))}
        {row("Bank", `${v.bank.bankName || "?"} (${v.bank.bankCode || "no code"}) ••••${v.bank.last4 || "????"} ${v.bank.currency}`)}
        {row("Name given", v.bank.accountName)}
        {row("Provider says", resolved ? <span style={{ color: resolved.matchesLegalName ? "#166534" : "#b91c1c" }}>{resolved.resolvedName || "(no name returned)"} {resolved.matchesLegalName ? "✓ matches" : "✗ doesn't match the legal name"}</span> : undefined)}
      </dl>
      {v.status === "pending" && (
        <>
          <button type="button" className="ft-btn ft-btn--secondary ft-btn--sm" onClick={resolveBank} style={{ margin: "10px 0" }}>
            Look up account name with provider
          </button>
          <fieldset style={{ display: "grid", gap: 6, margin: "8px 0" }}>
            <legend style={{ fontSize: 15 }}>Checks (all required to verify)</legend>
            <label><input type="checkbox" checked={checks.registryChecked} onChange={() => setChecks({ ...checks, registryChecked: !checks.registryChecked })} /> Found on the public register (CAC, Companies House, Charity Commission…), active, same name and number</label>
            <input className="form-control" placeholder="Link to the register entry you checked" value={registryUrl} onChange={(e) => setRegistryUrl(e.target.value)} />
            <label><input type="checkbox" checked={checks.bankNameMatches} onChange={() => setChecks({ ...checks, bankNameMatches: !checks.bankNameMatches })} /> Bank account is in the vendor&apos;s registered name</label>
            <label><input type="checkbox" checked={manualBank} onChange={() => setManualBank(!manualBank)} /> Bank name confirmed manually (no provider lookup; explain in notes, e.g. bank letter)</label>
            <label><input type="checkbox" checked={checks.contactConfirmed} onChange={() => setChecks({ ...checks, contactConfirmed: !checks.contactConfirmed })} /> Spoke to the vendor using contact details from the register or its website, not the ones submitted</label>
          </fieldset>
        </>
      )}
      <textarea className="form-control" rows={2} placeholder="Notes (required to reject/suspend)" value={notes} onChange={(e) => setNotes(e.target.value)} />
      {err && <p role="alert" style={{ color: "#b91c1c", marginTop: 8 }}>{err}</p>}
      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
        {v.status === "pending" && <button type="button" className="ft-btn ft-btn--primary" onClick={() => decide("verify")}>Verify</button>}
        {v.status === "pending" && <button type="button" className="ft-btn ft-btn--secondary" onClick={() => decide("reject")}>Reject</button>}
        {v.status === "verified" && <button type="button" className="ft-btn ft-btn--secondary" onClick={() => decide("suspend")}>Suspend (blocks payouts)</button>}
      </div>
    </article>
  );
}

export default function AdminVendors() {
  const [status, setStatus] = useState("pending");
  const [list, setList] = useState<AdminVendor[] | null>(null);
  const [msg, setMsg] = useState("");
  const load = useCallback(() => {
    setList(null);
    axios
      .get(`${API()}?status=${status}`, config())
      .then((r) => setList(r.data?.data || []))
      .catch(() => setList([]));
  }, [status]);
  useEffect(load, [load]);

  return (
    <Layout title="Vendors | Fund&Trace Admin" description="Verify vendors for direct payouts">
      <AdminLayout active="Vendors">
        <div style={{ maxWidth: 900, margin: "24px auto", padding: "0 16px" }}>
          <h1 style={{ fontSize: 26 }}>Vendor network</h1>
          <div role="tablist" style={{ display: "flex", gap: 8, margin: "12px 0 18px" }}>
            {["pending", "verified", "rejected", "suspended"].map((s) => (
              <button key={s} type="button" role="tab" aria-selected={status === s} className={`ft-btn ft-btn--sm ${status === s ? "ft-btn--primary" : "ft-btn--secondary"}`} onClick={() => setStatus(s)}>
                {s[0].toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          {msg && <p role="status" style={{ background: "#ecfdf5", padding: "8px 12px", borderRadius: 8 }}>{msg}</p>}
          {list === null ? <p>Loading…</p> : list.length ? list.map((v) => <Review key={v.id} v={v} onDone={(m) => { setMsg(m); load(); }} />) : <p className="ft-muted">Nothing here.</p>}
        </div>
      </AdminLayout>
    </Layout>
  );
}
