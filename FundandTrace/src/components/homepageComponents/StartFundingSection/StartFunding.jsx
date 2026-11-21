import React from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { selectAuthStateState } from "../../../../store/slices/authSlice";
import styles from "./StartFunding.module.scss";

export default function StartFunding() {
  const { authenticated } = useSelector(selectAuthStateState);

  return (
    <section className={styles.container} id="start-funding">

      <div className={styles.contentWrapper}>
        <span className={styles.tag}>No platform fee · Escrow · Public ledger</span>
        <h2>
          Raise money people <span>can trust</span>
        </h2>
        <p>
          Starting a campaign is free. Your donors see exactly how their money is used, and that&apos;s what makes
          them give, and give again.
        </p>

        <div className={styles.ctaRow}>
          <Link
            href={authenticated ? "/StartACampaign" : "/SignUp"}
            passHref
            className={styles.primaryBtn}>

            <span>Start a campaign</span>
            <span>→</span>

          </Link>

          <Link href="/Categories" passHref className={styles.secondaryBtn}>

            <span>Explore campaigns</span>

          </Link>
        </div>
        </div>
    </section>
  );
}
