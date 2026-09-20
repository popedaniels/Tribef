import React from "react";
import styles from "./ReceiptInspectorModal.module.scss";

export default function ReceiptInspectorModal({
  showModal = false,
  onModalClose = () => {},
  milestone = {
    title: "Phase 1: Emergency Surgery & ICU Settlement",
    vendor: "St. Jude Specialist Clinic & Surgical Center",
    amount: "$9,000.00",
    date: "August 18, 2026",
    hash: "0x9a8f2e7c10b488319f0418c242e9a71b409c71e2a09f8",
    geo: "6.5244° N, 3.3792° E (Lagos, NG)",
    ref: "TXN-FT-99481029",
    items: [
      { desc: "Emergency Surgical Suite & Anesthesia Team", cost: "$4,500.00" },
      { desc: "Post-Operative ICU Oxygen & Monitoring (72 hrs)", cost: "$2,800.00" },
      { desc: "Specialist Prescription Medications & Plasma", cost: "$1,700.00" },
    ],
  },
}) {
  if (!showModal) return null;

  return (
    <div className={styles.overlay} onClick={onModalClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <span className={styles.badge}>
              <span className="live-pulse-dot" /> VERIFIED RECEIPT INSPECTOR
            </span>
            <h3 className={styles.title}>{milestone.title}</h3>
          </div>
          <button className={styles.closeBtn} onClick={onModalClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        {/* Vendor & Amount Bar */}
        <div className={styles.vendorCard}>
          <div>
            <span className={styles.vendorLabel}>Settled Payee / Service Provider</span>
            <strong className={styles.vendorName}>{milestone.vendor}</strong>
          </div>
          <div className={styles.amountBox}>
            <span className={styles.amountLabel}>Total Settled</span>
            <strong className={styles.amountValue}>{milestone.amount}</strong>
          </div>
        </div>

        {/* Itemized Breakdown Table */}
        <div className={styles.itemTable}>
          <div className={styles.tableHeader}>
            <span>Itemized Verified Service</span>
            <span>Cost</span>
          </div>
          {milestone.items.map((item, idx) => (
            <div key={idx} className={styles.tableRow}>
              <span>{item.desc}</span>
              <strong>{item.cost}</strong>
            </div>
          ))}
        </div>

        {/* Audit Hash & Geotag Security Block */}
        <div className={styles.auditBlock}>
          <div className={styles.auditRow}>
            <span className={styles.auditKey}>SHA-256 Checksum:</span>
            <span className={styles.auditHash}>{milestone.hash}</span>
          </div>
          <div className={styles.auditRow}>
            <span className={styles.auditKey}>Geotag Location:</span>
            <span className={styles.auditVal}>📍 {milestone.geo}</span>
          </div>
          <div className={styles.auditRow}>
            <span className={styles.auditKey}>Escrow Settlement Ref:</span>
            <span className={styles.auditVal}>⚡ {milestone.ref} ({milestone.date})</span>
          </div>
        </div>

        {/* Footer Seal */}
        <div className={styles.footerSeal}>
          🛡️ Cryptographically verified and audited by Fund&amp;Trace Escrow Engine
        </div>
      </div>
    </div>
  );
}
