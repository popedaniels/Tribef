import React from "react";
import styles from "./TrustTagChips.module.scss";

const chips = [
  { icon: "🟢", label: "100% On-Chain Escrow", tooltip: "All donor capital is locked in audited smart contracts" },
  { icon: "🛡️", label: "Bank-Grade AES-256", tooltip: "Recipient & bank details protected by AES-256-CBC encryption" },
  { icon: "⚡", label: "0% Platform Fee", tooltip: "100% of your donation reaches verified medical & cause milestones" },
  { icon: "🔐", label: "Multi-Sig Disbursal", tooltip: "Requires verified clinic sign-off before funds unlock" },
];

export default function TrustTagChips() {
  return (
    <div className={styles.chipsContainer}>
      {chips.map((c, i) => (
        <div key={i} className={styles.chip} title={c.tooltip}>
          <span className={styles.icon}>{c.icon}</span>
          <span className={styles.label}>{c.label}</span>
        </div>
      ))}
    </div>
  );
}
