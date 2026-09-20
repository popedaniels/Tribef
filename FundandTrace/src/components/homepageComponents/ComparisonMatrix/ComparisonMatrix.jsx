import React from "react";
import Link from "next/link";
import styles from "./ComparisonMatrix.module.scss";

export default function ComparisonMatrix() {
  const comparisonData = [
    {
      feature: "Milestone-Based Escrow Release",
      fundandtrace: "Yes (Funds released in tranches upon verified proof)",
      traditional: "No (100% upfront lump-sum with zero accountability)",
      highlight: true,
    },
    {
      feature: "Platform Commission on Emergencies",
      fundandtrace: "0% Platform Fee (100% reaches direct care)",
      traditional: "2.9% - 8% deducted immediately",
      highlight: true,
    },
    {
      feature: "Live Vendor & Hospital Invoices",
      fundandtrace: "Publicly inspectable with geo-stamps & signatures",
      traditional: "None (Private or opaque)",
      highlight: false,
    },
    {
      feature: "Donor Refund Protection on Fraud",
      fundandtrace: "Automated escrow lock & community refund mechanism",
      traditional: "Manual, lengthy support tickets with no guarantee",
      highlight: false,
    },
    {
      feature: "Real-Time Project Tracking",
      fundandtrace: "Live milestone timeline & instant push alerts",
      traditional: "Sporadic text updates written months later",
      highlight: false,
    },
    {
      feature: "Institutional Non-Profit Auditing",
      fundandtrace: "Multi-signature verification by licensed validators",
      traditional: "Basic unverified social media identity check",
      highlight: false,
    },
  ];

  return (
    <section className={styles.sectionWrapper}>
      <div className="custom-container">
        <div className={styles.header}>
          <div className="d-inline-flex align-items-center mb-2">
            <span className="badge-escrow-verified">
              <span className="live-pulse-dot-indigo"></span>
              Institutional Accountability
            </span>
          </div>
          <h2 className={styles.heading}>Built Different. On Purpose.</h2>
          <p className={styles.subheading}>
            Why thousands of donors and verified non-profits choose milestone-based giving over traditional unmonitored fundraisers.
          </p>
        </div>

        <div className={styles.matrixCard}>
          {/* Desktop Table View */}
          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.featureCol}>Core Integrity Feature</th>
                  <th className={styles.brandCol}>
                    <div className={styles.brandHeader}>
                      <span className={styles.brandTitle}>Fund&Trace</span>
                      <span className={styles.badgeBest}>Verified Escrow</span>
                    </div>
                  </th>
                  <th className={styles.legacyCol}>Traditional Platforms</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, idx) => (
                  <tr key={idx} className={row.highlight ? styles.highlightRow : ""}>
                    <td className={styles.featureName}>
                      <span className={styles.featureIcon}>✦</span>
                      {row.feature}
                    </td>
                    <td className={styles.brandCell}>
                      <div className={styles.cellContent}>
                        <svg className={styles.checkIcon} viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>{row.fundandtrace}</span>
                      </div>
                    </td>
                    <td className={styles.legacyCell}>
                      <div className={styles.cellContent}>
                        <svg className={styles.crossIcon} viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span>{row.traditional}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.ctaFooter}>
            <div className={styles.ctaText}>
              <h4>Ready to launch a campaign with 100% donor trust?</h4>
              <p>Setup takes less than 3 minutes. Zero upfront fees.</p>
            </div>
            <Link href="/StartACampaign">
              <a className="btn btn-brand-primary">Start a Verified Campaign</a>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
