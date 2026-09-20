import { useCallback, useEffect, useState } from "react";
import Navbar from "../../../components/Navbar/Navbar";
import styled from "styled-components";
import TopCampaignSection from "../../../components/homepageComponents/topCampaignSection/TopCampaignSection";
//import { campaigncardData } from "../../pages/index";
import Footer from "../../../components/Footer/Footer";
import ShareModal from "../../../components/composed/Modal/DefaultModal/ShareModal";
import Link from "next/link";
import { useRouter } from "next/router";

import api from "../../../utils/api";
import DonationsModal from "../../../components/composed/Modal/DefaultModal/DonationsModal";
import Layout from "../../../components/Layout";
import { CopyToClipboard } from "react-copy-to-clipboard";
import UpdateComponent from "../../../components/composed/UpdatesComponent";
import CampaignStoriesComponent from "../../../components/composed/CampaignStoriesComponent";
import ReportCampaignComponent from "../../../components/composed/ReportCampaignComponent";
import DonationComponent from "../../../components/composed/DonationComponent";
import TabNavigation from "../../../components/composed/TabNavigation";
import FloatingCampaignBar from "../../../components/composed/FloatingCampaignBar/FloatingCampaignBar";
import { Campaign } from "../../../types/campaign";
import type { Campaign as CampaignSummary } from "../../../types/campaigns";
import { useAppDispatch } from "./../../../../store/hooks";
import {
  addCommaToNumber,
  getCurrency,
  getDualCurrencyEstimate,
  getDaysRemaining,
} from "../../../components/helperFunctions/helperFunctions";
import { GetServerSidePropsContext } from "next";

type CampaignWithDonations = Campaign & { donations?: unknown[] };

interface CampaignPageProps {
  campaign: CampaignWithDonations | null;
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const campaignId = context.query.id;
  try {
    const campaigndata = await api.get(
      `/api/campaigns/campaign/${campaignId}`
    );
    return { props: { campaign: campaigndata?.data?.data || null } };
  } catch (error) {
    return { props: { campaign: null } };
  }
}

