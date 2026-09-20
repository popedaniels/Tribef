import React from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import { selectAuthStateState } from "../../../../store/slices/authSlice";
import styles from "./AudienceBenefits.module.scss";

export default function AudienceBenefits() {
  const { authenticated } = useSelector(selectAuthStateState);

  return (
    <section className={styles.section} id="benefits">
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <span className={styles.tag}>Built For Both Sides</span>
          <h2>
            Empowering <span>Donors</span> &amp; <span>Campaign Creators</span>
          </h2>
          <p>
            Whether you want to support a life-changing cause or raise money for what matters,
            Fund&amp;Trace provides the security and tools you need.
          </p>
        </div>

        <div className={styles.grid}>
          {/* Card 1: For Donors */}
          <motion.div
            className={styles.benefitCard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div>
              <div className={styles.cardTop}>
                <span className={`${styles.audienceTag} ${styles.donorTag}`}>
                  For Generous Donors
                </span>
                <h3>Give with 100% Peace of Mind</h3>
                <p>
                  Never wonder where your money went again. Gain full transparency and traceable
                  proof for every donation.
                </p>
              </div>

              <ul className={styles.featureList}>
                <li>
                  <img src="/images/icons/blueCheck.svg" alt="check" />
                  <div>
                    <strong>Track Real-Time Disbursements:</strong> View exact payout dates,
                    recipient vendors, and audited milestone proof.
                  </div>
                </li>
                <li>
                  <img src="/images/icons/blueCheck.svg" alt="check" />
                  <div>
                    <strong>Periodic Account Statements:</strong> Receive automated itemized
                    accounting reports directly in your inbox.
                  </div>
                </li>
                <li>
                  <img src="/images/icons/blueCheck.svg" alt="check" />
                  <div>
                    <strong>Zero Scam Risk:</strong> Milestone releases protect your funds from
                    being mishandled or drained prematurely.
                  </div>
                </li>
                <li>
                  <img src="/images/icons/blueCheck.svg" alt="check" />
                  <div>
                    <strong>2-Minute Secure Giving:</strong> Fast checkout with Flutterwave and
                    Stripe supporting global cards and local banks.
                  </div>
                </li>
              </ul>
            </div>

            <Link href="/Categories" passHref>
              <a className={styles.actionLink}>
                <span>Browse Verified Campaigns</span>
                <span>→</span>
              </a>
            </Link>
          </motion.div>

          {/* Card 2: For Fundraisers */}
          <motion.div
            className={styles.benefitCard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <div>
              <div className={styles.cardTop}>
                <span className={`${styles.audienceTag} ${styles.creatorTag}`}>
                  For Campaign Organizers
                </span>
                <h3>Raise More with Built-In Donor Trust</h3>
                <p>
                  Show donors you have nothing to hide. Transparent campaigns convert up to 3x more
                  hesitant supporters.
                </p>
              </div>

              <ul className={styles.featureList}>
                <li>
                  <img src="/images/icons/blueCheck.svg" alt="check" />
                  <div>
                    <strong>0% Platform Commission:</strong> Keep 100% of the funds raised without
                    hidden platform cuts.
                  </div>
                </li>
                <li>
                  <img src="/images/icons/blueCheck.svg" alt="check" />
                  <div>
                    <strong>Instant Milestone Setup:</strong> Launch your campaign in under 10
                    minutes with guided goal breakdown templates.
                  </div>
                </li>
                <li>
                  <img src="/images/icons/blueCheck.svg" alt="check" />
                  <div>
                    <strong>Multi-Currency Payouts:</strong> Withdraw in USD, GBP, or NGN straight
                    to your verified local bank account.
                  </div>
                </li>
                <li>
                  <img src="/images/icons/blueCheck.svg" alt="check" />
                  <div>
                    <strong>Virality &amp; Sharing Tools:</strong> Integrated social sharing for
                    WhatsApp, Twitter, Facebook, and Instagram.
                  </div>
                </li>
              </ul>
            </div>

            <Link href={authenticated ? "/StartACampaign" : "/SignUp"} passHref>
              <a className={styles.actionLink}>
                <span>Start Your Fundraiser Now</span>
                <span>→</span>
              </a>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
