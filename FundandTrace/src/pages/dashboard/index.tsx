import React, { useCallback, useEffect, useState } from "react";
import DashboardLayout from "./DashboardLayout";
import styled from "styled-components";
import Link from "next/link";
import { useSelector } from "react-redux";
import { logout, selectAuthStateState } from "../../../store/slices/authSlice";
import ActiveCampaignCard from "../../components/ActiveCampaignCard/ActiveCampaignCard";
import axios from "axios";
import Spinner from "../../components/composed/spinner/Spinner";
import DraftCampaignCard from "../../components/DraftCampaignCard/DraftCampaignCard";
import {
  grabErrorMessage,
  grabErrorStatus,
} from "../../components/helperFunctions/helperFunctions";
import { toast } from "../../../store/slices/ToastSlice";
import router from "next/router";
import { useAppDispatch } from "./../../../store/hooks";

export default function Dashboard() {
  const [view, setView] = useState("activeCampaign");
  const { authenticated, profile } = useSelector(selectAuthStateState);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState([]);
  const [reload, setReload] = useState(false);
  const dispatch = useAppDispatch();

  const profileId = profile?._id;
  const getCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      if (!profileId) return;
      const campaigns = await axios.get(
        process.env.NEXT_PUBLIC_API_URL + "/api/campaigns/" + profileId,
        { withCredentials: true }
      );
      campaigns && setCampaigns(campaigns?.data?.data?.active);
      campaigns && setDrafts(campaigns?.data.data?.drafts);

      campaigns && setLoading(false);
    } catch (error) {
      dispatch(toast(true, grabErrorMessage(error), "error"));
      if (grabErrorStatus(error) == 403) {
        dispatch(logout());
      }
    }
  }, [profileId, dispatch]);

  useEffect(() => {
    getCampaigns();
  }, [reload, getCampaigns]);

  return (
    <DashboardLayout active={1} page="Home">
      <Wrapper className="d-flex flex-column align-items-center justify-content-center mx-auto">
        <div className="d-flex flex-md-row flex-column align-items-center justify-content-between w-100 mb-4">
          <div>
            <h2 className="mb-1 text-heading">Campaigns & Escrow Overview</h2>
            <p className="text-muted mb-0" style={{ fontSize: 14 }}>Manage your active milestone fundraisers and review real-time audit requests.</p>
          </div>
          <Link
            href={authenticated ? `/StartACampaign` : `/SignUp/SignIn`}
            passHref
          >
            <a>
              <button
                className={[
                  "d-flex align-items-center justify-content-center px-4 py-3 text-white btn rounded mt-3 mt-md-0",
                ].join(" ")}
              >
                <p className="mb-0">Create a campaign</p>
              </button>
            </a>
          </Link>
        </div>

        {/* Bento Overview Stats */}
        <div className="w-100 mb-4" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
          <div className="bento-elevation-card p-3">
            <span className="badge-live-status mb-2">
              <span className="live-pulse-dot"></span>
              Live Pipeline
            </span>
            <p className="text-muted mb-1" style={{ fontSize: 12, fontWeight: 600 }}>ACTIVE CAMPAIGNS</p>
            <h4 className="mb-0" style={{ fontSize: 22, fontWeight: 800, color: "var(--color-primary)" }}>
              {campaigns?.length || 0}
            </h4>
          </div>
          <div className="bento-elevation-card p-3">
            <span className="badge-escrow-verified mb-2">Draft Mode</span>
            <p className="text-muted mb-1" style={{ fontSize: 12, fontWeight: 600 }}>DRAFTS & PRE-LAUNCH</p>
            <h4 className="mb-0" style={{ fontSize: 22, fontWeight: 800, color: "var(--color-text-heading)" }}>
              {drafts?.length || 0}
            </h4>
          </div>
          <div className="bento-elevation-card p-3">
            <span className="badge-escrow-verified mb-2">Platform Standard</span>
            <p className="text-muted mb-1" style={{ fontSize: 12, fontWeight: 600 }}>ESCROW PROTECTION</p>
            <h4 className="mb-0" style={{ fontSize: 22, fontWeight: 800, color: "#10B981" }}>
              100% Audited
            </h4>
          </div>
        </div>

        <div className="campaignsDiv d-flex align-items-center justify-content-center flex-column">
          <div className="d-flex align-items-center nav mx-auto">
            <div
              className={`${view == "activeCampaign" ? "active" : "inactive"}`}
              onClick={() => setView("activeCampaign")}
              role="button"
            >
              Active
            </div>
            <div
              className={`${view == "drafts" ? "active" : "inactive"}`}
              onClick={() => setView("drafts")}
              role="button"
            >
              Drafts
            </div>
          </div>
          {view == "activeCampaign" ? (
            loading ? (
              <Spinner type="Oval" width={50} height={50} color={" var(--color-primary)"} />
            ) : !campaigns.length ? (
              <div className="d-flex flex-column align-items-center justify-content-center">
                <h2 className="text-heading text-center">
                  You do not have an Active Campaign Yet!
                </h2>

                <img
                  src="/images/noCampaign.svg"
                  alt="noCampaign"
                  className="image"
                />
              </div>
            ) : (
              <div className="active-card-container">
                {campaigns.map((campaign, i) => (
                  <ActiveCampaignCard campaign={campaign} key={i} />
                ))}
              </div>
            )
          ) : drafts.length ? (
            <div className="active-card-container">
              {drafts.map((campaign, i) => (
                <DraftCampaignCard
                  campaign={campaign}
                  key={i}
                  reload={() => {
                    setReload(!reload);
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="d-flex flex-column align-items-center justify-content-center">
              <h2 className="text-heading text-center">
                You do not have a draft Campaign Yet!
              </h2>

              <img
                src="/images/noCampaign.svg"
                alt="noCampaign"
                className="image"
              />
            </div>
          )}
        </div>
      </Wrapper>
    </DashboardLayout>
  );
}

const Wrapper = styled.div`
  width: 100%;
  max-width: 923px;
  @media screen and (max-width: 767px) {
    padding: 50px 15px;
    max-width: 450px;
  }
  margin-top: 40px;
  @media screen and (max-width: 767px) {
    margin-top: 40px;
  }
  padding: 15px;
  @media screen and (min-width: 768px) and (max-width: 1023px) {
    padding: 50px;
  }
  @media screen and (min-width: 1024px) and (max-width: 1100px) {
    padding: 25px;
  }
  .image {
    width: 500px;
    height: 500px;
    @media screen and (max-width: 767px) {
      width: 100%;
      height: auto;
    }
  }

  .campaignsDiv {
    box-shadow: -2px 4px 48px rgba(50, 50, 71, 0.05),
      2px 10px 24px rgba(50, 50, 71, 0.05);
    background: white;
    padding: 50px 45px;
    margin-bottom: 50px;
    width: 100%;
    max-width: 923px;
    border-radius: 4px;
    .nav {
      box-shadow: 0px 2px 10px rgba(50, 50, 71, 0.06);
      border-radius: 4px;
      margin-bottom: 50px;
      border: 0.5px solid #c4c4c4;
      border-radius: 4px;
      .active {
        background: #f0f1fe;
        padding: 15px 25px;
        color: var(--color-primary);
        border-radius: 4px;
        cursor: pointer;
      }
      .inactive {
        background: white;
        padding: 15px 25px;
        color: #b3b3b3;
        border-radius: 4px;
        cursor: pointer;
      }
    }
    @media screen and (max-width: 767px) {
      padding: 50px 15px;
      max-width: 450px;
    }
    .active-card-container {
      display: grid;
      width: 100%;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      grid-row-gap: 1.5rem;
      grid-column-gap: 1.5rem;
      @media screen and (max-width: 767px) {
        grid-template-columns: repeat(1, minmax(0, 1fr));
      }

      @media screen and (min-width: 767px) and (max-width: 1240px) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
  }
`;
