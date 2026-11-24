import type { GetServerSidePropsContext } from "next";
import Link from "next/link";
import axios from "axios";
import Layout from "../../components/Layout";
import Navbar from "../../components/Navbar/Navbar";
import { getApiBaseUrl } from "../../utils/api";
import { formatMoney } from "../../components/helperFunctions/helperFunctions";
import { VendorPublic, countryName } from "../../types/vendor";
import styles from "../../components/campaignPage/Vendors.module.scss";

type Payout = { campaignId: string; campaignTitle: string; amount: number; currency: string; date: string; purpose: string };
type Props = { vendor: (VendorPublic & { payouts: Payout[] }) | null };

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  try {
    const r = await axios.get(`${getApiBaseUrl()}/api/vendors/${ctx.query.id}`, { timeout: 4000 });
    return { props: { vendor: r.data?.data || null } };
  } catch {
    return { props: { vendor: null } };
  }
}

const day = (d?: string) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "");

export default function VendorProfile({ vendor: v }: Props) {
  if (!v) {
    return (
      <Layout title="Vendor not found | Fund&Trace" description="This vendor isn't in the verified network.">
        <Navbar />
        <main className={styles.page}>
          <h1>Vendor not found</h1>
          <p>It may not be verified yet, or it was removed from the network.</p>
          <Link href="/vendors">See all verified vendors</Link>
        </main>
      </Layout>
    );
  }
  const name = v.tradingName || v.legalName;
  return (
    <Layout showFooter title={`${name} · Verified vendor | Fund&Trace`} description={`${name} is a verified ${v.category.toLowerCase()} in ${countryName(v.country)}. See the campaign payouts it has received.`}>
      <Navbar />
      <main className={styles.page}>
        <nav aria-label="Breadcrumb" className="mb-2">
          <Link href="/vendors">Verified vendors</Link>
        </nav>
        <header className={styles.hero}>
          <span className={styles.badge}>✓ Verified {day(v.verifiedAt)}</span>
          <h1>{name}</h1>
          <p className="ft-muted">
            {v.category} · {[v.city, countryName(v.country)].filter(Boolean).join(", ")}
          </p>
          {v.description && <p>{v.description}</p>}
        </header>
        <section className={styles.facts} aria-label="What we checked">
          <div>
            <h2>Registered as</h2>
            <p>
              {v.legalName}
              <br />
              <span className="ft-muted">No. {v.registrationNumber}</span>
              {v.registryUrl && (
                <>
                  <br />
                  <a href={v.registryUrl} target="_blank" rel="noopener noreferrer">
                    Public register entry
                  </a>
                </>
              )}
            </p>
          </div>
          <div>
            <h2>Paid into</h2>
            <p>
              {v.bank.bankName || "Bank account"} ending {v.bank.last4}
              <br />
              <span className="ft-muted">Account name confirmed with our payment provider</span>
            </p>
          </div>
          {v.website && (
            <div>
              <h2>Website</h2>
              <p>
                <a href={v.website} target="_blank" rel="noopener noreferrer nofollow">
                  {v.website.replace(/^https?:\/\//, "")}
                </a>
              </p>
            </div>
          )}
        </section>
        <section>
          <h2 className={styles.h2}>Payouts from campaigns</h2>
          {v.payouts.length ? (
            <ul className={styles.payouts}>
              {v.payouts.map((p, i) => (
                <li key={i}>
                  <div>
                    <Link href={`/campaign/${p.campaignId}/tracker`}>{p.campaignTitle || "Campaign"}</Link>
                    {p.purpose && <p className="ft-muted mb-0">{p.purpose}</p>}
                  </div>
                  <div className={styles.amount}>
                    <strong>{formatMoney(p.amount, p.currency)}</strong>
                    <span className="ft-muted">{day(p.date)}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="ft-muted">No campaign has paid this vendor yet.</p>
          )}
        </section>
      </main>
    </Layout>
  );
}
