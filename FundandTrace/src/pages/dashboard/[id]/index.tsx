import React, { useEffect, useState } from "react";
import CampaignDashboardLayout from "./campaignDashboardLayout";
import styled from "styled-components";
import Link from "next/link";
import router, { useRouter } from "next/router";
import type { GetServerSidePropsContext } from "next";
import axios from "axios";
import Spinner from "../../../components/composed/spinner/Spinner";
import ShareModal from "../../../components/composed/Modal/DefaultModal/ShareModal";
import DonationsModal from "../../../components/composed/Modal/DefaultModal/DonationsModal";
import UpdateComponent from "../../../components/composed/UpdatesComponent";

import { toast } from "../../../../store/slices/ToastSlice";
import {
  addCommaToNumber,
  getCurrency,
  getDaysRemaining,
  getTimeDiff,
  grabErrorMessage,
  grabErrorStatus,
} from "../../../components/helperFunctions/helperFunctions";
import { logout } from "../../../../store/slices/authSlice";
import { useAppDispatch } from "./../../../../store/hooks";
import type { Campaign } from "../../../types/campaign";

interface Donation {
  anonymous?: boolean;
  donorName: string;
  amount: number;
  createdAt: string | Date;
}

interface DashboardCampaign extends Campaign {
  donations?: Donation[];
}

