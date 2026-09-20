import React from "react";
import { motion } from "framer-motion";
import Ripple from "../../canvasui/Ripple";
import styles from "./GlobalImpact.module.scss";

export default function GlobalImpact() {
  return (
    <section className={styles.section} id="global-impact">
      <div className={styles.container}>
        <motion.div
          className={styles.leftCol}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className={styles.tag}>Bridging the Global Trust Deficit</span>
          <h2>
            Unlocking Giving for <span>Underserved Communities</span>
          </h2>
          <p>
            Millions of crucial humanitarian, medical, and community initiatives across Africa,
            Asia, Eastern Europe, and Latin America struggle to raise funds because donors fear
            corruption or fund diversion.
          </p>
          <p>
            Fund&amp;Trace bridges this gap by enforcing cryptographic receipt validation and
            milestone-based escrows—allowing international donors to support local grassroot causes
            with complete confidence.
          </p>

          <div className={styles.statsRow}>
            <div className={styles.statItem}>
              <strong>100%</strong>
              <span>Verified Disbursals</span>
            </div>
            <div className={styles.statItem}>
              <strong>0%</strong>
              <span>Hidden Intermediary Cuts</span>
            </div>
            <div className={styles.statItem}>
              <strong>14+</strong>
              <span>Countries Supported</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          className={styles.rightCol}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Ripple
            amplitude={0.25}
            speed={0.5}
            wavelength={50}
            rings={2}
            decay={1}
            refraction={30}
            dispersion={0.08}
            shine={0.4}
            trigger="hover"
            interval={0}
          >
            <div className={styles.imageGrid}>
              <div className={styles.imgBox1}>
                <img
                  src="/images/stories/solar_eco.jpg"
                  alt="Community Solar and Clean Energy Empowerment"
                />
              </div>
              <div className={styles.imgBox2}>
                <img
                  src="/images/stories/tech_girls.jpg"
                  alt="Global STEM Crowdfunding Impact"
                />
              </div>
            </div>
          </Ripple>
        </motion.div>
      </div>
    </section>
  );
}
