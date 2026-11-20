import React from "react";
import styles from "./trust.module.scss";

type Props = { lockReason?: string; compact?: boolean };

/** Shown on campaign, donate and tracker pages while the escrow is dispute-locked. */
export default function FrozenBanner({ lockReason, compact = false }: Props) {
  return (
    <div className={`${styles.frozen} ${compact ? styles.frozenCompact : ""}`} role="alert">
      <svg className={styles.frozenIcon} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M12 8v5M12 16.5v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <div>
        <p className={styles.frozenTitle}>Paused for review</p>
        <p className={styles.frozenText}>
          Donors raised concerns, so new donations and payouts are paused while our trust &amp; safety team investigates.
          Money already given stays protected in escrow and is refunded to donors if misuse is confirmed.
          {lockReason ? <span className={styles.frozenReason}> {lockReason}</span> : null}
        </p>
      </div>
    </div>
  );
}
