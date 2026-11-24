import { useEffect, useState } from "react";
import Link from "next/link";
import Layout from "../../components/Layout";
import Navbar from "../../components/Navbar/Navbar";
import api from "../../utils/api";
import { formatMoney } from "../../components/helperFunctions/helperFunctions";
import { VendorPublic, VENDOR_CATEGORIES, VENDOR_COUNTRIES, countryName } from "../../types/vendor";
import styles from "../../components/campaignPage/Vendors.module.scss";

export default function VendorsDirectory() {
  const [country, setCountry] = useState("");
  const [category, setCategory] = useState("");
  const [q, setQ] = useState("");
  const [vendors, setVendors] = useState<VendorPublic[] | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams({ ...(country ? { country } : {}), ...(category ? { category } : {}), ...(q.trim() ? { q: q.trim() } : {}) });
      api
        .get(`/api/vendors?${params}`)
        .then((r) => setVendors(r.data?.data?.vendors || []))
        .catch(() => setVendors([]));
    }, 250);
    return () => clearTimeout(t);
  }, [country, category, q]);

  return (
    <Layout showFooter title="Verified vendors | Fund&Trace" description="Hospitals, schools and suppliers whose registration and bank account Fund&Trace has checked, so campaigns can pay them directly.">
      <Navbar />
      <main className={styles.page}>
        <header className={styles.hero}>
          <p className="ft-eyebrow">Verified vendors</p>
          <h1>Pay the hospital, school or supplier directly</h1>
          <p>
            Every vendor here has had its company registration checked against the public register and its bank account name confirmed with our payment provider. When a
            campaign pays a verified vendor, the money can only go to that account.
          </p>
          <Link href="/vendors/apply" className="ft-btn ft-btn--secondary">
            Suggest a vendor
          </Link>
        </header>

        <div className={styles.filters} role="search">
          <input className="form-control" type="search" placeholder="Search by name or city" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search vendors" />
          <select className="form-control" value={country} onChange={(e) => setCountry(e.target.value)} aria-label="Country">
            <option value="">All countries</option>
            {VENDOR_COUNTRIES.map(([c, n]) => (
              <option key={c} value={c}>{n}</option>
            ))}
          </select>
          <select className="form-control" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
            <option value="">All categories</option>
            {VENDOR_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {vendors === null ? (
          <p className="ft-muted">Loading…</p>
        ) : vendors.length ? (
          <ul className={styles.grid}>
            {vendors.map((v) => (
              <li key={v.id} className="ft-card">
                <Link href={`/vendors/${v.id}`} className={styles.cardLink}>
                  <span className={styles.badge}>✓ Verified</span>
                  <strong>{v.tradingName || v.legalName}</strong>
                  <span className="ft-muted">
                    {v.category} · {[v.city, countryName(v.country)].filter(Boolean).join(", ")}
                  </span>
                  <span className={styles.stat}>
                    {v.stats?.payouts
                      ? `Paid ${Object.entries(v.stats.totals).map(([c, t]) => formatMoney(t, c)).join(" + ")} across ${v.stats.payouts} payout${v.stats.payouts === 1 ? "" : "s"}`
                      : "No payouts yet"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="ft-empty">
            <h3>No verified vendors match</h3>
            <p>If the hospital, school or supplier you need to pay isn&apos;t listed, suggest it and we&apos;ll check it.</p>
            <Link href="/vendors/apply" className="ft-btn ft-btn--primary">
              Suggest a vendor
            </Link>
          </div>
        )}
      </main>
    </Layout>
  );
}
