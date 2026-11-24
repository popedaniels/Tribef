import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import styles from "./EscrowHelperPill.module.scss";

// Every answer describes what the product actually does today. Keep it that
// way: this panel is a trust surface, and overclaiming here undoes it.
const faqs = [
  {
    q: "Where is my donation held?",
    a: "Your donation is held by Fund&Trace for the campaign. It is not paid straight to the organiser. Money is released in stages, and each release starts with a funding request that our team reviews.",
  },
  {
    q: "Can the organiser withdraw everything at once?",
    a: "No. Each payout needs a funding request that says what the money is for, and the organiser must verify their identity before being paid. Where possible, money goes directly to the hospital, school or supplier. Organisers upload a receipt after each payout.",
  },
  {
    q: "How can I check where the money went?",
    a: "Every donation, payout and refund is written to the campaign's public ledger. Each entry is linked to the one before it by a cryptographic hash, so you can re-check the whole record yourself on the campaign's tracker page.",
  },
  {
    q: "What if something goes wrong?",
    a: "You can report a campaign. Repeated reports freeze it while we review. If we decide to refund, what's left in escrow goes back to donors in proportion to what they gave. You can also refund your own donation within 30 days while the money is still in escrow.",
  },
];

// Pages that already explain escrow next to their own sticky actions.
const HIDDEN_ON = [/^\/campaign\/\[id\]/, /^\/donate\//, /^\/donated\//, /^\/admin/, /^\/dashboard/, /^\/StartACampaign/];

export default function EscrowHelperPill() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(0);
  const closeRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (HIDDEN_ON.some((re) => re.test(router?.pathname || ""))) return null;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={styles.floatingPill} aria-haspopup="dialog">
        <span className={styles.shieldIcon} aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
        </span>
        <span className={styles.pillText}>How your donation is protected</span>
      </button>

      {open && (
        <div className={styles.modalOverlay} onClick={() => setOpen(false)}>
          <div
            className={styles.drawerCard}
            role="dialog"
            aria-modal="true"
            aria-labelledby="escrow-help-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.drawerHeader}>
              <h2 id="escrow-help-title" className={styles.drawerTitle}>How your donation is protected</h2>
              <button ref={closeRef} type="button" className={`ft-plain ${styles.closeBtn}`} aria-label="Close" onClick={() => setOpen(false)}>
                ✕
              </button>
            </div>

            <div className={styles.faqList} role="tablist" aria-label="Questions">
              {faqs.map((f, i) => (
                <button
                  key={f.q}
                  type="button"
                  role="tab"
                  aria-selected={selected === i}
                  aria-controls="escrow-help-answer"
                  onClick={() => setSelected(i)}
                  className={[styles.faqTab, selected === i ? styles.faqTabActive : ""].join(" ")}
                >
                  {f.q}
                </button>
              ))}
            </div>

            <div className={styles.answerBox} id="escrow-help-answer" role="tabpanel">
              <p>{faqs[selected].a}</p>
            </div>

            <div className={styles.drawerFooter}>
              <span>0% platform fee. Card and bank processing fees still apply.</span>
              <Link href="/workings" onClick={() => setOpen(false)}>How it works →</Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
