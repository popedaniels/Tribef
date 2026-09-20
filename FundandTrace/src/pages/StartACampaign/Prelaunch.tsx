import React, { useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { useState } from "react";
import StartLayout from "./StartLayout";
import Link from "next/link";
import styled from "styled-components";
import { useSelector } from "react-redux";
import {
  loadStartCampaign,
  selectStartCampaignState,
  startCampaignActions,
} from "../../../store/slices/startCampaignSlice";
import axios from "axios";
import { logout, selectAuthStateState } from "../../../store/slices/authSlice";
import { toast } from "../../../store/slices/ToastSlice";
import { campaignError } from "../../../store/slices/startcampaignErrorSlice";
import { useAppDispatch } from "./../../../store/hooks";
import {
  addCommaToNumber,
  getDaysRemaining,
  grabErrorMessage,
  grabErrorStatus,
} from "../../components/helperFunctions/helperFunctions";

export default function Prelauch() {
  const [view, setView] = useState("story");
  const dispatch = useAppDispatch();
  const { startCampaign } = useSelector(selectStartCampaignState);
  const [campaignId, setCampaignId] = useState("");
  const router = useRouter();
  const { authenticated, profile } = useSelector(selectAuthStateState);
  const [errorBasic, setErrorBasic] = useState(false);
  const [errorContent, setErrorContent] = useState(false);
  const [errorTeam, setErrorTeam] = useState(false);
  const [errorFunding, setErrorFunding] = useState(false);
  const [kycStatus, setKycStatus] = useState("unverified");
  const [kycLoading, setKycLoading] = useState(false);

  useEffect(() => {
    !authenticated && router.push("/SignUp");
  }, [authenticated, router]);

  const checkKyc = useCallback(async () => {
    if (!profile?._id) return;
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/identity/status/${profile._id}`,
        // Session cookie must ride along: without it the backend's requireAuth
        // rejects the call and KYC status silently stays "unverified".
        { withCredentials: true }
      );
      if (res.data?.data?.status) {
        setKycStatus(res.data.data.status);
      }
    } catch (err) {
    }
  }, [profile?._id]);

  useEffect(() => {
    checkKyc();
  }, [checkKyc]);

  const handleStartKyc = async () => {
    if (!profile?._id) return;
    setKycLoading(true);
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/identity/create-session`,
        { userId: profile._id, campaignId },
        { withCredentials: true }
      );
      if (res.data?.data?.url) {
        window.open(res.data.data.url, "_blank");
        dispatch(toast(true, "Identity verification session opened in a new tab.", "info"));
        setKycStatus("pending");
      }
    } catch (err) {
      dispatch(toast(true, grabErrorMessage(err) || "Failed to start KYC verification.", "error"));
    } finally {
      setKycLoading(false);
    }
  };

  const checkBasic = () => {
    for (let key in startCampaign?.basicInformation) {
      if (startCampaign?.basicInformation[key] === "") {
        setErrorBasic(true);
        return false;
      }
    }
    setErrorBasic(false);
    return true;
  };

  const checkContent = () => {
    if (!startCampaign?.content?.story.length) {
      setErrorContent(true);
      return false;
    }

    setErrorContent(false);
    return true;
  };

  const checkTeam = () => {
    for (let key in startCampaign?.team?.primaryContact) {
      if (startCampaign?.team?.primaryContact[key] === "") {
        setErrorTeam(true);
        return false;
      }
    }
    setErrorTeam(false);
    return true;
  };

  const checkFunding = () => {
    for (let key in startCampaign?.funding) {
      if (startCampaign?.funding[key] === "") {
        setErrorFunding(true);
        return false;
      }
    }
    setErrorFunding(false);
    return true;
  };

  useEffect(() => {
    const storedCampaignId = localStorage.getItem("campaignId") || "";
    setCampaignId(storedCampaignId);
    dispatch(loadStartCampaign(storedCampaignId));
  }, [dispatch]);

  const handleSubmit = async () => {
    try {
      if (kycStatus !== "verified") {
        dispatch(
          toast(
            true,
            "Identity Verification (KYC) Required before publishing your campaign.",
            "error"
          )
        );
        return;
      }

      checkTeam();
      checkBasic();
      checkContent();
      checkFunding();
      if (checkTeam() && checkBasic() && checkContent() && checkFunding()) {
        const res = await axios.post(
          process.env.NEXT_PUBLIC_API_URL + "/api/startCampaign/launch",
          { launch: true, id: campaignId },
          { withCredentials: true }
        );

        res && router.push("/dashboard");
        res && dispatch(toast(true, "Campaign is Live", "success"));
      } else {
        dispatch(campaignError(true));
        dispatch(
          toast(
            true,
            "Please go back and fill up the mandatory fields",
            "error"
          )
        );
      }
    } catch (error) {
      dispatch(toast(true, grabErrorMessage(error), "error"));
      if (grabErrorStatus(error) == 403) {
        dispatch(logout());
      }
    }
  };

  return (
    <StartLayout
      errorBasic={errorBasic && true}
      errorContent={errorContent && true}
      errorTeam={errorTeam && true}
      errorFunding={errorFunding && true}
      active={6}
      page={"PRE-LAUNCH PAGE"}
      handle={() => handleSubmit()}
    >
      <Wrapper>
        <div className="mb-4 d-flex justify-content-between align-items-baseline">
          <div>
            <h2 className="text-heading mb-3">Pre-Launch Page</h2>
            <p className="mb-0">
              Take a look at how your campaign will look like before launching
            </p>
          </div>

          <button
            className="btn text-white mt-auto d-none d-md-flex"
            onClick={handleSubmit}
            style={{
              opacity: kycStatus === "verified" ? 1 : 0.6,
              cursor: kycStatus === "verified" ? "pointer" : "not-allowed",
            }}
          >
            Launch Campaign
          </button>
        </div>

        {/* KYC Verification Gate Banner */}
        <div
          className="p-4 mb-5 rounded"
          style={{
            background:
              kycStatus === "verified"
                ? "rgba(16, 185, 129, 0.08)"
                : "rgba(105, 121, 248, 0.08)",
            border:
              kycStatus === "verified"
                ? "1px solid rgba(16, 185, 129, 0.3)"
                : "1px solid rgba(105, 121, 248, 0.3)",
          }}
        >
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center">
            <div>
              <div className="d-flex align-items-center mb-2">
                <span
                  style={{
                    display: "inline-block",
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    backgroundColor:
                      kycStatus === "verified"
                        ? "#10B981"
                        : kycStatus === "pending"
                        ? "#F59E0B"
                        : "#6979F8",
                    marginRight: 8,
                  }}
                />
                <h5 className="mb-0 font-weight-bold" style={{ fontSize: 16 }}>
                  {kycStatus === "verified"
                    ? "Identity Verified (KYC Passed)"
                    : kycStatus === "pending"
                    ? "Verification Under Review"
                    : "Identity Verification Required (Anti-Fraud Protocol)"}
                </h5>
              </div>
              <p className="mb-0 text-muted" style={{ fontSize: 13.5 }}>
                {kycStatus === "verified"
                  ? "Your government ID and facial biometric liveness checks are active. Your campaign is ready for live launch."
                  : "To protect donors and eliminate fraudulent campaigns, all organizers must complete a quick 1-minute government ID verification via Stripe."}
              </p>
            </div>

            {kycStatus !== "verified" && (
              <button
                onClick={handleStartKyc}
                disabled={kycLoading}
                className="btn btn-primary mt-3 mt-md-0 ml-md-3 px-4 py-2 font-weight-bold"
                style={{
                  background: "var(--color-primary)",
                  border: "none",
                  whiteSpace: "nowrap",
                }}
              >
                {kycLoading
                  ? "Opening..."
                  : kycStatus === "pending"
                  ? "Re-verify ID"
                  : "Verify Identity with Stripe"}
              </button>
            )}
          </div>
        </div>
        <section className="mb-4 d-flex flex-column justify-content-center align-items-center">
          <p
            className="text-blue mb-4 text-capitalize"
            style={{ color: "var(--color-primary)", opacity: 1 }}
          >
            {startCampaign?.category}
          </p>
          <h1 className="text-heading">
            {startCampaign?.basicInformation?.campaignTitle}
          </h1>
          <p className="text-blue" style={{ color: "var(--color-primary)", opacity: 1 }}>
            <span className="mr-3">
              <img src="/images/icons/location.svg" alt="" />
            </span>{" "}
            {startCampaign?.basicInformation?.locationState},{" "}
            {startCampaign?.basicInformation?.locationCountry}
          </p>
          <div
            className="d-flex w-100 justify-content-between py-5 flex-column flex-md-row"
            style={{ borderBottom: "0.5px solid #B3B3B3" }}
          >
            <div
              className="shadow campaign-pic"
              style={{ background: "rgba(0,0,0,0.3" }}
            >
              <img
                src={
                  startCampaign?.basicInformation?.campaignImage
                    ? startCampaign?.basicInformation?.campaignImage
                    : "/images/draftImage.png"
                }
                width="100%"
                height="100%"
                alt="campaignImage"
                style={{
                  objectFit: startCampaign?.basicInformation?.campaignImage
                    ? "cover"
                    : "contain",
                }}
              />
            </div>

            <div className="campaign-stats">
              <button className="btn text-white w-100" disabled>
                Donate
              </button>
              <button
                className="w-100 bg-white btn my-4"
                style={{ border: "0.7px solid var(--color-primary)" }}
                disabled
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
                  {startCampaign?.organizer}
                </p>
              </div>
              <p className="mb-4 mt-4">
                {startCampaign?.basicInformation?.campaignTagline &&
                  startCampaign?.basicInformation?.campaignTagline?.substring(
                    0,
                    200
                  )}
                {startCampaign?.basicInformation?.campaignTagline?.length >
                  200 && "..."}
              </p>
              <div className="d-flex align-items-baseline">
                <h3 className="text-heading mr-2">
                  {startCampaign?.funding?.currency == "USD"
                    ? "$"
                    : startCampaign?.funding?.currency == "GBP"
                    ? "£"
                    : "₦"}
                  {addCommaToNumber(startCampaign?.funding?.amountRaised)}
                </h3>
                <p
                  className="mb-0"
                  style={{ fontWeight: "300", color: "#B3B3B3" }}
                >
                  raised of {startCampaign?.funding?.currency}{" "}
                  {startCampaign?.funding?.amountExpected}
                </p>
              </div>
              <div className="progress mb-3">
                <div
                  className="progress-bar "
                  role="progressbar"
                  style={{
                    width: `${
                      (startCampaign?.funding?.amountRaised /
                        startCampaign?.funding?.amountExpected) *
                      100
                    }%`,
                  }}
                  aria-valuenow={10}
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
                  {getDaysRemaining(startCampaign)} days left
                </p>
              </div>
              <div className="d-flex align-items-center mt-3">
                <p className="mr-3 mb-0">
                  <span style={{ fontWeight: "600", color: "#000000" }}>0</span>{" "}
                  donors
                </p>
                <p className="mb-0">
                  <span style={{ fontWeight: "600", color: "#000000" }}>0</span>{" "}
                  shares
                </p>
              </div>
            </div>
          </div>
          <div className="d-flex w-100 flex-column flex-md-row">
            <div className="w-100 stories">
              <div className="d-flex align-items-center mb-5">
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
                  className="mr-5"
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
                <div>
                  <div style={{ position: "relative", marginBottom: 30 }}>
                    {startCampaign?.content?.campaignVideo && (
                      <div>
                        {startCampaign?.content?.campaignVideo?.includes(
                          "youtube.com"
                        ) ? (
                          <Iframe style={{ marginBottom: 40 }}>
                            <iframe
                              className="iframe"
                              src={startCampaign?.content?.campaignVideo}
                            ></iframe>
                          </Iframe>
                        ) : (
                          <video
                            src={startCampaign?.content?.campaignVideo}
                            autoPlay
                            style={{ width: "100%", objectFit: "cover" }}
                            controls
                          />
                        )}
                      </div>
                    )}
                    {/* <div
                      className="w-100 d-flex align-items-center justify-content-center"
                      style={{
                        position: "absolute",
                        top: 0,
                        height: "100%",
                        background: "rgba(0,0,0, 0.2)",
                      }}
                    >
                      <img
                        src="/images/icons/videoplay.svg"
                        width="38px"
                        height="38px"
                        alt="playIcon"
                      />
                    </div> */}
                  </div>
                  {startCampaign?.content?.story.map((para: string, i: number) => (
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
                <div>NO UPDATES</div>
              ) : (
                <div>CONTACTS</div>
              )}
            </div>
            <div className="donors">
              <p style={{ fontWeight: 400 }}>DONORS</p>
              {[].map((donation, i) => (
                <div key={i} className="mb-5 d-flex align-items-center">
                  <h5 className="mb-0" style={{ width: 30 }}>
                    {i + 1}
                  </h5>
                  <div
                    className="d-flex align-items-center ml-3"
                    style={{ width: "100%" }}
                  >
                    <img
                      src="/images/icons/profile.svg"
                      width={24}
                      height={24}
                     alt="" />
                    <p className="ml-2 mb-0" style={{ fontWeight: 400 }}>
                      Anonymous
                    </p>
                  </div>
                </div>
              ))}
              {<h2 className="text-medium-heading">No Donations Yet!</h2>}
              <button className="btn text-white w-100" disabled>
                Donate Now
              </button>
            </div>
          </div>
        </section>

        <button
          style={{ width: "100%" }}
          className="btn text-white mb-5"
          onClick={handleSubmit}
        >
          Launch
        </button>
      </Wrapper>
    </StartLayout>
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
  padding: 40px 50px 50px 50px;
  @media screen and (max-width: 767px) {
    padding: 40px 15px;
  }
  section {
    padding: 50px;
    background: white;
    box-shadow: 0 4px 10px -10px rgba(255, 255, 255, 0.1),
      0 4px 10px 0px rgba(0, 0, 0, 0.04),
      0 7px 8px -5px rgba(255, 255, 255, 0.2);
    box-sizing: border-box;
    width: 100%;
    @media screen and (max-width: 767px) {
      margin-bottom: 50px !important;
    }
    @media screen and (max-width: 1190px) {
      padding: 50px 15px;
    }
    .campaign-pic {
      width: 52%;
      @media screen and (max-width: 767px) {
        width: 100%;
        img {
          height: 300px;
          margin-bottom: 25px;
        }
      }
    }
    .campaign-stats {
      width: 45%;
      @media screen and (max-width: 767px) {
        width: 100%;
      }
    }

    .donors {
      min-width: 300px;
      @media screen and (min-width: 1024px) and (max-width: 1190px) {
        min-width: 240px;
        padding: 30px 0 30px 15px;
      }
      padding: 30px 30px 30px 30px;
      border-left: 0.5px solid #b3b3b3;
      @media screen and (max-width: 767px) {
        border-left: none;
        padding: 30px 0 30px 0;
        order: 1;
        position: relative;
        border-bottom: 1px solid #b3b3b3;
      }
      position: sticky;
      top: 0;
    }

    .stories {
      padding: 30px 50px 0 0;
      @media screen and (max-width: 767px) {
        padding: 30px 0 0 0;
        order: 10;
      }
      @media screen and (min-width: 768px) and (max-width: 1190px) {
        padding: 30px 15px 0 0;
      }
    }
  }
`;
