import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import type { GetServerSidePropsContext } from "next";

import api from "../../../utils/api";
import { apiUrl } from "../../../utils/evidence";
import { cdnImage, responsiveImage } from "../../../utils/cloudinary";
import Layout from "../../../components/Layout";
import Navbar from "../../../components/Navbar/Navbar";
import Footer from "../../../components/Footer/Footer";
import TopCampaignSection from "../../../components/homepageComponents/topCampaignSection/TopCampaignSection";
import ShareModal from "../../../components/composed/Modal/DefaultModal/ShareModal";
import DonationsModal from "../../../components/composed/Modal/DefaultModal/DonationsModal";
import ReportCampaignComponent from "../../../components/composed/ReportCampaignComponent";
import FrozenBanner from "../../../components/trust/FrozenBanner";
import TransparencyScore from "../../../components/trust/TransparencyScore";
import GivingPanel from "../../../components/campaignPage/GivingPanel";
import { whatsappShareUrl } from "../../../utils/share";
import { useLowData } from "../../../utils/lowData";
import { youtubeEmbedUrl } from "../../../utils/video";
import {
  formatMoney,
  getDaysRemaining,
  getDualCurrencyEstimate,
  timeAgo,
} from "../../../components/helperFunctions/helperFunctions";
import type { Campaign } from "../../../types/campaign";
import type { Campaign as CampaignSummary } from "../../../types/campaigns";
import styles from "../../../components/campaignPage/CampaignPage.module.scss";

interface PublicDonation {
  donorName?: string;
  amount?: number;
  currency?: string;
  createdAt?: string;
  anonymous?: boolean;
}

type CampaignWithDonations = Campaign & { donations?: PublicDonation[] };

interface CampaignPageProps {
  campaign: CampaignWithDonations | null;
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  try {
    const res = await api.get(`/api/campaigns/campaign/${context.query.id}`);
    return { props: { campaign: res?.data?.data || null } };
  } catch {
    return { props: { campaign: null } };
  }
}

const FALLBACK_IMAGE = "/images/stories/water_story.jpg";
const SITE = "https://fundandtrace.com";

