import { useEffect, useState } from "react";
import Link from "next/link";
import api from "../../utils/api";
import type { VendorPublic } from "../../types/vendor";

type Props = {
  country?: string; // ISO-2
  selected: { vendorId: string; vendorName?: string; last4?: string } | undefined;
  onChange: (v: { vendorId: string; vendorName: string; last4: string } | undefined) => void;
};

/** Choose a verified vendor to pay directly (FT-038). The payout is then locked to its verified account. */
export default function VendorPicker({ country, selected, onChange }: Props) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<VendorPublic[]>([]);
  useEffect(() => {
    if (selected) return undefined;
    const t = setTimeout(() => {
      const params = new URLSearchParams({ ...(country ? { country } : {}), ...(q.trim() ? { q: q.trim() } : {}) });
      api.get(`/api/vendors?${params}`).then((r) => setResults((r.data?.data?.vendors || []).slice(0, 8))).catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(t);
  }, [q, country, selected]);

  if (selected?.vendorId) {
    return (
      <div className="ft-card" style={{ padding: 14, marginBottom: 20, borderColor: "#86efac" }}>
        <p className="mb-1">
          <strong>Paying {selected.vendorName}</strong> <span style={{ color: "#166534" }}>✓ Verified vendor</span>
        </p>
        <p className="ft-muted mb-2" style={{ fontSize: 14 }}>
          The money goes straight to their verified account ending {selected.last4}. Nobody, including you, can redirect it.
        </p>
        <button type="button" className="ft-btn ft-btn--secondary ft-btn--sm" onClick={() => onChange(undefined)}>
          Choose a different payee
        </button>
      </div>
    );
  }
  return (
    <div style={{ marginBottom: 24 }}>
      <h6 className="mb-2">Pay a verified vendor (recommended)</h6>
      <p className="text-small mb-2">
        Hospitals, schools and suppliers we&apos;ve already checked. Requests to verified vendors are reviewed faster and donors trust them more.
      </p>
      <input className="form-control mb-2" type="search" placeholder="Search verified vendors" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search verified vendors" />
      {results.length > 0 ? (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 6 }}>
          {results.map((v) => (
            <li key={v.id}>
              <button
                type="button"
                className="ft-btn ft-btn--secondary ft-btn--block"
                style={{ justifyContent: "space-between", textAlign: "left" }}
                onClick={() => onChange({ vendorId: v.id, vendorName: v.tradingName || v.legalName, last4: v.bank.last4 })}
              >
                <span>{v.tradingName || v.legalName}</span>
                <span className="ft-muted" style={{ fontSize: 13 }}>{v.city || v.country} · ••••{v.bank.last4}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="ft-muted" style={{ fontSize: 14 }}>
          No match. <Link href="/vendors/apply">Suggest the vendor</Link> for verification, or enter their bank details below.
        </p>
      )}
    </div>
  );
}
