import { cdnImage, responsiveImage } from "../../utils/cloudinary";
import Link from "next/link";
import React from "react";
import { formatMoney } from "../helperFunctions/helperFunctions";
import styles from "./CampaignCard.module.scss";

export default function CampaignCard({ campaign }) {
  const amountRaised = Number(campaign?.funding?.amountRaised) || 0;
  const amountExpected = Number(campaign?.funding?.amountExpected) || 0;
  const percentage = amountExpected > 0 ? Math.min(Math.round((amountRaised / amountExpected) * 100), 100) : 0;
  const currency = campaign?.funding?.currency;
  const frozen = Boolean(campaign?.disputeGovernance?.isLocked);

  const imageSrc =
    campaign?.basicInformation?.campaignImage ||
    campaign?.campaignImage ||
    "/images/stories/water_story.jpg";

  const locationText =
    campaign?.basicInformation?.locationState && campaign?.basicInformation?.locationCountry
      ? `${campaign.basicInformation.locationState}, ${campaign.basicInformation.locationCountry}`
      : campaign?.basicInformation?.locationCountry || "Global Community";

  const category = campaign?.category || campaign?.basicInformation?.category || "Cause";

  return (
    <Link href={`/campaign/${campaign?._id}`} passHref className={styles.cardLink}>

      <article className={styles.container}>
        {/* Card Media Header */}
        <div className={styles.imageWrapper}>
          <img
            className={styles.cardImg}
            src={cdnImage(imageSrc, 640)}
            {...responsiveImage(imageSrc, [360, 480, 640, 960], "(max-width: 600px) 92vw, (max-width: 1100px) 45vw, 360px")}
            loading="lazy"
            decoding="async"
            width={640}
            height={427}
            alt={campaign?.basicInformation?.campaignTitle || "Campaign"}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/images/stories/water_story.jpg";
            }}
          />
          <div className={styles.badgeOverlay}>
            <span className={styles.categoryBadge}>{category}</span>
            {frozen ? (
              <span className={`${styles.escrowBadge} ${styles.pausedBadge}`}>Paused for review</span>
            ) : (
              <span className={styles.escrowBadge}>Held in escrow</span>
            )}
          </div>
        </div>

        {/* Card Content Body */}
        <div className={styles.body}>
          {/* Location & Time */}
          <div className={styles.metaRow}>
            <span className={styles.location}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              {locationText}
            </span>
          </div>

          {/* Campaign Title & Tagline */}
          <h3 className={styles.title}>
            {campaign?.basicInformation?.campaignTitle || "Empowering Community Growth"}
          </h3>
          <p className={styles.story}>
            {campaign?.basicInformation?.campaignTagline || "Supporting milestone-verified local development with transparent disbursements."}
          </p>

          {/* Funding Progress Metric */}
          <div className={styles.fundingSection}>
            <div className={styles.progressHeader}>
              <span className={styles.amountRaised}>
                {formatMoney(amountRaised, currency)}
              </span>
              <span className={styles.percentText}>{percentage}% funded</span>
            </div>

            <div className="ft-progress" role="progressbar" aria-label="Funding progress" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}>
              <span style={{ width: `${percentage}%` }} />
            </div>

            <div className={styles.progressFooter}>
              <span className={styles.targetAmount}>
                of {formatMoney(amountExpected, currency)}
              </span>
              <span className={styles.escrowTag}>0% platform fee</span>
            </div>
          </div>
        </div>
      </article>

    </Link>
  );
}
