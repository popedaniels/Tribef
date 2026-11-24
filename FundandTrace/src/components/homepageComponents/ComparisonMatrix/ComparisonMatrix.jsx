import React from "react";
import Link from "next/link";
import styles from "./ComparisonMatrix.module.scss";

export default function ComparisonMatrix() {
  // Keep both columns factual. The right-hand column describes the common
  // model in the market in general terms; never name or misstate a competitor.
  const comparisonData = [
    {
      feature: "Where your donation goes",
      fundandtrace: "Held in escrow and released in stages",
      traditional: "Usually paid out to the organiser, often in one go",
      highlight: true,
    },
    {
      feature: "Before money is paid out",
      fundandtrace: "A request with a stated purpose, reviewed by our team",
      traditional: "Rarely any review of how it will be spent",
      highlight: true,
    },
    {
      feature: "Proof of spending",
      fundandtrace: "Receipts published after each payout, with a 14-day deadline",
      traditional: "Optional updates from the organiser",
      highlight: false,
    },
    {
      feature: "Checking the record",
      fundandtrace: "Public, hash-chained ledger you can verify in your browser",
      traditional: "Totals shown by the platform",
      highlight: false,
    },
    {
      feature: "If something goes wrong",
      fundandtrace: "Donor reports can freeze payouts. What's left is refunded pro-rata",
      traditional: "Varies, and often limited once money is withdrawn",
      highlight: false,
    },
    {
      feature: "Platform fee",
      fundandtrace: "0%. Optional donor tip; processing fees apply",
      traditional: "0–8% depending on the platform, plus processing fees",
      highlight: false,
    },
  ];

  return (
    <section className={styles.sectionWrapper}>
      <div className="custom-container">
        <div className={styles.header}>
          <span className="ft-eyebrow mb-2">How we compare</span>
          <h2 className={styles.heading}>Built differently, on purpose</h2>
          <p className={styles.subheading}>
            What changes when donations are held in escrow instead of paid out up front.
          </p>
        </div>

        <div className={styles.matrixCard}>
          {/* Desktop Table View */}
          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.featureCol}>
                    <span className="sr-only">Feature</span>
                  </th>
                  <th className={styles.brandCol}>
                    <div className={styles.brandHeader}>
                      <span className={styles.brandTitle}>Fund&Trace</span>
                    </div>
                  </th>
                  <th className={styles.legacyCol}>Typical crowdfunding</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, idx) => (
                  <tr key={idx} className={row.highlight ? styles.highlightRow : ""}>
                    <td className={styles.featureName}>
                                            {row.feature}
                    </td>
                    <td className={styles.brandCell} data-label="Fund&Trace">
                      <div className={styles.cellContent}>
                        <svg className={styles.checkIcon} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>{row.fundandtrace}</span>
                      </div>
                    </td>
                    <td className={styles.legacyCell} data-label="Typical crowdfunding">
                      <div className={styles.cellContent}>
                        <svg className={styles.crossIcon} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <circle cx="10" cy="10" r="3" />
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
              <h3>Raising money for something that matters?</h3>
              <p>Starting a campaign is free, and donors can see you&apos;re accountable from day one.</p>
            </div>
            <Link href="/StartACampaign" className="ft-btn ft-btn--primary">
              Start a campaign
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
