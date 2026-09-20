import React, { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./FloatingCampaignBar.module.scss";
import { addCommaToNumber, getCurrency } from "../../helperFunctions/helperFunctions";

export default function FloatingCampaignBar({ campaign }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 450) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!campaign) return null;

  const raised = campaign?.funding?.amountRaised || 0;
  const expected = campaign?.funding?.amountExpected || 1;
  const percent = Math.min(Math.round((raised / expected) * 100), 100);
  const currency = getCurrency(campaign?.funding?.currency);

  return (
    <aside
      className={[
        styles.floatingBar,
        visible ? styles.barVisible : styles.barHidden,
      ].join(" ")}
      aria-label="Quick campaign actions"
    >
      <div className={styles.container}>
        {/* Left: Thumbnail & Info */}
        <div className={styles.campaignMeta}>
          {campaign?.basicInformation?.campaignImage && (
            <img
              src={campaign.basicInformation.campaignImage}
              alt=""
              className={styles.thumb}
            />
          )}
          <div className={styles.infoCol}>
            <div className={styles.badgeRow}>
              <span className="badge-escrow-verified">
                <span className="live-pulse-dot" /> Verified Escrow
              </span>
              <span className={styles.percentText}>{percent}% funded</span>
            </div>
            <h4 className={styles.title}>
              {campaign?.basicInformation?.campaignTitle}
            </h4>
          </div>
        </div>

        {/* Center: Financial Metric */}
        <div className={styles.progressSection}>
          <div className={styles.amountRow}>
            <strong>
              {currency}
              {addCommaToNumber(raised)}
            </strong>
            <span>
              of {currency}
              {addCommaToNumber(expected)}
            </span>
          </div>
          <div className={styles.barTrack}>
            <div className={styles.barFill} style={{ width: `${percent}%` }} />
          </div>
        </div>

        {/* Right: Actions */}
        <div className={styles.actionButtons}>
          <Link href={`/campaign/${campaign?._id}/tracker`} passHref>
            <a className={styles.trackBtn}>
              <img
                src="/images/icons/trackIcon.svg"
                width={16}
                height={16}
                alt=""
                style={{ filter: "brightness(0) invert(1)" }}
              />
              <span>Track</span>
            </a>
          </Link>
          <Link href={`/donate/${campaign?._id}`} passHref>
            <a className={styles.donateBtn}>Donate Now</a>
          </Link>
        </div>
      </div>
    </aside>
  );
}
