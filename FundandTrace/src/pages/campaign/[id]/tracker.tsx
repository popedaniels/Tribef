import axios from "axios";
import React, { useState } from "react";
import Navbar from "../../../components/Navbar/Navbar";
import PaymentHistoryCard from "../../../components/PaymentHistoryCard/PaymentHistoryCard";
import TransparencyScore from "../../../components/trust/TransparencyScore";
import PublicLedger from "../../../components/trust/PublicLedger";
import Layout from "../../../components/Layout";
import DisbursementCard from "../../../components/DisbursementCard/DisbursementCard";
import Link from "next/link";
import { formatMoney } from "../../../components/helperFunctions/helperFunctions";
import FrozenBanner from "../../../components/trust/FrozenBanner";
import styles from "../../../components/campaignPage/TrackerPage.module.scss";
import DefaultModal from "../../../components/composed/Modal/DefaultModal/DefaultModal";
import { useSelector } from "react-redux";
import { toast } from "../../../../store/slices/ToastSlice";
import { selectAuthStateState } from "../../../../store/slices/authSlice";
import { useAppDispatch } from "./../../../../store/hooks";
import { Campaign } from "../../../types/campaign";
import type { GetServerSidePropsContext } from "next";
import { getApiBaseUrl } from "../../../utils/api";

