import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import AdminLayout from "../../layouts/AdminLayout";
import Layout from "../../components/Layout";
import { config } from "../../components/helperFunctions/helperFunctions";
import { getApiBaseUrl } from "../../utils/api";
import { FLAG_LABEL, SealedRecord, SLOT_LABEL } from "../../utils/evidence";

type Item = SealedRecord & { preciseLocation: { lat: number; lng: number; accuracy: number | null } | null; intact: boolean; missing?: boolean };
type Submission = {
  id: string;
  code: string;
  prompts: string[];
  docType: string;
  docCountry: string;
  submittedAt: string;
  status: string;
  user: { id: string; name: string; email: string; country?: string; city?: string };
  items: Item[];
  review?: { decision?: string; reason?: string; adminName?: string; decidedAt?: string; nameOnId?: string };
};

const CHECKS: { key: string; label: string }[] = [
  { key: "codeSpoken", label: "The code is clearly spoken in the video" },
  { key: "promptsFollowed", label: "The on-screen instructions were followed (it's live, not a replay)" },
  { key: "faceMatchesId", label: "The face matches the ID photo" },
  { key: "documentLooksGenuine", label: "The document looks genuine, unexpired and unedited" },
  { key: "nameMatchesAccount", label: "The name on the ID matches the account (and the payout bank account)" },
];

/** Private files are fetched with the admin token and shown from memory, never cached. */
function PrivateMedia({ item }: { item: Item }) {
  const [url, setUrl] = useState("");
  const [err, setErr] = useState("");
  useEffect(() => {
    let revoke = "";
    if (!item.mediaUrl) {
      setErr("File deleted under the retention policy");
      return undefined;
    }
    axios
      .get(`${getApiBaseUrl()}${item.mediaUrl}`, { ...config(), responseType: "blob" })
      .then((r) => {
        revoke = URL.createObjectURL(r.data);
        setUrl(revoke);
      })
      .catch(() => setErr("Couldn't load the file"));
    return () => {
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [item.mediaUrl]);
  if (err) return <p className="ft-muted">{err}</p>;
  if (!url) return <div className="ft-skeleton" style={{ height: 220, borderRadius: 12 }} />;
  return item.mime.startsWith("video/") ? (
    <video src={url} controls playsInline style={{ width: "100%", borderRadius: 12, background: "#000" }} />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={SLOT_LABEL[item.slot]} style={{ width: "100%", borderRadius: 12 }} />
  );
}

function Review({ s, onDone }: { s: Submission; onDone: (msg: string) => void }) {
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [nameOnId, setNameOnId] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const allIntact = s.items.length > 0 && s.items.every((i) => i.intact && !i.missing);
  const allChecked = CHECKS.every((c) => checks[c.key]);

  const decide = async (decision: "approve" | "reject") => {
    setBusy(true);
    setError("");
    try {
      await axios.post(`${getApiBaseUrl()}/api/evidence/admin/identity/${s.id}/decision`, { decision, checks, nameOnId, reason }, config());
      onDone(`${s.user.name || s.user.email}: ${decision === "approve" ? "approved" : "sent back"}`);
    } catch (e) {
      setError((axios.isAxiosError(e) && e.response?.data?.error) || "Couldn't save the decision");
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="ft-card" style={{ padding: 20, marginBottom: 20 }}>
      <header style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div>
          <h2 style={{ fontSize: 18, margin: 0 }}>{s.user.name || "(no name)"}</h2>
          <p className="ft-muted" style={{ margin: 0, fontSize: 14 }}>
            {s.user.email} · account country {s.user.country || "—"} · {s.docType.replace("_", " ")} from {s.docCountry} · submitted {new Date(s.submittedAt).toLocaleString()}
          </p>
        </div>
        <span className={`ft-chip ${allIntact ? "ft-chip--ok" : "ft-chip--bad"}`}>{allIntact ? "Seals intact" : "Seal problem — don't approve"}</span>
      </header>

      <p style={{ margin: "14px 0 6px" }}>
        Code to hear: <strong style={{ fontFamily: "monospace", fontSize: 20, letterSpacing: "0.15em" }}>{s.code}</strong>
        {"  "}· instructions shown: {s.prompts.join(" → ")}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, margin: "12px 0" }}>
        {s.items.map((i) => (
          <figure key={i.id || i.slot} style={{ margin: 0 }}>
            <figcaption style={{ fontWeight: 700, marginBottom: 6 }}>{SLOT_LABEL[i.slot]}</figcaption>
            <PrivateMedia item={i} />
            <p className="ft-muted" style={{ fontSize: 12, margin: "6px 0 0", wordBreak: "break-all" }}>
              Received {new Date(i.receivedAt).toLocaleString()} · from {i.ipCountry || "?"} ·{" "}
              {i.preciseLocation ? `${i.preciseLocation.lat.toFixed(5)}, ${i.preciseLocation.lng.toFixed(5)} (±${Math.round(i.preciseLocation.accuracy || 0)} m)` : "no location"}
              {i.flags?.length ? ` · ${i.flags.map((f) => FLAG_LABEL[f] || f).join(", ")}` : ""}
              <br />#{i.seq} · {i.sha256}
            </p>
          </figure>
        ))}
      </div>

      <fieldset style={{ border: 0, padding: 0, margin: "8px 0" }}>
        <legend style={{ fontWeight: 700, fontSize: 15 }}>Checks (all required to approve)</legend>
        {CHECKS.map((c) => (
          <label key={c.key} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "4px 0" }}>
            <input type="checkbox" checked={Boolean(checks[c.key])} onChange={(e) => setChecks((p) => ({ ...p, [c.key]: e.target.checked }))} style={{ marginTop: 4 }} />
            {c.label}
          </label>
        ))}
      </fieldset>
      <label style={{ display: "flex", flexDirection: "column", gap: 4, fontWeight: 600, margin: "8px 0" }}>
        Name exactly as on the ID
        <input className="form-control" value={nameOnId} onChange={(e) => setNameOnId(e.target.value)} autoComplete="off" />
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: 4, fontWeight: 600, margin: "8px 0" }}>
        If sending back: what should they fix? (they see this)
        <textarea className="form-control" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. The code isn't audible. Please record again somewhere quieter." />
      </label>
      {error && (
        <p role="alert" style={{ color: "#b42318", fontWeight: 600 }}>
          {error}
        </p>
      )}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button type="button" className="ft-btn ft-btn--primary" disabled={busy || !allChecked || !nameOnId.trim() || !allIntact} onClick={() => decide("approve")}>
          Approve
        </button>
        <button type="button" className="ft-btn ft-btn--secondary" disabled={busy || reason.trim().length < 10} onClick={() => decide("reject")}>
          Send back
        </button>
      </div>
    </article>
  );
}

