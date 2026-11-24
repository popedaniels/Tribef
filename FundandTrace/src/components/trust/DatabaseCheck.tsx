import { useState } from "react";
import { getApiBaseUrl } from "../../utils/api";

type IdType = { id: string; label: string };
const COUNTRY_NAMES: Record<string, string> = { NG: "Nigeria", GH: "Ghana", KE: "Kenya" };
const PLACEHOLDER: Record<string, string> = { NIN_V2: "11 digits", BVN: "11 digits", GHANA_CARD: "GHA-000000000-0", NATIONAL_ID: "e.g. 12345678" };

/**
 * Optional step: check the organiser's ID number against the government
 * database (Smile ID). Speeds up review; a person still approves.
 */
export default function DatabaseCheck({ types }: { types: Record<string, IdType[]> }) {
  const countries = Object.keys(types);
  const [country, setCountry] = useState(countries[0] || "");
  const [idType, setIdType] = useState(types[countries[0]]?.[0]?.id || "");
  const [idNumber, setIdNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    try {
      const r = await fetch(`${getApiBaseUrl()}/api/identity/database-check`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country, idType, idNumber }),
      });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) setResult({ ok: false, text: body.error || "The check couldn't be completed." });
      else setResult({ ok: body.data?.outcome === "verified", text: `${body.data?.message || ""}${body.data?.outcome !== "verified" && body.data?.attemptsLeft !== undefined ? ` (${body.data.attemptsLeft} attempt${body.data.attemptsLeft === 1 ? "" : "s"} left)` : ""}` });
      if (r.ok) setIdNumber("");
    } catch {
      setResult({ ok: false, text: "Network error. Please try again." });
    } finally {
      setBusy(false);
    }
  };

  if (!countries.length) return null;
  return (
    <form className="ft-card" style={{ padding: 20, marginTop: 20, display: "grid", gap: 12 }} onSubmit={submit}>
      <div>
        <h2 style={{ fontSize: 18, margin: 0 }}>Speed up your review (optional)</h2>
        <p className="ft-muted" style={{ margin: "4px 0 0", fontSize: 14 }}>
          Check your ID number against the government database. We don&apos;t store the number, only the last 4 digits and whether your name matched.
        </p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontWeight: 600, fontSize: 14 }}>
          Country
          <select className="form-control" value={country} onChange={(e) => { setCountry(e.target.value); setIdType(types[e.target.value]?.[0]?.id || ""); }}>
            {countries.map((c) => <option key={c} value={c}>{COUNTRY_NAMES[c] || c}</option>)}
          </select>
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontWeight: 600, fontSize: 14 }}>
          ID type
          <select className="form-control" value={idType} onChange={(e) => setIdType(e.target.value)}>
            {(types[country] || []).map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </label>
      </div>
      <label style={{ display: "flex", flexDirection: "column", gap: 4, fontWeight: 600, fontSize: 14 }}>
        ID number
        <input className="form-control" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} placeholder={PLACEHOLDER[idType] || ""} autoComplete="off" inputMode={idType === "GHANA_CARD" ? "text" : "numeric"} required />
      </label>
      {result && <p role="status" style={{ margin: 0, color: result.ok ? "#166534" : "#b42318", fontWeight: 600 }}>{result.text}</p>}
      <button type="submit" className="ft-btn ft-btn--secondary" disabled={busy || !idNumber.trim()}>{busy ? "Checking…" : "Check my ID number"}</button>
    </form>
  );
}
