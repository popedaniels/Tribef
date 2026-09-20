import React, { useCallback, useEffect, useState } from "react";
import DashboardLayout from "../DashboardLayout";
import styled from "styled-components";
import styles from "./contribution.module.scss";
import Link from "next/link";
import { useRouter } from "next/router";
import axios from "axios";
import ShareModal from "../../../components/composed/Modal/DefaultModal/ShareModal";
import FundingRequestsComponent from "../../../components/composed/fundingRequestComponent/FundingRequestComponent";
import UpdateComponent from "../../../components/composed/UpdatesComponent";
import { addCommaToNumber, getDaysRemaining } from "../../../components/helperFunctions/helperFunctions";
import type { Campaign } from "../../../types/campaign";

interface FundingRequestSummary {
  status?: string;
}

interface ContributionCampaign extends Campaign {
  donations?: unknown[];
}

export default function Contribution() {
  const [campaign, setCampaign] = useState<ContributionCampaign | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const router = useRouter();
  const [fundingRequests, setFundingRequests] = useState<
    FundingRequestSummary[]
  >([]);

  const getAllFundingRequests = useCallback(async () => {
    try {
      const res = await axios.get(
        process.env.NEXT_PUBLIC_API_URL +
          "/api/fundingRequests/fundingRequest/" +
          router.query.id
      );
      res && setFundingRequests(res?.data?.data);
    } catch (error) {
    }
  }, [router.query.id]);

  useEffect(() => {
    router.query && getAllFundingRequests();
  }, [router, getAllFundingRequests]);

  const getCampaign = useCallback(async () => {
    try {
      const campaign = await axios.get(
        process.env.NEXT_PUBLIC_API_URL +
          "/api/campaigns/campaign/" +
          router.query.id
      );

      campaign && setCampaign(campaign?.data?.data);
    } catch (error) {
    }
  }, [router.query.id]);

  useEffect(() => {
    router.query.id && getCampaign();
  }, [router, getCampaign]);

  const [view, setView] = useState("account-reports");
  return (
    <DashboardLayout page={campaign?.basicInformation?.campaignTitle}>
      <div className="custom mx-auto" style={{ maxWidth: 1140 }}>
        <Section className="py-5">
          <section
            className="mb-4 d-flex flex-column justify-content-center align-items-center mt-2"
            style={{
              background: "white",
              width: "100%",
              padding: "50px 25px",
            }}
          >
            <p
              className="text-blue mb-4"
              style={{ color: "var(--color-primary)", opacity: 1 }}
            >
              MEDICAL
            </p>
            <h1 className="text-heading">
              {campaign?.basicInformation?.campaignTitle}
            </h1>
            <p className="text-blue" style={{ color: "var(--color-primary)", opacity: 1 }}>
              <span className="mr-3">
                <img src="/images/icons/location.svg" alt="" />
              </span>{" "}
              {campaign?.basicInformation?.locationState},{" "}
              {campaign?.basicInformation?.locationCountry}
            </p>
            <div
              className="d-flex w-100 justify-content-between py-5  flex-column flex-md-row"
              style={{ borderBottom: "0.5px solid #B3B3B3" }}
            >
              <div style={{ width: "52%" }} className="shadow">
                <img
                  src={campaign?.basicInformation?.campaignImage}
                  width="100%"
                  height="100%"
                  alt="campaignImage"
                  style={{ objectFit: "cover" }}
                />
              </div>

              <div style={{ width: "45%" }} className="info">
                <Link href={`/donate/${campaign?._id}`} passHref>
                  <button className="btn text-white w-100">Donate</button>
                </Link>
                <button
                  className="w-100 bg-white btn my-4"
                  style={{ border: "0.7px solid var(--color-primary)" }}
                  onClick={() => setShowShareModal(true)}
                >
                  <img src="/images/icons/share.svg" width="19px" alt="" />
                  <p className="mb-0 ml-3" style={{ color: "var(--color-primary)" }}>
                    Share
                  </p>
                </button>
                <div className="d-flex align-items-center">
                  <img
                    src="/images/icons/profile.svg"
                    width={24}
                    height={24}
                   alt="" />
                  <p className="ml-4 mb-0 mr-4" style={{ fontWeight: 400 }}>
                    {campaign?.organizer}
                  </p>
                </div>
                <p className="mb-4 mt-4">
                  {campaign?.basicInformation?.campaignTagline}
                </p>
                <div className="d-flex align-items-baseline">
                  <h3 className="text-heading mr-2">
                    {campaign?.funding?.currency == "USD"
                      ? "$"
                      : campaign?.funding?.currency == "GBP"
                      ? "£"
                      : "₦"}
                    {addCommaToNumber(campaign?.funding?.amountRaised)}
                  </h3>
                  <p
                    className="mb-0"
                    style={{ fontWeight: "300", color: "#B3B3B3" }}
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
                <div className="progress mb-3">
                  <div
                    className="progress-bar "
                    role="progressbar"
                  style={{
                    width: `${
                      (Number(campaign?.funding?.amountRaised) /
                        Number(campaign?.funding?.amountExpected)) *
                      100
                    }%`,
                  }}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  ></div>
                </div>
                <div className="d-flex align-items-center">
                  <img
                    src="/images/icons/time.svg"
                    alt="time"
                    width="17.5px"
                    height="17.5px"
                    className="mr-2"
                  />
                  <p className="mb-0" style={{ color: "#807373" }}>
                    {getDaysRemaining(campaign!)} days left
                  </p>
                </div>
                <div className="d-flex align-items-center mt-3">
                  <p className="mr-3 mb-0">
                    <span style={{ fontWeight: "600", color: "#000000" }}>
                      {campaign?.donations?.length}
                    </span>{" "}
                    donors
                  </p>
                  <p className="mb-0">
                    <span style={{ fontWeight: "600", color: "#000000" }}>
                      0
                    </span>{" "}
                    shares
                  </p>
                </div>
              </div>
            </div>
            <div className="d-flex w-100">
              <div style={{ padding: "30px 0 0 0", width: "100%" }}>
                <div
                  className="w-100 d-flex mx-auto align-items-center mb-4 justify-content-md-center justify-content-between"
                  style={{ overflowX: "auto" }}
                >
                  <h5
                    className="mr-5"
                    style={{
                      fontWeight: view == "account-reports" ? 600 : 400,
                      color: view == "account-reports" ? "var(--color-primary)" : "#B3B3B3",
                      cursor: "pointer",
                      fontSize: 16,
                      minWidth: "max-content",
                    }}
                    onClick={() => setView("account-reports")}
                    role="button"
                  >
                    ACCOUNT REPORTS
                  </h5>
                  <h5
                    className="mr-5"
                    style={{
                      fontWeight: view == "story" ? 600 : 400,
                      color: view == "story" ? "var(--color-primary)" : "#B3B3B3",

                      cursor: "pointer",
                      fontSize: 16,
                    }}
                    role="button"
                    onClick={() => setView("story")}
                  >
                    STORY
                  </h5>
                  <h5
                    className="mr-5"
                    style={{
                      fontWeight: view == "updates" ? 600 : 400,
                      color: view == "updates" ? "var(--color-primary)" : "#B3B3B3",
                      cursor: "pointer",
                      fontSize: 16,
                    }}
                    onClick={() => setView("updates")}
                    role="button"
                  >
                    UPDATES
                  </h5>
                  <h5
                    style={{
                      fontWeight: view == "contact" ? 600 : 400,
                      color: view == "contact" ? "var(--color-primary)" : "#B3B3B3",
                      cursor: "pointer",
                      fontSize: 16,
                    }}
                    onClick={() => setView("contact")}
                    role="button"
                  >
                    CONTACT
                  </h5>
                </div>
                {view == "story" ? (
                  <div className={styles.story}>
                    {campaign?.content?.campaignVideo && (
                      <div style={{ position: "relative", marginBottom: 30 }}>
                        {campaign?.content?.campaignVideo?.includes(
                          "youtube.com"
                        ) ? (
                          <Iframe style={{ marginBottom: 40 }}>
                            <iframe
                              className="iframe"
                              src={campaign?.content?.campaignVideo}
                            ></iframe>
                          </Iframe>
                        ) : (
                          <video
                            src={campaign?.content?.campaignVideo}
                            aria-label="Campaign video"
                            style={{
                              width: "100%",
                              objectFit: "cover",
                              height: 450,
                            }}
                            controls
                          />
                        )}
                      </div>
                    )}
                    {campaign?.content?.story?.map((para, i) => (
                      <p
                        className="mb-4"
                        key={i}
                        style={{
                          whiteSpace: "pre-wrap",
                          color: "#514949",
                          fontWeight: 300,
                          opacity: 0.9,
                        }}
                      >
                        {para}
                      </p>
                    ))}
                  </div>
                ) : view == "updates" ? (
                  <div className={styles.story}>
                    <div>
                      {campaign?.updates?.length ? (
                        <div>
                          {campaign?.updates?.map((update, i) => (
                            <UpdateComponent key={i} update={update} />
                          ))}
                        </div>
                      ) : (
                        <div>
                          <h2 className="text-center" style={{ fontSize: 20 }}>
                            No Update yet!
                          </h2>
                        </div>
                      )}
                    </div>
                  </div>
                ) : view == "contact" ? (
                  <div className={styles.story}>CONTACTS</div>
                ) : (
                  <>
                    {fundingRequests?.length ? (
                      fundingRequests?.map(
                        (fundingRequest, i) =>
                          fundingRequest?.status == "Approved" && (
                            <FundingRequestsComponent
                              campaign={campaign}
                              key={i}
                              fundingRequest={fundingRequest}
                            />
                          )
                      )
                    ) : (
                      <div className="custom-container mx-auto mb-5 pb-2">
                        <h2 className="text-center text-heading-medium">
                          No funding Requests for this campaign yet!
                        </h2>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </section>
        </Section>
      </div>
      {
        <ShareModal
          campaign={campaign}
          showModal={showShareModal}
          onModalClose={() => setShowShareModal(false)}
        />
      }
    </DashboardLayout>
  );
}

const Iframe = styled.div`
  min-width: 100%;
  max-width: 100%;
  .iframe {
    min-width: 100%;
    max-width: 100%;
    height: 500px;
    @media screen and (max-width: 767px) {
      width: 100%;
      height: 400px;
    }
  }
`;

const Section = styled.section`
  section {
    box-shadow: -2px 4px 48px rgba(50, 50, 71, 0.05),
      2px 10px 24px rgba(50, 50, 71, 0.05);
    @media screen and (max-width: 767px) {
      padding: 50px 15px !important;
    }
    .shadow {
      @media screen and (max-width: 767px) {
        width: 100% !important;
        margin-bottom: 30px;
        height: 400px;
      }
    }
    .info {
      @media screen and (max-width: 767px) {
        width: 100% !important;
      }
    }
  }
`;