/** Review queue for in-app identity checks (live ID photo + selfie video). */
export default function AdminIdentity() {
  const [items, setItems] = useState<Submission[] | null>(null);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      const r = await axios.get(`${getApiBaseUrl()}/api/evidence/admin/identity`, config());
      setItems(r.data?.data || []);
    } catch {
      setItems([]);
      setMessage("Couldn't load the queue.");
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  return (
    <Layout title="Identity checks | Fund&Trace Admin" description="Live identity checks awaiting review">
      <AdminLayout active="Identity checks">
        <main style={{ padding: "24px 16px", maxWidth: 1100, margin: "0 auto" }}>
          <h1 style={{ fontSize: 24 }}>Identity checks</h1>
          <p className="ft-muted">
            Live ID photos and selfie videos, oldest first. Files are encrypted at rest and every view is logged. Approve only when every check passes.
          </p>
          {message && (
            <p role="status" className="ft-card" style={{ padding: 12 }}>
              {message}
            </p>
          )}
          {!items && <div className="ft-skeleton" style={{ height: 200, borderRadius: 14 }} />}
          {items && !items.length && (
            <div className="ft-empty">
              <h3>Nothing to review</h3>
              <p>New submissions appear here.</p>
            </div>
          )}
          {items?.map((s) => (
            <Review
              key={s.id}
              s={s}
              onDone={(m) => {
                setMessage(m);
                load();
              }}
            />
          ))}
        </main>
      </AdminLayout>
    </Layout>
  );
}
