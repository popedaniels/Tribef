import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useSelector } from "react-redux";
import Navbar from "../../Navbar/Navbar";
import { selectAuthStateState } from "../../../../store/slices/authSlice";
import styles from "./HeroSection.module.scss";


export default function HeroSection() {
  const { authenticated } = useSelector(selectAuthStateState);

  const scrollToCampaigns = (e) => {
    e.preventDefault();
    const element = document.getElementById("campaigns");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className={styles.container}>
      <Navbar />

      <div className={styles.heroContent}>
        <div className="custom-container">
          <div className="row align-items-center">
            {/* Left Column: Value Prop & CTA */}
            <div className="col-lg-6 mb-5 mb-lg-0">
              <div className={styles.leftCol}>
                <span className={styles.eyebrow}>Crowdfunding with escrow and a public ledger</span>

                <h1 className={styles.headline}>
                  Give, then see <span className={styles.highlight}>exactly where it went</span>.
                </h1>

                <p className={styles.subheadline}>
                  Donations are held in escrow and released in reviewed stages, often straight to the hospital, school or
                  supplier. Every payment is recorded on a public ledger anyone can check. No platform fee.
                </p>

                <div className={styles.ctaGroup}>
                  <Link
                    href={authenticated ? "/StartACampaign/type" : "/SignUp"}
                    passHref
                    className={styles.primaryBtn}>

                    <span>Start a campaign</span>
                    <span className={styles.arrow}>→</span>

                  </Link>

                  <a
                    href="#campaigns"
                    onClick={scrollToCampaigns}
                    className={styles.secondaryBtn}
                  >
                    <span>Explore campaigns</span>
                  </a>
                </div>

                <div className={styles.statsStrip}>
                  <div className={styles.statItem}>
                    <strong>0%</strong>
                    <span>platform fee</span>
                  </div>
                  <div className={styles.statItem}>
                    <strong>Every</strong>
                    <span>payout reviewed before release</span>
                  </div>
                  <div className={styles.statItem}>
                    <strong>Public</strong>
                    <span>ledger on every campaign</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: photo + an illustrative ledger entry (labelled as an example). */}
            <div className="col-lg-6">
              <div className={styles.heroMediaCard}>
                <Image
                  src="/images/master_hero.jpg"
                  alt="A doctor and a community organiser reviewing a hospital invoice"
                  width={600}
                  height={400}
                  priority
                  className={styles.heroImage}
                  style={{ width: "100%", height: "auto" }}
                />
                <div className={styles.floatingMetric} aria-label="Example of a payout on a campaign's public ledger">
                  <div className={styles.metricTop}>
                    <span className={styles.exampleTag}>Example payout</span>
                    <span className={styles.paidTag}>Paid · receipt added</span>
                  </div>
                  <div className={styles.metricRow}>
                    <span>Stage 2 · Hospital theatre invoice</span>
                    <strong>$9,000</strong>
                  </div>
                  <p className={styles.metricNote}>Paid directly to the clinic. Recorded on the campaign&apos;s ledger.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