interface DashboardProps {
  campaign: DashboardCampaign | null;
  campaignId: GetServerSidePropsContext["query"]["id"];
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const campaignId = context.query.id;
  try {
    const campaigndata = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/api/campaigns/campaign/${campaignId}`,
      { timeout: 3000 }
    );
    const campaign = campaigndata?.data?.data;
    return {
      props: { campaign: campaign || null, campaignId },
    };
  } catch {
    return { props: { campaign: null, campaignId } };
  }
}

export default function Dashboard({ campaign, campaignId }: DashboardProps) {
  const [view, setView] = useState("story");
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updateText, setUpdateText] = useState("");
  const dispatch = useAppDispatch();
  const [updates, setUpdates] = useState(campaign?.updates);

  useEffect(() => {
    campaign && setLoading(false);
  }, [campaign]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const updateData = {
      story: updateText,
      addedBy: campaign?.organizer,
    };
    try {
      const update = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/campaigns/campaign/addUpdate/${campaignId}`,
        { update: updateData },
        { withCredentials: true }
      );
      update && dispatch(toast(true, "Update added!", "success"));
      update && setUpdateText("");
      update && reloadUpdates();
    } catch (error) {
      dispatch(
        toast(
          true,
          grabErrorMessage(error) || "Unable to add the update. Please try again.",
          "error"
        )
      );
      if (grabErrorStatus(error) == 403) {
        dispatch(logout());
      }
    }
  };

  const reloadUpdates = async () => {
    try {
      const campaignData = await axios.get(
        process.env.NEXT_PUBLIC_API_URL +
          "/api/campaigns/campaign/" +
          campaignId,
        { withCredentials: true }
      );
      campaignData && setUpdates(campaignData?.data?.data?.updates);
    } catch (error) {
      dispatch(
        toast(
          true,
          grabErrorMessage(error) || "Unable to refresh campaign updates.",
          "error"
        )
      );
      if (grabErrorStatus(error) === 403) {
        dispatch(logout());
      }
    }
  };

  return (
    <CampaignDashboardLayout
      active={1}
      campaignId={campaignId}
      title={campaign?.basicInformation?.campaignTitle}
      page="dashboard"
    >
      {loading ? (
        <div className="d-flex align-items-center justify-content-center my-4">
          <Spinner type="Oval" width={25} height={25} color={"var(--color-primary)"} />
        </div>
      ) : (
        <Wrapper className="mx-auto" style={{ maxWidth: 1140 }}>
          <div className="custom pb-5">
            <h2 className="text-heading mb-5 mt-4" style={{ color: "var(--color-primary)" }}>
              YOUR CAMPAIGN IS LIVE!
            </h2>
            <div className="d-flex flex-column flex-md-row justify-content-between mb-4">
              <div
                className="bg-white left position-sticky"
                style={{
                  height: "max-content",
                  top: 10,
                  boxShadow:
                    "-2px 4px 48px rgba(50, 50, 71, 0.05), 2px 10px 24px rgba(50, 50, 71, 0.05)",
                }}
              >
                <h2 className="text-medium-heading mb-3">Post An Update</h2>
                <p className="mb-3">
                  Any update is an opportunity for potential donors to inform
                  and participate. On your campaign page, posts will appear.
                </p>
                <form onSubmit={handleSubmit} className="mb-0">
                  <textarea
                    name="update"
                    id="update"
                    className="mb-2"
                    value={updateText}
                    onChange={(e) => setUpdateText(e.target.value)}
                  ></textarea>
                  <button className="btn ml-auto text-white">Post</button>
                </form>
                {/* <h2 className="text-medium-heading mb-3">Performance</h2>
                <p className="mb-4">
                  Track donations to your campaign with Google Analytics at a
                  go!
                </p>
                <img
                  src="/images/Linechart.png"
                  width="100%"
                  alt="linechart"
                  className="mb-4"
                /> */}
              </div>
              <div
                className="bg-white right"
                style={{
                  boxShadow:
                    "-2px 4px 48px rgba(50, 50, 71, 0.05), 2px 10px 24px rgba(50, 50, 71, 0.05)",
                }}
              >
                <p className="text-small">RAISED</p>
                <h3 className="mb-4">
                  {campaign?.funding?.currency == "USD"
                    ? "$"
                    : campaign?.funding?.currency == "GBP"
                    ? "£"
                    : "₦"}
                  {addCommaToNumber(campaign?.funding?.amountRaised)}
                </h3>
                <p className="text-small">DONORS</p>
                <h3 className="mb-4">{campaign?.donations?.length}</h3>
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
                    aria-valuenow={10}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  ></div>
                </div>
                <div className="d-flex justify-content-between align-align-items-center mb-5 flex-wrap">
                  <div className="d-flex align-items-center">
                    <p className="text-small mr-1 mb-0">GOAL: </p>
                    <p className="font-weight-bold opacity-1 mb-0">
                      {campaign?.funding?.currency == "USD"
                        ? "$"
                        : campaign?.funding?.currency == "GBP"
                        ? "£"
                        : "₦"}
                      {addCommaToNumber(campaign?.funding?.amountExpected)}
                    </p>
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
                </div>
                <p className="text-small">Share Your Campaign</p>
                <div className="d-flex align-items-center mb-5">
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href={`https://www.facebook.com/sharer/sharer.php?u=https://fundandtrace.com/campaign/${
                      campaign?._id
                    }?title=${campaign?.basicInformation?.campaignTitle
                      ?.split(" ")
                      .join("")}`}
                  >
                    <div className="d-flex flex-column align-items-center mr-4">
                      <img
                        src="/images/icons/facebook2.svg"
                        width={20}
                        height={32}
                        alt="facebook Icon"
                      />
                    </div>
                  </a>
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href={`https://twitter.com/intent/tweet?text=Please Donate to this cause - https://fundandtrace.com/campaign/${
                      campaign?._id
                    }?title=${campaign?.basicInformation?.campaignTitle
                      ?.split(" ")
                      .join("")}`}
                  >
                    <div className="d-flex flex-column align-items-center mr-4">
                      <img
                        src="/images/icons/twitter2.svg"
                        width={20}
                        height={32}
                        alt="twitter Icon"
                      />
                    </div>
                  </a>
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href={`https://api.whatsapp.com/send?text=Please Donate to this cause - https://fundandtrace.com/campaign/${
                      campaign?._id
                    }?title=${campaign?.basicInformation?.campaignTitle
                      ?.split(" ")
                      .join("")}`}
                  >
                    <div className="d-flex flex-column align-items-center mr-4">
                      <img
                        src="/images/icons/whatsapp.svg"
                        width={20}
                        height={32}
                        alt="whatsappIcon"
                      />
                    </div>
                  </a>
                </div>
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <p className="text-small mb-0" style={{ fontWeight: 400 }}>
                      DONORS
                    </p>
                    <p
                      className="text-blue mb-0 d-none d-md-block"
                      onClick={() => setShowDonationModal(true)}
                      style={{ cursor: "pointer" }}
                      role="button"
                    >
                      See All
                    </p>
                  </div>
                  {campaign?.donations ? (
                    campaign?.donations.slice(0, 5).map((donation, i) => (
                      <div className="mb-4 d-flex align-items-start" key={i}>
                        <h5 className="mb-0" style={{ width: 30 }}>
                          {i + 1}
                        </h5>
                        <div className="d-flex flex-column ml-3">
                          <div
                            className="d-flex align-items-center "
                            style={{ width: 240 }}
                          >
                            <img
                              src="/images/icons/profile.svg"
                              width={24}
                              height={24}
                              alt="profile"
                            />
                            <p
                              className="ml-2 mb-0"
                              style={{ fontWeight: 400 }}
                            >
                              {donation?.anonymous
                                ? "Anonymous"
                                : donation.donorName}
                            </p>
                          </div>

                          <div className="d-flex aligm-items-center mt-3">
                            <p className="mb-0 text-small">
                              {getCurrency(campaign?.funding?.currency)}
                              {Math.round(donation?.amount)}
                            </p>
                            <p className="mb-0 ml-2 text-small">
                              {" "}
                              - {getTimeDiff(donation?.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <h2 className="text-medium-heading">No Donations Yet!</h2>
                  )}

                  <button
                    className="w-100 button d-block d-md-none"
                    onClick={() => setShowDonationModal(true)}
                  >
                    See All
                  </button>
                </div>
              </div>
            </div>
            <section
              className="mb-4 d-md-flex flex-column justify-content-center align-items-center"
              style={{
                background: "white",
                width: "100%",
                boxShadow:
                  "-2px 4px 48px rgba(50, 50, 71, 0.05),2px 10px 24px rgba(50, 50, 71, 0.05)",
              }}
            >
              <p
                className="text-blue mb-4 text-center"
                style={{ color: "var(--color-primary)", opacity: 1 }}
              >
                {campaign?.basicInformation?.campaignTitle}
              </p>
              <h1 className="text-heading text-center">
                {campaign?.basicInformation?.campaignTitle}
              </h1>
              <p
                className="text-blue text-center"
                style={{ color: "var(--color-primary)", opacity: 1 }}
              >
                <span className="mr-3">
                  <img src="/images/icons/location.svg" alt="" />
                </span>
                {campaign?.basicInformation?.locationState},{" "}
                {campaign?.basicInformation?.locationCountry}
              </p>
              <div
                className="d-flex flex-column flex-md-row w-100 justify-content-between py-5"
                style={{ borderBottom: "0.5px solid #B3B3B3" }}
              >
                <div className="shadow img-div">
                  <img
                    src={campaign?.basicInformation?.campaignImage}
                    width="100%"
                    height="100%"
                    alt=""
                    style={{ objectFit: "cover" }}
                  />
                </div>

                <div className="progress-div">
                  <Link href={`/donate/${campaignId}`} passHref>
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
                      alt="profile"
                    />
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
                <div className="mx-auto story">
                  <div className="d-flex align-items-center mb-4 justify-content-center">
                    <h5
                      className="mr-5"
                      style={{
                        fontWeight: view == "story" ? 600 : 400,
                        color: view == "story" ? "var(--color-primary)" : "#B3B3B3",

                        cursor: "pointer",
                        fontSize: 16,
                      }}
                      onClick={() => setView("story")}
                      role="button"
                    >
                      STORY
                    </h5>
                    <h5
                      className=""
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
                    {/* <h5
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
                    </h5> */}
                  </div>
                  {view == "story" ? (
                    <div>
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
                          style={{ whiteSpace: "pre-wrap" }}
                        >
                          {para}
                        </p>
                      ))}
                    </div>
                  ) : view == "updates" ? (
                    <div>
                      {updates?.length ? (
                        <div>
                          {updates?.map((update, i) => (
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
                  ) : null}
                </div>
              </div>
            </section>
          </div>
        </Wrapper>
      )}
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
    </CampaignDashboardLayout>
  );
}

const Iframe = styled.div`
  min-width: 100%;
  max-width: 100%;
  .iframe {
    min-width: 100%;
    max-width: 100%;
    height: 400px;
    @media screen and (max-width: 767px) {
      width: 100%;
      height: 400px;
    }
  }
`;

const Wrapper = styled.div`
  .left {
    width: 57%;
    @media screen and (max-width: 767px) {
      width: 100%;
      padding: 35px 15px;
      order: 10;
    }
    padding: 35px;
    textarea {
      background: #fafafa;
      border: 0.5px solid #c4c4c4;
      box-sizing: border-box;
      border-radius: 4px;
      padding: 20px;
      height: 163px !important;
    }
  }
  .right {
    width: 40%;
    @media screen and (max-width: 767px) {
      width: 100%;
      padding: 35px 15px;
      margin-bottom: 30px;
      order: 1;
      .button {
        border: 0.7px solid var(--color-primary);
        box-sizing: border-box;
        background: white;
        height: 54px;
        border-radius: 4px;
        color: var(--color-primary);
      }
    }
    padding: 30px;
  }
  section {
    padding: 50px;
    @media screen and (max-width: 767px) {
      padding: 50px 15px;
    }
    .img-div {
      width: 52%;
      @media screen and (max-width: 767px) {
        width: 100%;
        margin-bottom: 30px;
      }
    }
    .progress-div {
      @media screen and (max-width: 767px) {
        width: 100%;
      }
      width: 45%;
    }
    .story {
      @media screen and (max-width: 767px) {
        width: 100%;
      }
      width: 535px;
      padding: 30px 0 0 0;
    }
  }
`;
