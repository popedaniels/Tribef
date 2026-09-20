import React, { useState } from "react";
import styles from "./EscrowWorkflowSimulator.module.scss";

const steps = [
  {
    id: 1,
    title: "1. Multi-Sig Escrow Lock",
    badge: "Stage 01: Secure Deposit",
    subtitle: "Donor capital enters audited smart escrow contracts instantly.",
    description:
      "When you donate to a verified cause, 100% of your funds are placed into an institutional milestone escrow. The campaign organizer cannot withdraw money in advance.",
    metrics: [
      { label: "Escrow Status", value: "Locked & Audited", highlight: true },
      { label: "Intermediary Cut", value: "0% Hidden Fees" },
      { label: "Donor Guarantee", value: "Cryptographic Escrow" },
    ],
    hash: "0x8f2a...7c91e",
    visualIcon: "🔒",
  },
  {
    id: 2,
    title: "2. Geotagged Proof & Hash Verification",
    badge: "Stage 02: Evidence Validation",
    subtitle: "Invoices, clinic bills, and photo evidence are validated.",
    description:
      "Before any milestone disbursement is approved, verified hospital receipts, doctor sign-offs, or contractor progress photos are audited against strict milestone objectives.",
    metrics: [
      { label: "Audit Verification", value: "Proof Verified", highlight: true },
      { label: "Evidence Type", value: "Hospital Invoice + Photo" },
      { label: "Disbursement Check", value: "Multi-Signature Match" },
    ],
    hash: "0x4b71...a93de",
    visualIcon: "📑",
  },
  {
    id: 3,
    title: "3. Direct Settlement to Providers",
    badge: "Stage 03: Direct Disbursal",
    subtitle: "Funds are released directly to hospitals, contractors, and clinics.",
    description:
      "Upon milestone approval, funds bypass intermediaries and disburse directly to the verified service provider or clinic with real-time public ledger updates.",
    metrics: [
      { label: "Disbursal Mode", value: "Direct-to-Vendor", highlight: true },
      { label: "Settlement Speed", value: "Instant Automated" },
      { label: "Public Ledger", value: "100% Traceable" },
    ],
    hash: "0x1e88...b25ff",
    visualIcon: "⚡",
  },
];

export default function EscrowWorkflowSimulator() {
  const [activeStep, setActiveStep] = useState(1);
  const current = steps.find((s) => s.id === activeStep) || steps[0];

  return (
    <section className={styles.section} id="how-escrow-works">
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.tag}>Zero-Fraud Architecture</span>
          <h2 className={styles.heading}>
            How Milestone Escrow <span>Protects Every Dollar</span>
          </h2>
          <p className={styles.subheading}>
            Explore our 3-stage cryptographic verification pipeline. No advance cashouts, no hidden diversions.
          </p>
        </div>

        {/* Stepper Navigation Pills */}
        <div className={styles.stepperNav}>
          {steps.map((s) => (
            <button
              key={s.id}
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
        <div className={styles.simulatorCard}>
          <div className={styles.cardLeft}>
            <div className={styles.stageBadge}>
              <span className="live-pulse-dot" />
              <span>{current.badge}</span>
            </div>
            <h3 className={styles.stageHeadline}>{current.title}</h3>
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
                <span className={styles.terminalTitle}>ESCROW_AUDIT_LOG_v2.6</span>
              </div>
              <div className={styles.terminalBody}>
                <div className={styles.logLine}>
                  <span className={styles.logTime}>[18:42:01 UTC]</span>{" "}
                  <span className={styles.logKey}>STAGE:</span> {current.badge}
                </div>
                <div className={styles.logLine}>
                  <span className={styles.logTime}>[18:42:03 UTC]</span>{" "}
                  <span className={styles.logKey}>HASH:</span> {current.hash}
                </div>
                <div className={styles.logLine}>
                  <span className={styles.logTime}>[18:42:04 UTC]</span>{" "}
                  <span className={styles.logKey}>STATUS:</span>{" "}
                  <span className={styles.statusOk}>VERIFIED & ENFORCED</span>
                </div>
                <div className={styles.terminalBigIcon}>{current.visualIcon}</div>
                <div className={styles.securitySeal}>
                  🛡️ 100% Cryptographically Protected by Fund&amp;Trace Escrow
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