const initials = (name?: string) =>
  String(name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "?";

const donorLabel = (d: PublicDonation) => (d.anonymous || !d.donorName ? "Anonymous" : d.donorName);

type Tab = "story" | "updates" | "comments";

export default function CampaignPage({ campaign }: CampaignPageProps) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("story");
  const { lowData } = useLowData();
  const [videoWanted, setVideoWanted] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reported, setReported] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showDonors, setShowDonors] = useState(false);
  const [related, setRelated] = useState<CampaignSummary[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(true);
  const [imgSrc, setImgSrc] = useState(campaign?.basicInformation?.campaignImage || FALLBACK_IMAGE);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const loadRelated = useCallback(async () => {
    try {
      const res = await api.get("/api/campaigns");
      const list: CampaignSummary[] = res?.data?.data || [];
      setRelated(list.filter((c) => c._id !== router.query.id));
    } catch {
      setRelated([]);
    } finally {
      setRelatedLoading(false);
    }
  }, [router.query.id]);

  useEffect(() => {
    if (router.query.id) loadRelated();
  }, [router.query.id, loadRelated]);

  useEffect(() => {
    setImgSrc(campaign?.basicInformation?.campaignImage || FALLBACK_IMAGE);
  }, [campaign?.basicInformation?.campaignImage]);

  const view = useMemo(() => {
    if (!campaign) return null;
    const currency = campaign.funding?.currency || "USD";
    const raised = Number(campaign.funding?.amountRaised) || 0;
    const goal = Number(campaign.funding?.amountExpected) || 0;
    const pct = goal > 0 ? Math.min(100, Math.round((100 * raised) / goal)) : 0;
    const daysLeft = Math.max(0, Number(getDaysRemaining(campaign)) || 0);
    const donations = Array.isArray(campaign.donations) ? campaign.donations : [];
    const location = [campaign.basicInformation?.locationState, campaign.basicInformation?.locationCountry]
      .filter((s) => s && String(s).trim())
      .join(", ");
    // Approximate goal in a second currency for international donors.
    const intlCurrency = currency === "GBP" ? "USD" : "GBP";
    const est = getDualCurrencyEstimate(goal, currency, intlCurrency);
    const intl = est ? formatMoney(Math.round(Number(String(est.amount).replace(/,/g, ""))), est.currency) : null;
    const updates = [...(campaign.updates || [])].sort(
      (a, b) => new Date(b.datePosted || 0).getTime() - new Date(a.datePosted || 0).getTime()
    );
    const comments = [...(campaign.comments || [])].sort(
      (a, b) => new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime()
    );
    return { currency, raised, goal, pct, daysLeft, donations, location, intl, updates, comments };
  }, [campaign]);

  if (!campaign || !view) {
    return (
      <Layout title="Campaign unavailable" description="This campaign could not be loaded.">
        <Navbar />
        <main className={styles.unavailable}>
          <h1>Campaign unavailable</h1>
          <p>We couldn&apos;t load this campaign. It may have ended or the link may be wrong.</p>
          <Link href="/Categories" className="ft-btn ft-btn--primary">
            Browse campaigns
          </Link>
        </main>
        <Footer />
      </Layout>
    );
  }

  const id = campaign._id;
  const title = campaign.basicInformation?.campaignTitle || "Untitled campaign";
  const isFrozen = Boolean(campaign.disputeGovernance?.isLocked);
  const ended = view.daysLeft === 0;
  const story = (campaign.content?.story || []).filter((p) => p && p.trim());
  const video = campaign.content?.campaignVideo;

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "story", label: "Story" },
    { id: "updates", label: "Updates", count: view.updates.length },
    { id: "comments", label: "Comments", count: view.comments.length },
  ];

  const onTabKey = (e: React.KeyboardEvent, i: number) => {
    const keys: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1 };
    let next = i;
    if (e.key in keys) next = (i + keys[e.key] + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    else return;
    e.preventDefault();
    setTab(tabs[next].id);
    tabRefs.current[next]?.focus();
  };

  const DonateButton = ({ className = "" }: { className?: string }) =>
    isFrozen ? (
      <button type="button" className={`ft-btn ft-btn--primary ft-btn--lg ${className}`} disabled aria-disabled="true">
        Donations paused
      </button>
    ) : ended ? (
      <button type="button" className={`ft-btn ft-btn--primary ft-btn--lg ${className}`} disabled aria-disabled="true">
        Campaign ended
      </button>
    ) : (
      <Link href={`/donate/${id}`} className={`ft-btn ft-btn--primary ft-btn--lg ${className}`}>
        Donate now
      </Link>
    );

  return (
    <Layout
      title={title}
      description={campaign.basicInformation?.campaignTagline || story[0]?.substring(0, 150) || ""}
      ogImage={`${SITE}/api/og/campaign/${id}`}
      url={`${SITE}/campaign/${id}`}
    >
      <Navbar />
      <main className={styles.page}>
        <div className={styles.container}>
          <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
            <Link href="/Categories">Campaigns</Link>
            {campaign.category && (
              <>
                <span aria-hidden="true">/</span>
                <Link href={`/category/${encodeURIComponent(campaign.category.toLowerCase())}`} className={styles.capitalize}>
                  {campaign.category}
                </Link>
              </>
            )}
          </nav>

          <header className={styles.header}>
            <h1>{title}</h1>
            {campaign.basicInformation?.campaignTagline && <p className={styles.tagline}>{campaign.basicInformation.campaignTagline}</p>}
            <div className={styles.meta}>
              <span className={styles.organiser}>
                <span className={styles.avatar} aria-hidden="true">{initials(campaign.organizer)}</span>
                <span>
                  Organised by{" "}
                  {campaign.organizerId ? (
                    <Link href={`/campaign-organizers/${campaign.organizerId}`}>{campaign.organizer || "the organiser"}</Link>
                  ) : (
                    <strong>{campaign.organizer || "the organiser"}</strong>
                  )}
                </span>
              </span>
              {view.location && (
                <span className={styles.metaItem}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                  {view.location}
                </span>
              )}
              {campaign.createdAt && <span className={styles.metaItem}>Started {timeAgo(campaign.createdAt)}</span>}
            </div>
          </header>

          <div className={styles.layout}>
            <div className={styles.main}>
              <figure className={styles.hero}>
                <img
                  src={cdnImage(imgSrc, 1200)}
                  {...responsiveImage(imgSrc, [480, 800, 1200], "(max-width: 900px) 100vw, 760px")}
                  alt={title}
                  // The hero is the largest paint: fetch it first, never lazily.
                  fetchPriority="high"
                  decoding="async"
                  onError={() => setImgSrc(FALLBACK_IMAGE)}
                />
              </figure>

              {/* Mobile: the money summary sits right under the photo. */}
              <div className={styles.mobileSummary}>
                <FundingSummary view={view} />
              </div>

              <div role="tablist" aria-label="Campaign sections" className={styles.tabs}>
                {tabs.map((t, i) => (
                  <button
                    key={t.id}
                    ref={(el) => {
                      tabRefs.current[i] = el;
                    }}
                    type="button"
                    role="tab"
                    id={`tab-${t.id}`}
                    aria-selected={tab === t.id}
                    aria-controls={`panel-${t.id}`}
                    tabIndex={tab === t.id ? 0 : -1}
                    className={`ft-plain ${styles.tab}`}
                    onClick={() => setTab(t.id)}
                    onKeyDown={(e) => onTabKey(e, i)}
                  >
                    {t.label}
                    {t.count ? <span className={styles.tabCount}>{t.count}</span> : null}
                  </button>
                ))}
              </div>

              <section role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className={styles.panel}>
                {tab === "story" && (
                  <div className={styles.story}>
                    {video &&
                      (lowData && !videoWanted ? (
                        <button type="button" className="ft-btn ft-btn--secondary" onClick={() => setVideoWanted(true)}>
                          ▶ Play the campaign video (uses mobile data)
                        </button>
                      ) : youtubeEmbedUrl(video) ? (
                        <div className={styles.video}>
                          <iframe src={youtubeEmbedUrl(video) || undefined} title={`${title} video`} allowFullScreen loading="lazy" />
                        </div>
                      ) : (
                        <video src={video} controls preload={lowData ? "none" : "metadata"} className={styles.videoEl} />
                      ))}
                    {story.length ? story.map((p, i) => <p key={i}>{p}</p>) : <p className="ft-muted">The organiser hasn&apos;t written a story yet.</p>}
                  </div>
                )}

                {tab === "updates" &&
                  (view.updates.length ? (
                    <ol className={styles.timeline}>
                      {view.updates.map((u, i) => (
                        <li key={u._id || i}>
                          <time dateTime={String(u.datePosted || "")}>
                            {u.datePosted ? new Date(u.datePosted).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : ""}
                          </time>
                          {u.evidenceSessionId && (
                            <Link href={`/campaign/${id}/tracker#evidence`} className={styles.sealedTag}>
                              ⛨ Captured live · sealed — verify
                            </Link>
                          )}
                          <p>{u.story}</p>
                          {u.image && <img src={apiUrl(u.image)} alt={u.story ? `Update: ${u.story.slice(0, 80)}` : "Campaign update photo"} className={styles.updateImg} loading="lazy" decoding="async" />}
                          {u.video && <video src={apiUrl(u.video)} controls playsInline preload="metadata" className={styles.updateImg} />}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <div className="ft-empty">
                      <h3>No updates yet</h3>
                      <p>The organiser will post progress here. Payouts and receipts appear on the tracker as soon as they happen.</p>
                      <Link href={`/campaign/${id}/tracker`} className="ft-btn ft-btn--secondary">
                        Open the tracker
                      </Link>
                    </div>
                  ))}

                {tab === "comments" &&
                  (view.comments.length ? (
                    <ul className={styles.comments}>
                      {view.comments.map((c, i) => (
                        <li key={c._id || i}>
                          <span className={styles.avatar} aria-hidden="true">{initials(c.name)}</span>
                          <div>
                            <p className={styles.commentHead}>
                              <strong>{c.name || "Supporter"}</strong>
                              {c.time && <span className="ft-muted"> · {timeAgo(c.time)}</span>}
                            </p>
                            <p>{c.comment}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="ft-empty">
                      <h3>No comments yet</h3>
                      <p>Donors can leave a message of support when they give.</p>
                    </div>
                  ))}
              </section>

              <div className={styles.reportRow}>
                {reported ? (
                  <p className={styles.reported} role="status">Thanks. Your report has been sent to our review team.</p>
                ) : reporting ? (
                  <ReportCampaignComponent
                    submitted={() => {
                      setReporting(false);
                      setReported(true);
                    }}
                  />
                ) : (
                  <button type="button" className="ft-btn ft-btn--quiet" onClick={() => setReporting(true)}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 22V4a1 1 0 0 1 1-1h12l-2 4 2 4H5" /></svg>
                    Report this campaign
                  </button>
                )}
              </div>
            </div>

            <aside className={styles.aside} aria-label="Donate to this campaign">
              <div className={styles.donateCard}>
                {isFrozen && <FrozenBanner lockReason={campaign.disputeGovernance?.lockReason} compact />}
                <div className={styles.desktopSummary}>
                  <FundingSummary view={view} />
                </div>
                <DonateButton className="ft-btn--block" />
                <button type="button" className="ft-btn ft-btn--secondary ft-btn--block" onClick={() => setShowShare(true)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" /></svg>
                  Share
                </button>
                <a
                  className={`ft-btn ft-btn--block ${styles.whatsapp}`}
                  href={whatsappShareUrl({ title, url: `${SITE}/campaign/${id}?ref=wa`, raised: view.raised, goal: view.goal, currency: view.currency })}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.1 1 2.1 1.3 2.4 1.5.3.1.5.1.7-.1l.9-1.1c.2-.3.4-.2.7-.1l2 .9c.3.2.5.2.5.4.1.1.1.7-.1 1.4z" /></svg>
                  Share on WhatsApp
                </a>

                <div className={styles.escrowNote}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>
                  <p>
                    Your gift is held in escrow and released in stages, each one reviewed and recorded on a public ledger.{" "}
                    <Link href={`/campaign/${id}/tracker`}>See every payment</Link>
                  </p>
                </div>
              </div>

              <TransparencyScore campaignId={id} />
              <GivingPanel campaignId={id} currency={view.currency} />

              <section className={styles.donors} aria-labelledby="donors-heading">
                <div className={styles.donorsHead}>
                  <h2 id="donors-heading">
                    Recent donations <span className="ft-muted">({view.donations.length})</span>
                  </h2>
                  {view.donations.length > 5 && (
                    <button type="button" className="ft-btn ft-btn--link" onClick={() => setShowDonors(true)}>
                      See all
                    </button>
                  )}
                </div>
                {view.donations.length ? (
                  <ul>
                    {view.donations.slice(0, 5).map((d, i) => (
                      <li key={i}>
                        <span className={styles.avatar} aria-hidden="true">{initials(donorLabel(d))}</span>
                        <span className={styles.donorName}>{donorLabel(d)}</span>
                        <span className={styles.donorAmount}>
                          {formatMoney(d.amount, d.currency || view.currency)}
                          <span className="ft-muted">{timeAgo(d.createdAt)}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="ft-muted mb-0">Be the first to donate.</p>
                )}
              </section>
            </aside>
          </div>
        </div>

        <TopCampaignSection heading="More campaigns you can support" tag="Keep exploring" data={related} loading={relatedLoading} />
      </main>

      {/* Mobile action bar */}
      <div className={styles.mobileBar}>
        <button type="button" className="ft-btn ft-btn--secondary" aria-label="Share this campaign" onClick={() => setShowShare(true)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" /></svg>
        </button>
        <a
          className={`ft-btn ${styles.whatsappIcon}`}
          href={whatsappShareUrl({ title, url: `${SITE}/campaign/${id}?ref=wa`, raised: view.raised, goal: view.goal, currency: view.currency })}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on WhatsApp"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.1 1 2.1 1.3 2.4 1.5.3.1.5.1.7-.1l.9-1.1c.2-.3.4-.2.7-.1l2 .9c.3.2.5.2.5.4.1.1.1.7-.1 1.4z" /></svg>
        </a>
        <DonateButton className={styles.mobileDonate} />
      </div>

      <Footer />
      <ShareModal campaign={campaign} showModal={showShare} onModalClose={() => setShowShare(false)} />
      <DonationsModal
        donations={campaign.donations}
        campaignId={id}
        showModal={showDonors}
        onModalClose={() => setShowDonors(false)}
        campaign={campaign}
      />
    </Layout>
  );
}

interface SummaryView {
  currency: string;
  raised: number;
  goal: number;
  pct: number;
  daysLeft: number;
  donations: PublicDonation[];
  intl: string | null;
}

function FundingSummary({ view }: { view: SummaryView }) {
  return (
    <div className={styles.summary}>
      <p className={styles.raised}>
        <strong>{formatMoney(view.raised, view.currency)}</strong>
        <span>
          raised of {formatMoney(view.goal, view.currency)}
          {view.intl && <span className={styles.intl}> (≈ {view.intl})</span>}
        </span>
      </p>
      <div
        className="ft-progress"
        role="progressbar"
        aria-label="Funding progress"
        aria-valuenow={view.pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span style={{ width: `${view.pct}%` }} />
      </div>
      <dl className={styles.stats}>
        <div>
          <dt>funded</dt>
          <dd>{view.pct}%</dd>
        </div>
        <div>
          <dt>{view.donations.length === 1 ? "donation" : "donations"}</dt>
          <dd>{view.donations.length}</dd>
        </div>
        <div>
          <dt>{view.daysLeft === 1 ? "day left" : "days left"}</dt>
          <dd>{view.daysLeft}</dd>
        </div>
      </dl>
    </div>
  );
}
