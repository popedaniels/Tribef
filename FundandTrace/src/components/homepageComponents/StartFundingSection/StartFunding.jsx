import React from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import Liquid from "../../canvasui/Liquid";
import { selectAuthStateState } from "../../../../store/slices/authSlice";
import styles from "./StartFunding.module.scss";

export default function StartFunding() {
  const { authenticated } = useSelector(selectAuthStateState);

  return (
    <section className={styles.container} id="start-funding">
      <Liquid
        simResolution={128}
        dyeResolution={384}
        densityDissipation={0.96}
        velocityDissipation={1}
        pressure={0.8}
        pressureIterations={4}
        curl={1.9}
        radius={0.3}
        force={1.1}
        intensity={1.2}
        distortion={0.3}
        blend={4}
        color={[0.412, 0.475, 0.973]}
        rainbow={false}
      >
      <div className={styles.contentWrapper}>
        <span className={styles.tag}>Zero Fees • Total Trust • Global Impact</span>
        <h2>
          Ready to Start a <span>Transparent Fundraiser?</span>
        </h2>
        <p>
          Join thousands of changemakers and donors who believe giving should be open, honest, and
          100% accountable. Setup takes less than 10 minutes.
        </p>

        <div className={styles.ctaRow}>
          <Link href={authenticated ? "/StartACampaign" : "/SignUp"} passHref>
            <a className={styles.primaryBtn}>
              <span>Start a Campaign (0% Fee)</span>
              <span>→</span>
            </a>
          </Link>

          <Link href="/Categories" passHref>
            <a className={styles.secondaryBtn}>
              <span>Discover Verified Causes</span>
            </a>
          </Link>
        </div>
        </div>
      </Liquid>
    </section>
  );
}