export default function CampaignPage({ campaign }: CampaignPageProps) {
  const [view, setView] = useState("story");
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const getAllCampaigns = useCallback(async () => {
    try {
      const res = await api.get("/api/campaigns");
      const filteredCampaigns = res?.data?.data?.filter(
        (c: CampaignSummary) => c._id != router.query.id
      );
      setCampaigns(filteredCampaigns);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  }, [router.query.id]);

  useEffect(() => {
    router.query.id && getAllCampaigns();
  }, [router, getAllCampaigns]);

  if (!campaign) {
    return (
      <Layout title="Campaign unavailable" description="This campaign could not be loaded.">
        <div
          className="custom-container text-center"
          style={{ padding: "140px 0", minHeight: "60vh" }}
        >
          <h1 className="text-big mb-3">Campaign unavailable</h1>
          <p className="mb-4">
            We couldn't load this campaign right now. Please check back shortly.
          </p>
          <Link href="/" passHref>
            <a className="btn-brand-primary">Back to Home</a>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title={`${campaign?.basicInformation?.campaignTitle}`}
      description={`${campaign?.content?.story?.[0]?.substring(0, 110) || ""}`}
      ogImage={`${campaign?.basicInformation?.campaignImage}`}
    >
      {/* {preloader && <Preloader />} */}
      <Main
        className="mb-4 d-flex flex-column"
        style={{
          width: "100%",
        }}
      >
        <section style={{ background: "#f9f9f9" }}>
          <Navbar />

          <section className="Top mx-auto d-flex flex-column align-items-center custom-container pt-3 mt-5">
            <p
              className="text-blue pt-5 mb-0 text-capitalize"
              style={{ color: "var(--color-primary)", opacity: 1 }}
            >
              {campaign?.category}
            </p>
            <h1 className="text-heading">
              {campaign?.basicInformation?.campaignTitle}
            </h1>
            <p
              className="text-blue mb-0"
              style={{ color: "var(--color-primary)", opacity: 1 }}
            >
              <span className="mr-3">
                <img src="/images/icons/location.svg" alt="" />
              </span>
              {campaign?.basicInformation?.locationState},{" "}
              {campaign?.basicInformation?.locationCountry}
            </p>
            <section className="d-flex flex-column flex-md-row w-100 justify-content-between pt-3 pb-5 py-md-5">
              <article className="img-div position-relative">
                <img
                  src={campaign?.basicInformation?.campaignImage}
                  width="100%"
                  height="100%"
                  alt="locationIcon"
                  style={{ objectFit: "cover" }}
                />

                <CopyToClipboard
                  text={`https://fundandtrace.com/campaign/${
                    campaign?._id
                  }?title=${(
                    campaign?.basicInformation?.campaignTitle || ""
                  )
                    .split(" ")
                    .join("%")}`}
                  onCopy={() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 4000);
                  }}
                >
                  <div
                    className="position-absolute bg-white truncate px-2 py-1"
                    style={{
                      bottom: "10px",
                      right: "10px",
                      maxWidth: "300px",
                      cursor: "pointer",
                      borderRadius: "4px",
                    }}
                  >
                    {copied ? (
                      <p className="text-info mb-0 px-2">Link Copied</p>
                    ) : (
                      <div className="truncate overflow-hidden d-flex align-items-center">
                        <img
                          src="/images/icons/link.png"
                          alt="link icon"
                          width="20px"
                          height="20px"
                          className="mr-2"
                        />
                        {`https://fundandtrace.com/${campaign?._id}`}
                      </div>
                    )}
                  </div>
                </CopyToClipboard>
              </article>

              <article className="progressDiv">
                <Link href={`/donate/${campaign?._id}`} passHref>
                  <a style={{ textDecoration: "none", width: "100%", display: "block" }}>
                    <button className="btn-brand-primary w-100" style={{ height: "46px", fontSize: "16px", fontWeight: 700 }}>
                      Donate Now
                    </button>
                  </a>
                </Link>
                <div className="d-flex align-items-center w-100 justify-content-between my-3">
                  <Link href={`/campaign/${campaign?._id}/tracker`} passHref>
                    <a style={{ width: "48%", textDecoration: "none" }}>
                      <button
                        className="btn-secondary-action w-100"
                        style={{ height: "44px", color: "#FFFFFF" }}
                      >
                        <img
                          src="/images/icons/trackIcon.svg"
                          width="18px"
                          height="18px"
                          alt="trackingIcon"
                          className="mr-2"
                          style={{ filter: "brightness(0) invert(1)" }}
                        />
                        <span style={{ color: "#FFFFFF", fontWeight: 700, fontSize: "15px" }}>Track</span>
                      </button>
                    </a>
                  </Link>
                  <button
                    className="btn-secondary-action"
                    style={{ width: "48%", height: "44px", color: "#FFFFFF" }}
                    onClick={() => setShowShareModal(true)}
                  >
                    <img
                      src="/images/icons/share.svg"
                      width="18px"
                      height="18px"
                      alt="shareicon"
                      className="mr-2"
                      style={{ filter: "brightness(0) invert(1)" }}
                    />
                    <span style={{ color: "#FFFFFF", fontWeight: 700, fontSize: "15px" }}>Share</span>
                  </button>
                </div>
                <div className="d-flex align-items-center">
                  <img
                    src="/images/icons/profile.svg"
                    width={24}
                    height={24}
                    alt="profileIcon"
                  />
                  <Link
                    href={`/campaign-organizers/${campaign?.organizerId}`}
                    passHref
                  >
                    <a
                      className="ml-3 mb-0"
                      style={{
                        fontWeight: 400,
                        textDecoration: "underline",
                        textDecorationColor: "black",
                        color: "black",
                      }}
                    >
                      {campaign?.organizer}
                    </a>
                  </Link>
                </div>
                <p
                  className="mb-4 mt-4"
                  style={{
                    fontWeight: 300,
                    fontSize: 16,
                  }}
                >
                  {campaign?.basicInformation?.campaignTagline}
                </p>
                <div className="d-flex align-items-baseline flex-wrap">
                  <h3 className="text-heading mr-2 mb-1">
                    {getCurrency(campaign?.funding?.currency)}
                    {addCommaToNumber(campaign?.funding?.amountRaised)}
                  </h3>
                  <p className="mb-1" style={{ fontWeight: "400", color: "#64748B" }}>
                    raised of {getCurrency(campaign?.funding?.currency)}
                    {addCommaToNumber(campaign?.funding?.amountExpected)}
                  </p>
                </div>

                {/* Location-based Cross-Border Dual Currency Preview */}
                {(() => {
                  const targetCurr = campaign?.funding?.currency === "NGN" ? "GBP" : campaign?.funding?.currency === "GBP" ? "NGN" : "USD";
                  const dualGoal = getDualCurrencyEstimate(campaign?.funding?.amountExpected, campaign?.funding?.currency, targetCurr);
                  return dualGoal ? (
                    <div className="mb-2 d-flex align-items-center" style={{ fontSize: "13px", color: "#475569" }}>
                      <span className="mr-1">🌍 Approx.</span>
                      <strong>{dualGoal.symbol}{dualGoal.amount} {dualGoal.currency}</strong>
                      <span className="ml-1 text-muted">target in international funding</span>
                    </div>
                  ) : null;
                })()}

                {/* Location-Aware Trust Verification Badge */}
                <div className="mb-3">
                  {campaign?.basicInformation?.locationCountry === "United Kingdom" ? (
                    <span className="badge badge-pill badge-primary py-1 px-2" style={{ background: "#EEF2FF", color: "#4F46E5", border: "1px solid #C7D2FE", fontSize: "11.5px", fontWeight: 600 }}>
                      🛡️ UK Charity Commission Registered
                    </span>
                  ) : (
                    <span className="badge badge-pill badge-success py-1 px-2" style={{ background: "#ECFDF5", color: "#059669", border: "1px solid #A7F3D0", fontSize: "11.5px", fontWeight: 600 }}>
                      🛡️ 100% Escrow Verified (Direct-to-Vendor Routing)
                    </span>
                  )}
                </div>

                <div className="progress mb-3">
                  <div
                    className="progress-bar "
                    role="progressbar"
                    style={{
                      width: `${
                        (campaign?.funding?.amountRaised /
                          campaign?.funding?.amountExpected) *
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
                    {getDaysRemaining(campaign)} days left
                  </p>
                </div>
                <div className="d-flex align-items-center mt-3">
                  <p
                    className="mr-3 mb-0"
                    style={{
                      fontWeight: "300",

                      opacity: 0.9,
                    }}
                  >
                    <span style={{ fontWeight: "600", color: "#000000" }}>
                      {campaign?.donations?.length}
                    </span>{" "}
                    donors
                  </p>
                  <p
                    className="mb-0"
                    style={{
                      fontWeight: "300",

                      opacity: 0.9,
                    }}
                  >
                    <span style={{ fontWeight: "600", color: "#000000" }}>
                      0
                    </span>{" "}
                    shares
                  </p>
                </div>
              </article>
            </section>
          </section>
        </section>
        <section className="bg-white w-100">
          <section
            id="bottom"
            className="d-flex flex-column flex-md-row bottom justify-content-between mx-auto custom-container"
          >
            <div className="w-100 stories">
              <TabNavigation view={view} setView={(view: string) => setView(view)} />

              {view == "story" ? (
                <CampaignStoriesComponent campaign={campaign} />
              ) : view == "updates" ? (
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
              ) : view == "live" ? (
                <div>NO LIVE</div>
              ) : view == "contact" ? (
                <div>CONTACTS</div>
              ) : (
                <ReportCampaignComponent submitted={() => setView("story")} />
              )}
            </div>
            <div className="mb-4 mb-md-0 donors">
              <div>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <p className="mb-0" style={{ fontWeight: 400 }}>
                    DONORS
                  </p>
                  {(campaign?.donations?.length ?? 0) > 4 && (
                    <p
                      className="text-blue mb-0"
                      style={{ cursor: "pointer" }}
                      onClick={() => setShowDonationModal(true)}
                      role="button"
                    >
                      See All +
                    </p>
                  )}
                </div>
                {campaign?.donations?.length ? (
                  campaign?.donations
                    .slice(0, 4)
                    .map((donation, i) => (
                      <DonationComponent
                        index={i}
                        key={i}
                        campaign={campaign}
                        donation={donation}
                      />
                    ))
                ) : (
                  <h2 className="text-medium-heading">No Donations Yet!</h2>
                )}

                <div className="mt-5 d-none d-md-block">
                  <Link href={`/donate/${campaign?._id}`} passHref>
                    <a>
                      <button
                        className="btn text-white w-100 bg-bg"
                        style={{ background: "var(--color-primary)", height: 50 }}
                      >
                        Donate Now
                      </button>
                    </a>
                  </Link>
                </div>
              </div>
            </div>
          </section>
          {view != "report" && (
            <article
              className="d-flex d-md-none custom-container align-items-center justify-content-between bg-white py-3"
              style={{
                position: "sticky",
                bottom: 0,
                height: "100%",
                zIndex: 100,
                width: "100%",
              }}
            >
              <Link href={`/donate/${campaign?._id}`} passHref>
                <button
                  className="btn text-white"
                  style={{
                    width: "46%",
                    height: 50,
                    background: "var(--color-primary)",
                  }}
                >
                  Donate
                </button>
              </Link>
              <button
                className="btn-secondary-action"
                style={{
                  width: "46%",
                  height: 50,
                  color: "#ffffff",
                }}
                onClick={() => setShowShareModal(true)}
              >
                <img
                  src="/images/icons/share.svg"
                  width="18px"
                  height="18px"
                  alt="shareicon"
                  className="mr-2"
                  style={{ filter: "brightness(0) invert(1)" }}
                />
                <span style={{ color: "#ffffff", fontWeight: 700, fontSize: "15px" }}>
                  Share
                </span>
              </button>
            </article>
          )}
          {view != "report" && (
            <div
              className="custom-container mt-4"
              style={{ textDecoration: "underline" }}
            >
              <Link href="#bottom" passHref>
                <button
                  style={{
                    outline: "none",
                    border: "none",
                    background: "transparent",
                    fontSize: 16,
                    fontWeight: 300,
                  }}
                  className="d-flex align-items-center"
                  onClick={() => setView("report")}
                >
                  <img
                    src="/images/icons/report.svg"
                    alt="report icon"
                    width="18px"
                    height="19px"
                    className="mr-3"
                  />
                  Report Campaign
                </button>
              </Link>
            </div>
          )}
        </section>
        <div style={{ marginTop: 144 }}>
          <TopCampaignSection
            title="Donate"
            heading="You may also be interested in"
            data={campaigns}
            loading={loading}
          />
        </div>
        <Footer />
      </Main>
      {
        <ShareModal
          campaign={campaign}
          showModal={showShareModal}
          onModalClose={() => setShowShareModal(false)}
        />
      }
      <DonationsModal
        donations={campaign?.donations}
        campaignId={campaign?._id}
        showModal={showDonationModal}
        onModalClose={() => setShowDonationModal(false)}
        campaign={campaign}
      />
      <FloatingCampaignBar campaign={campaign} />
    </Layout>
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

const Main = styled.main`
  .progress {
    height: 5px !important;
    background-color: #697af821 !important;
  }
  .progressbar {
    background-color: var(--color-primary) !important;
  }
  .Top {
    width: 100%;
    max-width: 1400px;
    @media screen and (max-width: 767px) {
      max-width: 540px;
      margin-right: auto;
      margin-left: auto;
    }
    @media screen and (max-width: 1023px) {
      width: 100%;
      border-bottom: none;
    }
    .img-div {
      background: black;
      width: 60%;
      height: 400px;

      @media screen and (min-width: 768px) and (max-width: 1023px) {
        max-width: 55%;
      }
      @media screen and (max-width: 767px) {
        width: 100%;

        height: 378px;
        margin-bottom: 30px;
      }
    }
    .progressDiv {
      width: 36%;
      @media screen and (min-width: 768px) and (max-width: 1023px) {
        width: 42%;
      }
      button {
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        padding: 15px 30px;
        background: var(--color-primary);
        box-shadow: 0px 2px 4px rgba(50, 50, 71, 0.06),
          0px 2px 2px rgba(50, 50, 71, 0.06);
        border-radius: 4px;

        font-style: normal;
        font-weight: normal;
        font-size: 16px;
        line-height: 24px;
        /* identical to box height, or 150% */

        color: #ffffff;
        &:hover {
          box-shadow: 0px 12px 12px rgba(50, 50, 71, 0.08),
            0px 16px 24px rgba(50, 50, 71, 0.08) !important;
        }
      }
      @media screen and (max-width: 767px) {
        width: 100%;
      }
    }
  }
  .bottom {
    width: 100%;
    max-width: 1400px;
    @media screen and (max-width: 767px) {
      max-width: 540px;
      margin-right: auto;
      margin-left: auto;
    }
    @media screen and (max-width: 1023px) {
      width: 100%;
    }
    .stories {
      max-width: 60%;
      padding: 30px 0 0 0;
      @media screen and (min-width: 768px) and (max-width: 1023px) {
        max-width: 55%;
        padding: 30px 0 !important;
      }
      @media screen and (max-width: 767px) {
        order: 10;
        padding: 30px 0 !important;
        border-right: none;
        width: 100%;
        max-width: 100%;
      }
    }
    .donors {
      width: 36%;
      position: sticky;
      top: 100px;
      height: 100%;
      padding: 30px;
      box-shadow: 0px 12px 12px rgba(50, 50, 71, 0.08),
        0px 16px 24px rgba(50, 50, 71, 0.08);
      @media screen and (min-width: 768px) and (max-width: 1023px) {
        width: 42%;
      }
      @media screen and (max-width: 767px) {
        border-left: none !important;
        padding: 30px 0 !important;
        position: static;
        width: 100%;
        height: auto;
        box-shadow: none;
        order: 1;
      }
    }
  }
`;