interface Disbursement {
  amount?: number;
  currency?: string;
  dateDisbursed?: string | Date;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  receipt?: string;
  providerStatus?: string;
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
    const apiUrl = getApiBaseUrl();
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
  const [view, setView] = useState("disbursements");
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
      dispatch(toast(true, "Please enter the email you donated with.", "error"));
      return;
    }
    if (!disputeForm.description) {
      dispatch(toast(true, "Please tell us what you found.", "error"));
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axios.post(
        `${getApiBaseUrl()}/api/campaigns/${campaign?._id}/dispute`,
        {
          donorId: profile?._id,
          ...disputeForm,
        }
      );

      if (res.data?.status === 200) {
        dispatch(toast(true, "Thanks. Your report has been sent to our review team.", "success"));
        if (res.data?.data?.isLocked) {
          setIsLocked(true);
          setLockReason(res.data.data.lockReason);
          dispatch(
            toast(
              true,
              "Payouts for this campaign are now paused while we review it.",
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

  const currency = campaign?.funding?.currency || "USD";
  const paidOut = (approvedFundingRequests || []).reduce(
    (sum, fr) => sum + (fr?.disbursement?.providerStatus === "failed" ? 0 : Number(fr?.disbursement?.amount) || 0),
    0
  );
  const raised = Number(campaign?.funding?.amountRaised) || 0;
  const held = Number.isFinite(Number(campaign?.funding?.availableBalance))
    ? Number(campaign?.funding?.availableBalance)
    : Math.max(0, raised - paidOut);
  const pending = (allFundingRequests || []).filter((fr) => fr?.status === "Pending").length;
  const organiserName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || campaign?.organizer || "The organiser";
  const title = campaign?.basicInformation?.campaignTitle || "Campaign";

  if (!campaign) {
    return (
      <Layout title="Tracker unavailable" description="This campaign's tracker could not be loaded." showFooter>
        <Navbar />
        <main className={styles.unavailable}>
          <h1>Tracker unavailable</h1>
          <p>We couldn&apos;t load this campaign&apos;s money trail right now. Please try again shortly.</p>
          <Link href="/Categories" className="ft-btn ft-btn--primary">Browse campaigns</Link>
        </main>
      </Layout>
    );
  }

  const tabs = [
    { id: "disbursements", label: "Payouts", count: approvedFundingRequests?.length || 0 },
    { id: "fundingRequests", label: "All requests", count: allFundingRequests?.length || 0 },
  ];

  return (
    <Layout
      title={`Money tracker · ${title}`}
      description={`Every donation, payout and receipt for "${title}", on a public, verifiable ledger.`}
      ogImage={campaign?.basicInformation?.campaignImage}
      showFooter
    >
      <Navbar />
      <main className={styles.page}>
        <div className={styles.container}>
          <Link href={`/campaign/${campaign._id}`} className={styles.back}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
            Back to campaign
          </Link>

          {isLocked && (
            <div className={styles.frozen}>
              <FrozenBanner lockReason={lockReason} />
            </div>
          )}

          <header className={styles.header}>
            <img
              src={campaign?.basicInformation?.campaignImage || "/images/stories/water_story.jpg"}
              alt=""
              className={styles.thumb}
            />
            <div>
              <span className="ft-eyebrow">Money tracker</span>
              <h1>{title}</h1>
              <p>
                Organised by <strong>{organiserName}</strong>. Every donation, payout and receipt for this campaign appears here as it happens.
              </p>
            </div>
          </header>

          <dl className={styles.stats}>
            <div>
              <dt>Raised</dt>
              <dd>{formatMoney(raised, currency)}</dd>
              <dd className={styles.sub}>{campaign?.donations?.length || 0} donations</dd>
            </div>
            <div>
              <dt>Paid out</dt>
              <dd className={styles.ok}>{formatMoney(paidOut, currency)}</dd>
              <dd className={styles.sub}>{approvedFundingRequests?.length || 0} payouts</dd>
            </div>
            <div>
              <dt>Held in escrow</dt>
              <dd>{formatMoney(held, currency)}</dd>
              <dd className={styles.sub}>Released only on approved requests</dd>
            </div>
            <div>
              <dt>Awaiting review</dt>
              <dd>{pending}</dd>
              <dd className={styles.sub}>{pending === 1 ? "funding request" : "funding requests"}</dd>
            </div>
          </dl>

          <div className={styles.grid}>
            <section className={styles.timelineCol} aria-labelledby="money-trail">
              <div className={styles.sectionHead}>
                <h2 id="money-trail">Where the money went</h2>
              </div>
              <div role="tablist" aria-label="Payout history" className={styles.tabs}>
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    id={`tab-${t.id}`}
                    aria-selected={view === t.id}
                    aria-controls={`panel-${t.id}`}
                    className={`ft-plain ${styles.tab}`}
                    onClick={() => setView(t.id)}
                  >
                    {t.label} <span className={styles.tabCount}>{t.count}</span>
                  </button>
                ))}
              </div>

              <div role="tabpanel" id={`panel-${view}`} aria-labelledby={`tab-${view}`}>
                {view === "fundingRequests" ? (
                  allFundingRequests?.length ? (
                    allFundingRequests.map((fundingRequest, i) => (
                      <PaymentHistoryCard
                        fundingRequest={fundingRequest}
                        key={fundingRequest?._id || i}
                        last={i === allFundingRequests.length - 1}
                      />
                    ))
                  ) : (
                    <div className="ft-empty">
                      <h3>No funding requests yet</h3>
                      <p>When the organiser asks for money from escrow, the request and its purpose appear here before anything is paid.</p>
                    </div>
                  )
                ) : approvedFundingRequests?.length ? (
                  approvedFundingRequests.map((fundingRequest, i) => (
                    <DisbursementCard
                      disbursement={fundingRequest?.disbursement}
                      fundingRequest={fundingRequest}
                      key={fundingRequest?._id || i}
                      last={i === approvedFundingRequests.length - 1}
                    />
                  ))
                ) : (
                  <div className="ft-empty">
                    <h3>Nothing paid out yet</h3>
                    <p>All {formatMoney(raised, currency)} raised so far is still held in escrow.</p>
                  </div>
                )}
              </div>
            </section>

            <aside className={styles.sideCol}>
              <TransparencyScore campaignId={campaign._id} initiallyOpen />
              <div className={styles.reportCard}>
                <h2>Something doesn&apos;t add up?</h2>
                <p>
                  If a receipt looks wrong or work hasn&apos;t happened, tell us. When enough donors report a problem, payouts freeze automatically
                  while our team reviews.
                </p>
                <button type="button" className="ft-btn ft-btn--secondary ft-btn--block" onClick={() => setShowDisputeModal(true)}>
                  Report a problem
                </button>
              </div>
            </aside>
          </div>

          <PublicLedger campaignId={campaign._id} />
        </div>
      </main>

      <DefaultModal showModal={showDisputeModal} onModalClose={() => setShowDisputeModal(false)}>
        <div className={styles.dispute}>
          <div className="d-flex justify-content-between align-items-start mb-2">
            <h2 id="dispute-title">Report a problem with this campaign</h2>
            <button type="button" onClick={() => setShowDisputeModal(false)} className={`ft-plain ${styles.close}`} aria-label="Close">
              ✕
            </button>
          </div>
          <p className="ft-muted">
            Reports go to our review team. If enough donors report the same campaign, its payouts are frozen until we&apos;ve checked it.
          </p>

          <form onSubmit={handleDisputeSubmit}>
            <div className="mb-3">
              <label htmlFor="disputeEmail">Your email (the one you donated with)</label>
              <input
                id="disputeEmail"
                type="email"
                required
                className="form-control"
                autoComplete="email"
                value={disputeForm.donorEmail}
                onChange={(e) => setDisputeForm({ ...disputeForm, donorEmail: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <label htmlFor="disputeCategory">What&apos;s the problem?</label>
              <select
                id="disputeCategory"
                className="form-control"
                value={disputeForm.disputeCategory}
                onChange={(e) => setDisputeForm({ ...disputeForm, disputeCategory: e.target.value })}
              >
                <option value="Fake Evidence / Altered Receipt">A receipt or proof looks fake or altered</option>
                <option value="Misappropriation of Funds">Money isn&apos;t being used as promised</option>
                <option value="Inactive / Abandoned Milestone">Nothing has happened / campaign abandoned</option>
                <option value="Identity Mismatch">The organiser isn&apos;t who they say</option>
                <option value="Other">Something else</option>
              </select>
            </div>
            <div className="mb-3">
              <label htmlFor="disputeDescription">Tell us what you found</label>
              <textarea
                id="disputeDescription"
                required
                rows={4}
                className="form-control"
                value={disputeForm.description}
                onChange={(e) => setDisputeForm({ ...disputeForm, description: e.target.value })}
              />
            </div>
            <div className="mb-4">
              <label htmlFor="disputeEvidence">
                Link to evidence <span className="ft-muted">(optional)</span>
              </label>
              <input
                id="disputeEvidence"
                type="url"
                className="form-control"
                placeholder="https://"
                value={disputeForm.evidenceAttachmentUrl}
                onChange={(e) => setDisputeForm({ ...disputeForm, evidenceAttachmentUrl: e.target.value })}
              />
            </div>
            <div className="d-flex justify-content-end" style={{ gap: 10 }}>
              <button type="button" onClick={() => setShowDisputeModal(false)} className="ft-btn ft-btn--secondary">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting} className="ft-btn ft-btn--primary">
                {isSubmitting ? "Sending…" : "Send report"}
              </button>
            </div>
          </form>
        </div>
      </DefaultModal>
    </Layout>
  );
}
