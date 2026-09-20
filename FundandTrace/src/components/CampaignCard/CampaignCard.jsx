import Link from "next/link";
import React from "react";
import { addCommaToNumber } from "../helperFunctions/helperFunctions";
import styles from "./CampaignCard.module.scss";

export default function CampaignCard({ campaign }) {
  const amountRaised = Number(campaign?.funding?.amountRaised) || 0;
  const amountExpected = Number(campaign?.funding?.amountExpected) || 1;
  const percentage = Math.min(Math.round((amountRaised / amountExpected) * 100), 100);
  const currencySymbol =
    campaign?.funding?.currency === "USD"
      ? "$"
      : campaign?.funding?.currency === "GBP"
      ? "£"
      : campaign?.funding?.currency === "EUR"
      ? "€"
      : "₦";

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
    <Link href={`/campaign/${campaign?._id}`} passHref>
      <a className={styles.cardLink}>
        <article className={styles.container}>
          {/* Card Media Header */}
          <div className={styles.imageWrapper}>
            <img
              className={styles.cardImg}
              src={imageSrc}
              alt={campaign?.basicInformation?.campaignTitle || "Campaign"}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/images/stories/water_story.jpg";
              }}
            />
            <div className={styles.badgeOverlay}>
              <span className={styles.categoryBadge}>{category}</span>
              <span className={styles.escrowBadge}>
                <span className="live-pulse-dot" style={{ width: 6, height: 6, marginRight: 5, backgroundColor: "#ffffff" }}></span>
                Verified Escrow
              </span>
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
                  {currencySymbol}{addCommaToNumber(amountRaised)}
                </span>
                <span className={styles.percentText}>{percentage}% funded</span>
              </div>

              {/* Glowing Progress Bar */}
              <div className={styles.progressTrack}>
                <div
                  className={styles.progressBar}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>

              <div className={styles.progressFooter}>
                <span className={styles.targetAmount}>
                  Target: {currencySymbol}{addCommaToNumber(amountExpected)}
                </span>
                <span className={styles.escrowTag}>0% Platform Fee</span>
              </div>
            </div>
          </div>
        </article>
      </a>
    </Link>
  );
}
