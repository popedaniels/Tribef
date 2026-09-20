import React from "react";
import { motion } from "framer-motion";
import InkObject from "../../canvasui/InkObject";
import styles from "./FeaturesGrid.module.scss";

const features = [
  {
    icon: "/images/icons/payment.svg",
    title: "0% Platform Commission",
    description:
      "Unlike other platforms taking 5% to 10% cuts, Fund&Trace charges 0% platform fee so your full donation creates impact.",
  },
  {
    icon: "/images/icons/tracking.svg",
    title: "Milestone-Based Releases",
    description:
      "Funds are released in phased milestones only after verified proof, invoices, and progress reports are submitted.",
  },
  {
    icon: "/images/icons/accountable.svg",
    title: "Itemized Audit Statements",
    description:
      "Receive automated, transparent periodic financial accounts of every disbursement sent straight to your email.",
  },
  {
    icon: "/images/icons/lock.svg",
    title: "Bank-Grade Encryption",
    description:
      "Every payment is encrypted with industry-standard 256-bit SSL via PCI-DSS certified partners (Flutterwave & Stripe).",
  },
  {
    icon: "/images/icons/reach.svg",
    title: "Global Multi-Currency",
    description:
      "Donate or receive funds seamlessly across USD, GBP, and NGN with immediate local bank and mobile money payouts.",
  },
  {
    icon: "/images/icons/consultation.svg",
    title: "24/7 Dedicated Support",
    description:
      "Our team provides round-the-clock guidance to assist with campaign setup, disbursement verification, and donor inquiries.",
  },
];

export default function FeaturesGrid() {
  return (
    <section className={styles.section} id="features">
      {/* 3D ink globe — pure WebGL, works in every browser */}
      <div className={styles.inkAccent}>
        <InkObject
          style={{ width: "100%", height: "100%" }}
          src="/images/icons/globe.svg"
          ink
          inkColor="#1f244a"
          lineSpacing={5.5}
          strokeWeight={1.3}
          variation={1.2}
          wobble={0.35}
          grain={0.3}
          relief={0.5}
          contrast={2.8}
          threshold={0.2}
          softness={0.4}
          environmentIntensity={0.15}
          highlight="#6979F8"
          roughness={0.35}
          scale={2.4}
          floatIntensity={1.5}
          rotationIntensity={1}
          floatSpeed={1.5}
          orbit
        />
      </div>
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <span className={styles.tag}>Why Choose Fund&amp;Trace</span>
          <h2>
            Infrastructure Built for <span>Radical Transparency</span>
          </h2>
          <p>
            We've reimagined online fundraising from the ground up to eliminate fraud, reduce
            donor friction, and maximize genuine social impact.
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
                <img src={item.icon} alt={item.title} />
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
