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
          <span className={styles.tag}>For donors and organisers</span>
          <h2>
            Trust that works <span>both ways</span>
          </h2>
          <p>
            Donors can see where their money goes. Organisers get a simple way to prove they&apos;re
            spending it well.
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
                  For donors
                </span>
                <h3>Know where your money went</h3>
                <p>
                  Every campaign has a tracker showing each payout, who was paid and the receipt behind it.
                </p>
              </div>

              <ul className={styles.featureList}>
                <li>
                  <img src="/images/icons/blueCheck.svg" alt="" />
                  <div>
                    <strong>See every payout:</strong> date, amount, who was paid, what it was for and the
                    receipt.
                  </div>
                </li>
                <li>
                  <img src="/images/icons/blueCheck.svg" alt="" />
                  <div>
                    <strong>Get email updates:</strong> choose to hear from us whenever money is paid out from
                    a campaign you supported.
                  </div>
                </li>
                <li>
                  <img src="/images/icons/blueCheck.svg" alt="" />
                  <div>
                    <strong>Protection if something&apos;s wrong:</strong> report a campaign to freeze payouts
                    while we review it, or refund your own donation within 30 days while it&apos;s in escrow.
                  </div>
                </li>
                <li>
                  <img src="/images/icons/blueCheck.svg" alt="" />
                  <div>
                    <strong>Pay your way:</strong> card, bank transfer, USSD or mobile money through Stripe,
                    Paystack and Flutterwave.
                  </div>
                </li>
              </ul>
            </div>

            <Link href="/Categories" passHref className={styles.actionLink}>

              <span>Browse campaigns</span>
              <span>→</span>

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
                  For organisers
                </span>
                <h3>Show donors you&apos;re accountable</h3>
                <p>
                  Your Transparency Score and public ledger answer the question every donor asks: where does
                  the money go?
                </p>
              </div>

              <ul className={styles.featureList}>
                <li>
                  <img src="/images/icons/blueCheck.svg" alt="" />
                  <div>
                    <strong>No platform fee:</strong> we don&apos;t take a cut of what you raise. Payment
                    processing fees still apply.
                  </div>
                </li>
                <li>
                  <img src="/images/icons/blueCheck.svg" alt="" />
                  <div>
                    <strong>Simple setup:</strong> a guided form for your story, goal, team and payout
                    details.
                  </div>
                </li>
                <li>
                  <img src="/images/icons/blueCheck.svg" alt="" />
                  <div>
                    <strong>Paid where you are:</strong> Stripe in the UK and US, and bank transfers in
                    Nigeria, Ghana, Kenya, South Africa and more. Or pay suppliers directly.
                  </div>
                </li>
                <li>
                  <img src="/images/icons/blueCheck.svg" alt="" />
                  <div>
                    <strong>Easy sharing:</strong> one tap to WhatsApp, X, Facebook or a copied link, with
                    referral tracking.
                  </div>
                </li>
              </ul>
            </div>

            <Link
              href={authenticated ? "/StartACampaign" : "/SignUp"}
              passHref
              className={styles.actionLink}>

              <span>Start a campaign</span>
              <span>→</span>

            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
