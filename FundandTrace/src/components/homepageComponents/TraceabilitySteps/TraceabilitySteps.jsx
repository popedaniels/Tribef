import React from "react";
import styles from "./TraceabilitySteps.module.scss";

const steps = [
  {
    number: "01",
    icon: "/images/icons/setup.svg",
    title: "Set up in minutes",
    description:
      "Organisers tell their story, set a goal and add payout details. Before any money is paid to them, they verify their identity.",
  },
  {
    number: "02",
    icon: "/images/icons/payment.svg",
    title: "Give with no platform fee",
    description:
      "Donors pay by card, bank transfer, USSD or mobile money. We take no cut. Card and bank processing fees still apply.",
  },
  {
    number: "03",
    icon: "/images/icons/tracking.svg",
    title: "Released in reviewed stages",
    description:
      "Money stays in escrow until the organiser requests it for a stated purpose. Our team reviews each request and, where possible, pays the supplier directly.",
  },
  {
    number: "04",
    icon: "/images/icons/accountable.svg",
    title: "Proven in public",
    description:
      "Receipts go up after each payout, every payment is written to a public ledger you can verify, and donors can get an email whenever money moves.",
  },
];

export default function TraceabilitySteps() {
  return (
    <section className={styles.section} id="how-it-works">
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <span className={styles.tag}>How it works</span>
          <h2>
            Your donation, <span>accounted for</span>
          </h2>
          <p>
            On most platforms the money goes straight to the organiser and you take their word for the rest. Here it
            stays in escrow until it&apos;s needed, and you can see where every payment went.
          </p>
        </div>

        <div className={styles.stepsGrid}>
          {steps.map((step, index) => (
            <div key={index} className={`${styles.stepCard} ft-reveal`} style={{ animationDelay: `${index * 0.1}s` }}>
              <div className={styles.stepBadge}>{step.number}</div>
              <div className={styles.iconWrap}>
                <img src={step.icon} alt="" />
              </div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
