import React from "react";
import { motion } from "framer-motion";
import styles from "./FeaturesGrid.module.scss";

const features = [
  {
    icon: "/images/icons/payment.svg",
    title: "No platform fee",
    description:
      "We don't take a cut of what campaigns raise. Donors can add an optional tip, and card and bank processing fees still apply.",
  },
  {
    icon: "/images/icons/tracking.svg",
    title: "Released in stages",
    description:
      "Money stays in escrow until the organiser requests it for a stated purpose and our team approves it. Often it goes straight to the supplier.",
  },
  {
    icon: "/images/icons/accountable.svg",
    title: "Receipts and a public ledger",
    description:
      "Receipts are published after each payout, and every payment is on a hash-chained ledger anyone can verify.",
  },
  {
    icon: "/images/icons/lock.svg",
    title: "Secure payments",
    description:
      "Payments run through Stripe, Paystack and Flutterwave. We never see card details, and payout bank details are encrypted.",
  },
  {
    icon: "/images/icons/reach.svg",
    title: "Built for Africa and beyond",
    description:
      "Give by card, bank transfer, USSD or mobile money. Organisers are paid by bank transfer in Nigeria, Ghana, Kenya, South Africa and more, or through Stripe.",
  },
  {
    icon: "/images/icons/consultation.svg",
    title: "Protection if something's wrong",
    description:
      "Donor reports can freeze a campaign's payouts while we review it, and what's left in escrow can be refunded to donors.",
  },
];

export default function FeaturesGrid() {
  return (
    <section className={styles.section} id="features">
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <span className={styles.tag}>Why Fund&amp;Trace</span>
          <h2>
            Giving you can <span>check for yourself</span>
          </h2>
          <p>
            Every campaign on Fund&amp;Trace works the same way, so you always know what happens to your money.
          </p>
        </div>

        <div className={styles.grid}>
          {features.map((item, index) => (
            <motion.div
              key={index}
              className={styles.featureCard}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
            >
              <div className={styles.iconWrap}>
                <img src={item.icon} alt="" />
              </div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
