import axios from "axios";
import React, { useState } from "react";
import styled from "styled-components";
import Navbar from "../../../components/Navbar/Navbar";
import PaymentHistoryCard from "../../../components/PaymentHistoryCard/PaymentHistoryCard";
import Layout from "../../../components/Layout";
import DisbursementCard from "../../../components/DisbursementCard/DisbursementCard";
import Link from "next/link";
import { addCommaToNumber, getDaysRemaining } from "../../../components/helperFunctions/helperFunctions";
import ReceiptInspectorModal from "../../../components/composed/Modal/ReceiptInspectorModal/ReceiptInspectorModal";
import DefaultModal from "../../../components/composed/Modal/DefaultModal/DefaultModal";
import { useSelector } from "react-redux";
import { toast } from "../../../../store/slices/ToastSlice";
import { selectAuthStateState } from "../../../../store/slices/authSlice";
import { useAppDispatch } from "./../../../../store/hooks";
import { Campaign } from "../../../types/campaign";
import type { GetServerSidePropsContext } from "next";

interface Disbursement {
  amount?: number;
  currency?: string;
  dateDisbursed?: string | Date;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  receipt?: string;
}

interface FundingRequest {
  _id?: string;
  status?: string;
  amount?: number;
  currency?: string;
  createdAt?: string | Date;
  purposeOfFunding?: string;
  proofOfFunding?: string;
  declineReason?: string;
  organizerId?: string;
  disbursement?: Disbursement;
}

interface DisputeGovernance {
  isLocked?: boolean;
  lockReason?: string;
}

interface TrackerUser {
  firstName?: string;
  lastName?: string;
  city?: string;
  country?: string;
  profilePicture?: string;
}

type TrackerCampaign = Campaign & {
  disputeGovernance?: DisputeGovernance;
  donations?: unknown[];
};

interface CampaignTrackerPageProps {
  campaign: TrackerCampaign | null;
  user: TrackerUser | null;
  approvedFundingRequests: FundingRequest[];
  allFundingRequests: FundingRequest[];
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const campaignId = context.query.id;
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const data = await axios.get(
      `${apiUrl}/api/fundingRequests/campaignTracker/${campaignId}`,
      { timeout: 3000 }
    );
    const { allFundingRequests, approvedFundingRequests, campaign, user } =
      data?.data?.data || {};

    return {
      props: {
        allFundingRequests: allFundingRequests || [],
        approvedFundingRequests: approvedFundingRequests || [],
        campaign: campaign || null,
        user: user || null,
      },
    };
  } catch (error) {
    return {
      props: {
        allFundingRequests: [],
        approvedFundingRequests: [],
        campaign: null,
        user: null,
      },
    };
  }
};

