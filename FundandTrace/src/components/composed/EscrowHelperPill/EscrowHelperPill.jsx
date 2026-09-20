import React, { useState } from "react";
import styles from "./EscrowHelperPill.module.scss";

const faqs = [
  {
    q: "How does milestone escrow prevent campaign fraud?",
    a: "100% of donor capital remains locked in audited escrow contracts. Funds are only released directly to verified service providers (hospitals, suppliers, contractors) when milestone evidence is approved.",
  },
  {
    q: "Can campaign organizers withdraw money in advance?",
    a: "No. Organizers cannot perform lump-sum cashouts. Every withdrawal requires itemized invoice verification and multi-signature sign-off.",
  },
  {
    q: "What happens if a milestone fails or is cancelled?",
    a: "If a milestone fails audit or a campaign is halted, all remaining locked escrow capital is returned directly back to the original donors.",
  },
];

export default function EscrowHelperPill() {
  const [open, setOpen] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState(0);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={styles.floatingPill}
        aria-label="Ask Fund and Trace AI about escrow security"
      >
        <span className={styles.shieldIcon}>🛡️</span>
        <span className={styles.pillText}>How Escrow Protects You</span>
        <span className={styles.arrow}>→</span>
      </button>

      {open && (
        <div className={styles.modalOverlay} onClick={() => setOpen(false)}>
          <div className={styles.drawerCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <div className={styles.aiBadge}>
                <span className="live-pulse-dot" /> ESCROW TRUST ASSISTANT
              </div>
              <button className={styles.closeBtn} onClick={() => setOpen(false)}>
                ✕
              </button>
            </div>

            <h4 className={styles.drawerTitle}>Instant Escrow &amp; Security Guide</h4>

            <div className={styles.faqList}>
              {faqs.map((f, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedFaq(i)}
                  className={[
                    styles.faqTab,
                    selectedFaq === i ? styles.faqTabActive : "",
                  ].join(" ")}
                >
                  {f.q}
                </button>
              ))}
            </div>

            <div className={styles.answerBox}>
              <p>{faqs[selectedFaq].a}</p>
            </div>

            <div className={styles.drawerFooter}>
              <span>⚡ 100% Milestone Verified • 0% Middleman Take</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
