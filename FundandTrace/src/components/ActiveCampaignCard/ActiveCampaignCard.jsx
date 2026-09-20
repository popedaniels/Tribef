import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect } from "react";
import { addCommaToNumber, getDaysRemaining } from "../helperFunctions/helperFunctions";
import styles from "./ActiveCampaignCard.module.scss";

export default function ActiveCampaignCard({ campaign }) {
  const amountRaised = Number(campaign?.funding?.amountRaised) || 0;
  const amountExpected = Number(campaign?.funding?.amountExpected) || 0;
  const progressString = amountExpected
    ? Math.min((amountRaised / amountExpected) * 100, 100).toString()
    : "0";

  const router = useRouter();

  return (
    <Link href={`/dashboard/${campaign?._id}/`} style={{ textDecoration: "none" }}>
        <div
          className={[styles.container, "bento-elevation-card d-flex w-100 flex-column"].join(" ")}
        >
          <div className="position-relative">
            <Image
              className={styles.card_img}
              src={campaign?.basicInformation?.campaignImage || "/images/stories/medical_hope.jpg"}
              alt="campaign"
              width={400}
              height={200}
              style={{ objectFit: "cover", width: "100%", height: "200px" }}
              unoptimized={!!campaign?.basicInformation?.campaignImage && !campaign?.basicInformation?.campaignImage.startsWith("/") && !campaign?.basicInformation?.campaignImage.includes("res.cloudinary.com")}
            />
            <div className="position-absolute" style={{ top: 12, right: 12 }}>
              <span className="badge-live-status">
                <span className="live-pulse-dot"></span>
                Active Escrow
              </span>
            </div>
          </div>
          <div className="px-3 py-4">
            <div className="d-flex align-items-center">
              <img
                src="/images/icons/location.svg"
                alt="location-icon"
                width="13px"
                height="16px"
                className="mr-2"
              />
              <h3 className="text-blue mb-0 text-truncate">
                {campaign?.basicInformation?.locationState},{" "}
                {campaign?.basicInformation?.locationCountry}
              </h3>
            </div>
            <div className="mt-3">
              <h3 className="text-medium-heading mb-3 text-truncate">
                {campaign?.basicInformation?.campaignTitle}
              </h3>

              <div className="d-flex align-items-baseline">
                <h3 className="text-heading mr-2 mb-0" style={{ fontSize: 14 }}>
                  {campaign?.funding?.currency == "USD"
                    ? "$"
                    : campaign?.funding?.currency == "GBP"
                    ? "£"
                    : "₦"}
                  {addCommaToNumber(campaign?.funding?.amountRaised)}
                </h3>
                <p
                  className="mb-0"
                  style={{
                    fontWeight: "400",
                    color: "rgba(0,0,0,0.6)",
                    fontSize: 13,
                  }}
                >
                  raised of{" "}
                  {campaign?.funding?.currency == "USD"
                    ? "$"
                    : campaign?.funding?.currency == "GBP"
                    ? "£"
                    : "₦"}
                  {addCommaToNumber(campaign?.funding?.amountExpected)}
                </p>
              </div>
              <div className={["progress mb-2", styles.progress].join(" ")}>
                <div
                  className={[styles.progressbar, "progress-bar "].join(" ")}
                  role="progressbar"
                  style={{ width: progressString + "%" }}
                  aria-valuenow={progressString}
                  aria-valuemin="0"
                  aria-valuemax="100"
                ></div>
              </div>
              <div className="d-flex align-items-center mb-4">
                <img
                  src="/images/icons/time.svg"
                  alt="time"
                  width="17.5px"
                  height="17.5px"
                  className="mr-2"
                />
                <p className="mb-0" style={{ color: "#807373" }}>
                  {getDaysRemaining(campaign)} days left
                </p>
              </div>
              <div className="d-flex align-items-center">
                <div
                  className="d-flex align-items-center mr-3"
                  role="button"
                  onClick={(e) => {
                    e.preventDefault();
                    localStorage.setItem("campaignId", campaign?._id);
                    router.push(`/StartACampaign/BasicInformation`);
                  }}
                >
                  <img
                    src="/images/icons/editBlue.svg"
                    alt="time"
                    width="17.5px"
                    height="17.5px"
                    className="mr-2"
                  />
                  <p className="mb-0" style={{ color: "var(--color-primary)" }}>
                    Edit
                  </p>
                </div>
                <div
                  className="d-flex align-items-center"
                  role="button"
                  onClick={(e) => {
                    e.preventDefault();
                    router.push(`/campaign/${campaign?._id}`);
                  }}
                >
                  <span className="mb-0" style={{ color: "var(--color-primary)" }}>
                    See Campaign
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
    </Link>
  );
}