export default function CampaignTrackerPage({
  campaign,
  user,
  approvedFundingRequests,
  allFundingRequests,
}: CampaignTrackerPageProps) {
  const [view, setView] = useState("fundingRequests");
  const [showInspectorModal, setShowInspectorModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [isLocked, setIsLocked] = useState(campaign?.disputeGovernance?.isLocked || false);
  const [lockReason, setLockReason] = useState(campaign?.disputeGovernance?.lockReason || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dispatch = useAppDispatch();
  const { profile } = useSelector(selectAuthStateState);

  const [disputeForm, setDisputeForm] = useState({
    donorEmail: profile?.email || "",
    donorName: `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim() || "",
    disputeCategory: "Fake Evidence / Altered Receipt",
    description: "",
    evidenceAttachmentUrl: "",
  });

  const handleDisputeSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!disputeForm.donorEmail) {
      dispatch(toast(true, "Please provide your donor email address.", "error"));
      return;
    }
    if (!disputeForm.description) {
      dispatch(toast(true, "Please describe the discrepancy.", "error"));
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/campaigns/${campaign?._id}/dispute`,
        {
          donorId: profile?._id,
          ...disputeForm,
        }
      );

      if (res.data?.status === 200) {
        dispatch(toast(true, "Dispute report recorded successfully.", "success"));
        if (res.data?.data?.isLocked) {
          setIsLocked(true);
          setLockReason(res.data.data.lockReason);
          dispatch(
            toast(
              true,
              "Escrow circuit-breaker triggered: Campaign funds have been frozen.",
              "info"
            )
          );
        }
        setShowDisputeModal(false);
      }
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to submit dispute.";
      dispatch(toast(true, msg, "error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout
      title={`Tracker | ${campaign?.basicInformation?.campaignTitle}`}
      description={`Campaign Tracking of ${campaign?.basicInformation?.campaignTitle}`}
      ogImage={`${campaign?.basicInformation?.campaignImage}`}
      showFooter
    >
      <div>
        <Navbar />
      </div>
      <Wrapper className="pb-5 mb-5" style={{ paddingTop: 80 }}>
        {isLocked && (
          <div className="custom-container pt-4">
            <div
              className="p-4 rounded d-flex align-items-center"
              style={{
                background: "rgba(239, 68, 68, 0.12)",
                border: "1px solid rgba(239, 68, 68, 0.4)",
                color: "#EF4444",
              }}
            >
              <span style={{ fontSize: 24, marginRight: 12 }}>🔒</span>
              <div>
                <h5 className="mb-1 font-weight-bold" style={{ fontSize: 16, color: "#EF4444" }}>
                  Escrow Frozen — Under Active Dispute Review
                </h5>
                <p className="mb-0 text-muted" style={{ fontSize: 13.5 }}>
                  {lockReason ||
                    "Verified donors have flagged discrepancies with submitted milestone evidence. All pending disbursements have been paused pending platform compliance review."}
                </p>
              </div>
            </div>
          </div>
        )}

        <section className="Top d-flex justify-content-between pt-4 flex-wrap custom-container">
          <article className="campaign-details d-flex align-items-start mt-5 mt-lg-0 order-12 order-lg-1">
            <div className="mr-md-4 mb-4 mb-lg-0">
              <Link href={`/campaign/${campaign?._id}`} passHref>
                <a>
                  <img
                    src={campaign?.basicInformation?.campaignImage}
                    alt="campaignImages"
                    width="209px"
                    height="221px"
                    className="campaign-image"
                    style={{ objectFit: "cover" }}
                  />
                </a>
              </Link>
            </div>
            <div className="details">
              <div className="mb-2">
                <span className="badge-live-status">
                  <span className="live-pulse-dot"></span>
                  Live Escrow Tracking
                </span>
              </div>
              <h4 className="mb-3">
                {campaign?.basicInformation?.campaignTitle}
              </h4>
              <div className="d-flex align-items-center mb-3">
                <img
                  src="/images/icons/location.svg"
                  alt="location icon"
                  width="14px"
                />
                <p className="text-blue mb-0 ml-3">
                  {campaign?.basicInformation?.locationState},{" "}
                  {campaign?.basicInformation?.locationCountry}
                </p>
              </div>

              <div className="d-flex align-items-baseline">
                <h3
                  className="text-heading mr-2"
                  style={{ fontSize: 16, lineHeight: "28px" }}
                >
                  {campaign?.funding?.currency == "USD"
                    ? "$"
                    : campaign?.funding?.currency == "GBP"
                    ? "£"
                    : "₦"}
                  {addCommaToNumber(campaign?.funding?.amountRaised)}
                </h3>
                <p className="mb-0" style={{ fontWeight: "300" }}>
                  raised of{" "}
                  {campaign?.funding?.currency == "USD"
                    ? "$"
                    : campaign?.funding?.currency == "GBP"
                    ? "£"
                    : "₦"}
                  {addCommaToNumber(campaign?.funding?.amountExpected)}
                </p>
              </div>
              <div
                style={{ width: "100%" }}
                className={["progress mb-2"].join(" ")}
              >
                <div
                  className={["progress-bar"].join(" ")}
                  role="progressbar"
                  style={{
                    width: `${
                      ((campaign?.funding?.amountRaised as number) /
                        (campaign?.funding?.amountExpected as number)) *
                      100
                    }%`,
                  }}
                  aria-valuenow={
                    ((campaign?.funding?.amountRaised as number) /
                      (campaign?.funding?.amountExpected as number)) *
                    100
                  }
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
                  }}
                >
                  <span style={{ fontWeight: "600", color: "#000000" }}>
                    {campaign?.donations?.length || 0}
                  </span>{" "}
                  donors
                </p>
                <p
                  className="mb-0"
                  style={{
                    fontWeight: "300",
                  }}
                >
                  <span style={{ fontWeight: "600", color: "#000000" }}>0</span>{" "}
                  shares
                </p>
              </div>
            </div>
          </article>
          <article className="user-details d-flex order-1 order-lg-12">
            <div className="mr-4">
              {user?.profilePicture ? (
                <img
                  src={user?.profilePicture}
                  alt="userImages"
                  width="58px"
                  height="58px"
                  style={{ borderRadius: "50%", objectFit: "cover" }}
                />
              ) : (
                <div
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    width: 58,
                    height: 58,
                    background: "#F0F0F0",
                    borderRadius: "50%",
                    color: "#A3A3A3",
                    fontSize: 12,
                  }}
                >
                  {`${user?.firstName?.charAt(0) || "U"} ${user?.lastName?.charAt(0) || "O"}`}
                </div>
              )}
            </div>
            <div>
              <h4 className="mb-2">
                {user?.firstName} {user?.lastName}
              </h4>
              <div className="d-flex align-items-baseline">
                <p className="mb-0" style={{ fontWeight: "300" }}>
                  {user?.city || "Lagos"}, {user?.country || "Nigeria"}
                </p>
              </div>
            </div>
          </article>
        </section>
        <section style={{ background: "#F8FAFC", borderTop: "1px solid #E2E8F0", borderBottom: "1px solid #E2E8F0" }} className="py-4 mt-5">
          <section className="custom-container py-2">
            <article className="numbers mx-auto ">
              <div className="bento-elevation-card p-4 d-flex flex-column align-items-center text-center">
                <span className="badge-escrow-verified mb-2">Escrow Inflow</span>
                <p className="mb-1 text-muted" style={{ fontSize: 13, fontWeight: 600 }}>TOTAL RAISED</p>
                <h4 className="mb-0" style={{ fontSize: 24, fontWeight: 800, color: "var(--color-text-heading)" }}>
                  {campaign?.funding?.currency == "USD"
                    ? "$"
                    : campaign?.funding?.currency == "GBP"
                    ? "£"
                    : "₦"}
                  {addCommaToNumber(campaign?.funding?.amountRaised)}
                </h4>
              </div>
              <div className="bento-elevation-card p-4 d-flex flex-column align-items-center text-center">
                <span className="badge-escrow-verified mb-2">Audit Pipeline</span>
                <p className="mb-1 text-muted" style={{ fontSize: 13, fontWeight: 600 }}>FUNDING REQUESTS</p>
                <h4 className="mb-0" style={{ fontSize: 24, fontWeight: 800, color: "var(--color-primary)" }}>
                  {allFundingRequests?.length || 0}
                </h4>
              </div>
              <div className="bento-elevation-card p-4 d-flex flex-column align-items-center text-center">
                <span className="badge-live-status mb-2">
                  <span className="live-pulse-dot"></span>
                  Disbursed
                </span>
                <p className="mb-1 text-muted" style={{ fontSize: 13, fontWeight: 600 }}>TOTAL DISBURSED</p>
                <h4 className="mb-0" style={{ fontSize: 24, fontWeight: 800, color: "#10B981" }}>
                  {campaign?.funding?.currency == "USD"
                    ? "$"
                    : campaign?.funding?.currency == "GBP"
                    ? "£"
                    : "₦"}
                  {addCommaToNumber(
                    approvedFundingRequests?.reduce(
                      (accumulator, approved) =>
                        accumulator + (approved?.disbursement?.amount || 0),
                      0
                    ) || 0
                  )}
                </h4>
              </div>

              <div className="bento-elevation-card p-4 d-flex flex-column align-items-center text-center">
                <span className="badge-escrow-verified mb-2">Protected</span>
                <p className="mb-1 text-muted" style={{ fontSize: 13, fontWeight: 600 }}>AVAILABLE BALANCE</p>
                <h4 className="mb-0" style={{ fontSize: 24, fontWeight: 800, color: "var(--color-text-heading)" }}>
                  {campaign?.funding?.currency == "USD"
                    ? "$"
                    : campaign?.funding?.currency == "GBP"
                    ? "£"
                    : "₦"}
                  {addCommaToNumber(campaign?.funding?.availableBalance)}
                </h4>
              </div>

              <div className="bento-elevation-card p-3 d-flex flex-column align-items-center text-center justify-content-center">
                <button
                  type="button"
                  onClick={() => setShowInspectorModal(true)}
                  className="btn-secondary-action w-100 mb-2"
                  style={{ height: 40, fontSize: 13 }}
                >
                  🛡️ Inspect Receipt
                </button>
                <button
                  type="button"
                  onClick={() => setShowDisputeModal(true)}
                  className="btn btn-outline-danger w-100"
                  style={{
                    height: 40,
                    fontSize: 12.5,
                    fontWeight: 700,
                    borderRadius: 4,
                    borderColor: "rgba(239, 68, 68, 0.4)",
                  }}
                >
                  ⚠️ Report Discrepancy
                </button>
              </div>
            </article>
          </section>
        </section>
        <section className="bottom mt-5 custom-container">
          <section className="mx-auto">
            <div
              className="d-flex align-items-center border"
              style={{ width: "100%", borderRadius: 4 }}
            >
              <div
                className="border-right w-50 d-flex align-items-center justify-content-center"
                style={{
                  background: view == "fundingRequests" ? "#F0F1FE" : "#FAFAFA",
                  color: view == "fundingRequests" ? "var(--color-primary)" : "#A3A3A3",
                  height: 40,
                }}
                role="button"
                onClick={() => setView("fundingRequests")}
              >
                Funding requests
              </div>
              <div
                className="w-50 d-flex align-items-center justify-content-center"
                style={{
                  background: view == "disbursements" ? "#F0F1FE" : "#FAFAFA",
                  color: view == "disbursements" ? "var(--color-primary)" : "#A3A3A3",
                  height: 40,
                }}
                role="button"
                onClick={() => setView("disbursements")}
              >
                Disbursments
              </div>
            </div>
            <article className="mx-auto mt-5">
              {view == "fundingRequests" ? (
                <div className="pl-4">
                  {allFundingRequests?.length ? (
                    allFundingRequests?.map((fundingRequest, i) => (
                      <PaymentHistoryCard
                        fundingRequest={fundingRequest}
                        key={i}
                        last={i == allFundingRequests.length - 1 && "last"}
                      />
                    ))
                  ) : (
                    <div className="d-flex flex-column align-items-center my-5">
                      <img
                        src="/images/icons/noFund.svg"
                        alt="no funding Request"
                        width="50px"
                        height="50px"
                      />
                      <h2 className="text-medium text-center">
                        No funding request yet!
                      </h2>
                    </div>
                  )}
                </div>
              ) : (
                <div className="pl-4">
                  {approvedFundingRequests?.length ? (
                    approvedFundingRequests?.map((fundingRequest, i) => (
                      <DisbursementCard
                        disbursement={fundingRequest?.disbursement}
                        key={i}
                        last={i == approvedFundingRequests.length - 1 && "last"}
                      />
                    ))
                  ) : (
                    <div className="d-flex flex-column align-items-center my-5">
                      <img
                        src="/images/icons/noDis.svg"
                        alt="no funding Request"
                        width="50px"
                        height="50px"
                      />
                      <h2 className="text-medium text-center">
                        No Disbursement yet!
                      </h2>
                    </div>
                  )}
                </div>
              )}
            </article>
          </section>
        </section>
      </Wrapper>
      <ReceiptInspectorModal
        showModal={showInspectorModal}
        onModalClose={() => setShowInspectorModal(false)}
      />

      <DefaultModal
        showModal={showDisputeModal}
        onModalClose={() => setShowDisputeModal(false)}
      >
        <div className="p-4" style={{ maxWidth: 520 }}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="mb-0 font-weight-bold" style={{ color: "#EF4444", fontSize: 18 }}>
              ⚠️ Report Milestone Discrepancy
            </h4>
            <button
              onClick={() => setShowDisputeModal(false)}
              className="btn btn-sm btn-link text-muted font-weight-bold"
              style={{ fontSize: 18, textDecoration: "none" }}
            >
              ✕
            </button>
          </div>

          <p className="text-muted mb-4" style={{ fontSize: 13.5, lineHeight: 1.5 }}>
            To eliminate fraud and protect donor funds, verified donors can flag altered receipts, fake proofs, or inactive milestones. When consensus is reached, remaining escrow funds are automatically frozen.
          </p>

          <form onSubmit={handleDisputeSubmit}>
            <div className="mb-3">
              <label className="font-weight-bold mb-1" style={{ fontSize: 13 }}>
                Donor Email <span className="text-danger">*</span>
              </label>
              <input
                type="email"
                required
                className="form-control"
                placeholder="The email you used to donate"
                value={disputeForm.donorEmail}
                onChange={(e) =>
                  setDisputeForm({ ...disputeForm, donorEmail: e.target.value })
                }
              />
            </div>

            <div className="mb-3">
              <label className="font-weight-bold mb-1" style={{ fontSize: 13 }}>
                Discrepancy Category <span className="text-danger">*</span>
              </label>
              <select
                className="form-control"
                value={disputeForm.disputeCategory}
                onChange={(e) =>
                  setDisputeForm({ ...disputeForm, disputeCategory: e.target.value })
                }
              >
                <option value="Fake Evidence / Altered Receipt">
                  Fake Evidence / Altered Receipt
                </option>
                <option value="Misappropriation of Funds">
                  Misappropriation of Funds
                </option>
                <option value="Inactive / Abandoned Milestone">
                  Inactive / Abandoned Milestone
                </option>
                <option value="Identity Mismatch">Identity Mismatch</option>
                <option value="Other">Other Violation</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="font-weight-bold mb-1" style={{ fontSize: 13 }}>
                Description of Violation <span className="text-danger">*</span>
              </label>
              <textarea
                required
                rows={3}
                className="form-control"
                placeholder="Explain the specific issue with the proof or project implementation..."
                value={disputeForm.description}
                onChange={(e) =>
                  setDisputeForm({ ...disputeForm, description: e.target.value })
                }
              />
            </div>

            <div className="mb-4">
              <label className="font-weight-bold mb-1" style={{ fontSize: 13 }}>
                Evidence Link (Optional)
              </label>
              <input
                type="url"
                className="form-control"
                placeholder="https://..."
                value={disputeForm.evidenceAttachmentUrl}
                onChange={(e) =>
                  setDisputeForm({
                    ...disputeForm,
                    evidenceAttachmentUrl: e.target.value,
                  })
                }
              />
            </div>

            <div className="d-flex justify-content-end">
              <button
                type="button"
                onClick={() => setShowDisputeModal(false)}
                className="btn btn-secondary mr-2"
                style={{ fontSize: 13.5 }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-danger font-weight-bold"
                style={{ fontSize: 13.5, background: "#EF4444", border: "none" }}
              >
                {isSubmitting ? "Filing Dispute..." : "Submit Dispute & Freeze Request"}
              </button>
            </div>
          </form>
        </div>
      </DefaultModal>
    </Layout>
  );
}

const Wrapper = styled.main`
  width: 100vw;
  .Top {
    .user-details {
      max-width: 300px;
    }
    .campaign-details {
      .campaign-image {
        width: 209px;
        height: 221px;
        @media screen and (max-width: 767px) {
          width: 100%;
          height: 300px;
        }
      }
      .details {
        width: 100%;
        max-width: 300px;
      }
      @media screen and (max-width: 767px) {
        flex-wrap: wrap;
      }
    }
    h4 {
      font-style: normal;
      font-weight: bold;
      font-size: 18px;
      line-height: 30px;
      color: #514949;
    }
    .progress {
      height: 5px !important;
      background-color: #697af821 !important;
    }
    .progressbar {
      background-color: var(--color-primary) !important;
    }
  }

  .bottom {
    section {
      max-width: 700px;
      @media screen and (max-width: 767px) {
        max-width: unset;
      }
    }
  }

  .numbers {
    max-width: 900px;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    row-gap: 4.5rem;
    column-gap: 2.5rem;

    @media screen and (min-width: 768px) and (max-width: 1023px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media screen and (max-width: 767px) {
      grid-template-columns: repeat(1, minmax(0, 1fr));
    }
    h4 {
      font-weight: 700;
    }
  }
`;
