import React, { useState } from "react";
import styles from "./EscrowWorkflowSimulator.module.scss";

// Describes what the platform actually does. The panel on the right is an
// example ledger entry (labelled as such), in the same shape as the real
// public ledger at /api/ledger/:campaignId.
const steps = [
  {
    id: 1,
    title: "1. Held in escrow",
    badge: "Step 1 · Donation",
    subtitle: "Your donation is held for the campaign, not paid to the organiser.",
    description:
      "The moment you give, it's recorded on the campaign's public ledger. The organiser can't withdraw it all at once, and you can refund it yourself within 30 days while it's still in escrow.",
    metrics: [
      { label: "Status", value: "Held in escrow", highlight: true },
      { label: "Platform fee", value: "0%" },
      { label: "Your record", value: "Public ledger entry" },
    ],
    entry: { seq: 41, type: "credit", label: "Donation received", amount: "+$50.00", prev: "9c1e04b7…", hash: "4b71a93d…" },
  },
  {
    id: 2,
    title: "2. Request and review",
    badge: "Step 2 · Funding request",
    subtitle: "The organiser asks for money for a stated purpose.",
    description:
      "Each request says what the money is for and who will be paid. Our team reviews it, the organiser must have verified their identity, and donor reports can freeze payouts while we look into a problem.",
    metrics: [
      { label: "Review", value: "Before any payout", highlight: true },
      { label: "Identity", value: "Verified first" },
      { label: "Disputes", value: "Can freeze payouts" },
    ],
    entry: { seq: 42, type: "review", label: "Request approved: Stage 2 invoice", amount: "—", prev: "4b71a93d…", hash: "—" },
  },
  {
    id: 3,
    title: "3. Paid and proven",
    badge: "Step 3 · Payout",
    subtitle: "Money goes out, ideally straight to the supplier, and proof follows.",
    description:
      "The payout is written to the ledger. The organiser uploads the receipt within 14 days, and it shows on the tracker. If a bank transfer fails, the money returns to escrow and that's recorded too.",
    metrics: [
      { label: "Paid to", value: "Supplier where possible", highlight: true },
      { label: "Receipt due", value: "Within 14 days" },
      { label: "Ledger", value: "Verifiable by anyone" },
    ],
    entry: { seq: 43, type: "payout", label: "Payout to St. Mary's Clinic", amount: "−$9,000.00", prev: "4b71a93d…", hash: "e88b25ff…" },
  },
];

export default function EscrowWorkflowSimulator() {
  const [activeStep, setActiveStep] = useState(1);
  const current = steps.find((s) => s.id === activeStep) || steps[0];

  return (
    <section className={styles.section} id="how-escrow-works">
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.tag}>Escrow, step by step</span>
          <h2 className={styles.heading}>
            Follow a donation <span>from you to the clinic</span>
          </h2>
          <p className={styles.subheading}>
            No lump-sum cash-outs. Every step leaves a record you can check.
          </p>
        </div>

        {/* Stepper Navigation Pills */}
        <div className={styles.stepperNav} role="tablist" aria-label="Escrow steps">
          {steps.map((s) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={activeStep === s.id}
              aria-controls="escrow-step-panel"
              onClick={() => setActiveStep(s.id)}
              className={[
                styles.stepButton,
                activeStep === s.id ? styles.activeStepButton : "",
              ].join(" ")}
            >
              <span className={styles.stepNum}>0{s.id}</span>
              <span className={styles.stepTitle}>{s.title.split(". ")[1]}</span>
            </button>
          ))}
        </div>

        {/* Interactive Simulator Stage Card */}
        <div className={styles.simulatorCard} id="escrow-step-panel" role="tabpanel">
          <div className={styles.cardLeft}>
            <div className={styles.stageBadge}>
              <span>{current.badge}</span>
            </div>
            <h3 className={styles.stageHeadline}>{current.title.split(". ")[1]}</h3>
            <p className={styles.stageSubtitle}>{current.subtitle}</p>
            <p className={styles.stageDesc}>{current.description}</p>

            <div className={styles.metricGrid}>
              {current.metrics.map((m, i) => (
                <div key={i} className={styles.metricTile}>
                  <span className={styles.metricLabel}>{m.label}</span>
                  <strong className={m.highlight ? styles.metricHighlight : styles.metricVal}>
                    {m.value}
                  </strong>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.cardRight}>
            <div className={styles.visualTerminal}>
              <div className={styles.terminalHeader}>
                <span className={styles.terminalDotRed} />
                <span className={styles.terminalDotYellow} />
                <span className={styles.terminalDotGreen} />
                <span className={styles.terminalTitle}>Example ledger entry</span>
              </div>
              <div className={styles.terminalBody}>
                <div className={styles.logLine}>
                  <span className={styles.logKey}>#</span> {current.entry.seq} · <span className={styles.logKey}>{current.entry.type}</span>
                </div>
                <div className={styles.logLine}>{current.entry.label}</div>
                <div className={styles.logLine}>
                  <span className={styles.logKey}>amount</span> {current.entry.amount}
                </div>
                <div className={styles.logLine}>
                  <span className={styles.logKey}>prevHash</span> <span className={styles.logTime}>{current.entry.prev}</span>
                </div>
                <div className={styles.logLine}>
                  <span className={styles.logKey}>hash</span> <span className={styles.statusOk}>{current.entry.hash}</span>
                </div>
                <div className={styles.securitySeal}>
                  Each entry includes the previous entry&apos;s hash, so a change anywhere breaks the chain.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
