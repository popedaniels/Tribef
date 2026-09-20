import React from "react";
import styles from "./LiveActivityTicker.module.scss";

const liveEvents = [
  {
    id: "evt-1",
    tag: "Direct Settlement",
    amount: "$9,000",
    desc: "Hospital surgery invoice verified & settled to clinic",
    loc: "Lagos, NG",
    time: "2m ago",
    type: "settled",
  },
  {
    id: "evt-2",
    tag: "Milestone Verified",
    amount: "$12,000",
    desc: "Solar borehole pumping system certified & released",
    loc: "Mukono, UG",
    time: "7m ago",
    type: "verified",
  },
  {
    id: "evt-3",
    tag: "Escrow Locked",
    amount: "$6,200",
    desc: "STEM lab hardware milestone escrow funded",
    loc: "Nairobi, KE",
    time: "14m ago",
    type: "escrow",
  },
  {
    id: "evt-4",
    tag: "Receipt Audited",
    amount: "$15,768",
    desc: "Chemotherapy pharmacy invoice passed audit",
    loc: "Accra, GH",
    time: "21m ago",
    type: "audit",
  },
  {
    id: "evt-5",
    tag: "Direct Settlement",
    amount: "$4,500",
    desc: "Pediatric cold-chain refrigeration units settled",
    loc: "Enugu, NG",
    time: "33m ago",
    type: "settled",
  },
];

export default function LiveActivityTicker() {
  return (
    <div className={styles.tickerWrapper}>
      <div className={styles.labelBadge}>
        <span className="live-pulse-dot" />
        <span>LIVE ESCROW STREAM</span>
      </div>
      <div className={styles.trackContainer}>
        <div className={styles.marquee}>
          {[...liveEvents, ...liveEvents].map((item, idx) => (
            <div key={`${item.id}-${idx}`} className={styles.eventCard}>
              <span className={styles.typePill}>
                {item.type === "settled" ? "⚡ SETTLED" : item.type === "verified" ? "✓ VERIFIED" : item.type === "audit" ? "🛡️ AUDITED" : "🔒 ESCROW"}
              </span>
              <strong className={styles.amount}>{item.amount}</strong>
              <span className={styles.desc}>{item.desc}</span>
              <span className={styles.meta}>
                <span className={styles.loc}>{item.loc}</span>
                <span className={styles.dot}>•</span>
                <span className={styles.time}>{item.time}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
