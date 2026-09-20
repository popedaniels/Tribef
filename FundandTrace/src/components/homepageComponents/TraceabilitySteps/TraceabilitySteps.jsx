import React from "react";
import { motion } from "framer-motion";
import GlassObject from "../../canvasui/GlassObject";
import styles from "./TraceabilitySteps.module.scss";

const steps = [
  {
    number: "01",
    icon: "/images/icons/setup.svg",
    title: "1. Define Phased Milestones",
    description:
      "Campaign organizers set up their fundraiser in under 10 minutes, breaking their financial goal into transparent, trackable milestone stages.",
  },
  {
    number: "02",
    icon: "/images/icons/payment.svg",
    title: "2. Give with 0% Commission",
    description:
      "Donors contribute seamlessly via secure card, bank transfer, or mobile money without paying any platform deduction fees.",
  },
  {
    number: "03",
    icon: "/images/icons/tracking.svg",
    title: "3. Verified Milestone Payouts",
    description:
      "Funds are disbursed incrementally as organizers submit invoices, medical receipts, or progress proof for platform audit verification.",
  },
  {
    number: "04",
    icon: "/images/icons/accountable.svg",
    title: "4. Automated Audit Statements",
    description:
      "Every contributor receives periodic email statement reports detailing how the raised capital is utilized, ensuring 100% peace of mind.",
  },
];

export default function TraceabilitySteps() {
  return (
    <section className={styles.section} id="how-it-works">
      {/* 3D glass shield — pure WebGL, works in every browser */}
      <div className={styles.glassAccent}>
        <GlassObject
          style={{ width: "100%", height: "100%" }}
          src="/images/icons/shield-check.svg"
          ior={1.6}
          thickness={5}
          roughness={0.15}
          dispersion={1.2}
          clearcoat={0.6}
          tint="#6979F8"
          tintDensity={1.8}
          depth={0.1}
          bevel={1}
          highlight="#aeb9ff"
          environmentIntensity={1}
          scale={2.2}
          floatIntensity={1.5}
          floatSpeed={1.5}
          rotationIntensity={1}
          orbit
        />
      </div>
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <span className={styles.tag}>How Fund&amp;Trace Works</span>
          <h2>
            A Higher Standard for <span>Crowdfunding Accountability</span>
          </h2>
          <p>
            Unlike traditional platforms where funds vanish into a black box, Fund&amp;Trace
            connects every donation directly to verifiable real-world outcomes.
          </p>
        </div>

        <div className={styles.stepsGrid}>
          {steps.map((step, index) => (
            <motion.div
              key={index}
              className={styles.stepCard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className={styles.stepBadge}>{step.number}</div>
              <div className={styles.iconWrap}>
                <img src={step.icon} alt={step.title} />
              </div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
