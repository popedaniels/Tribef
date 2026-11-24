import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import axios from "axios";
import { useSelector } from "react-redux";
import type { GetServerSidePropsContext } from "next";

import Layout from "../../components/Layout";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import TopCampaignSection from "../../components/homepageComponents/topCampaignSection/TopCampaignSection";
import CommentModal from "../../components/composed/Modal/DefaultModal/CommentModal";
import ShareModal from "../../components/composed/Modal/DefaultModal/ShareModal";
import { whatsappShareUrl } from "../../utils/share";
import { formatMoney } from "../../components/helperFunctions/helperFunctions";
import { toast } from "../../../store/slices/ToastSlice";
import { selectAuthStateState } from "../../../store/slices/authSlice";
import { useAppDispatch } from "../../../store/hooks";
import { getApiBaseUrl } from "../../utils/api";
import type { Campaign } from "../../types/campaign";
import type { Campaign as ListedCampaign } from "../../types/campaigns";
import styles from "../../components/campaignPage/DonatedPage.module.scss";

interface DonatedPageProps {
  campaign: Campaign | null;
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  try {
    const res = await axios.get(`${getApiBaseUrl()}/api/campaigns/campaign/${context.query.id}`, { timeout: 3000 });
    return { props: { campaign: res?.data?.data || null } };
  } catch {
    return { props: { campaign: null } };
  }
}

const q = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || "";

export default function DonatedPage({ campaign }: DonatedPageProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { authenticated } = useSelector(selectAuthStateState);
  const [related, setRelated] = useState<ListedCampaign[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(true);
  const [showComment, setShowComment] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [follow, setFollow] = useState<"ask" | "saving" | "yes" | "no">("ask");

  const status = q(router.query.status);
  const name = q(router.query.name);
  const email = q(router.query.email);
  const amount = Number(q(router.query.amount));
  const campaignId = q(router.query.campaignId) || campaign?._id || "";
  const monthlyStarted = status === "subscription_started";
  const success = status === "successful" || monthlyStarted;

  useEffect(() => {
    axios
      .get(`${getApiBaseUrl()}/api/campaigns`)
      .then((r) => setRelated((r?.data?.data || []).filter((c: ListedCampaign) => c._id !== campaign?._id)))
      .catch(() => setRelated([]))
      .finally(() => setRelatedLoading(false));
  }, [campaign?._id]);

  const followCampaign = async () => {
    setFollow("saving");
    try {
      await axios.post(`${getApiBaseUrl()}/api/campaignEmailWhitelist`, { email, campaignId });
      setFollow("yes");
    } catch (error) {
      const e = error as { response?: { data?: { error?: string } } };
      const msg = e?.response?.data?.error || "";
      // Already following counts as success.
      if (/already/i.test(msg)) setFollow("yes");
      else {
        setFollow("ask");
        dispatch(toast(true, msg || "We couldn't save that. Please try again.", "error"));
      }
    }
  };

  const title = campaign?.basicInformation?.campaignTitle || "this campaign";
  const currency = campaign?.funding?.currency || "USD";
  const firstName = name.split(" ")[0];

  return (
    <Layout title={success ? `Thank you · ${title}` : `Donation · ${title}`} description={`Your donation to ${title}`} ogImage={campaign?._id ? `https://fundandtrace.com/api/og/campaign/${campaign._id}` : undefined}>
      <Navbar />
      <main className={styles.page}>
        <div className={styles.container}>
          {success ? (
            <section className={styles.hero} aria-labelledby="thanks-title">
              <span className={styles.check} aria-hidden="true">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5 9-9" /></svg>
              </span>
              <h1 id="thanks-title">Thank you{firstName ? `, ${firstName}` : ""}!</h1>
              <p className={styles.lead}>
                {monthlyStarted ? (
                  <>
                    Your monthly gift to <strong>{title}</strong> is set up. You can change or cancel it any time under Dashboard → Subscriptions.
                  </>
                ) : (
                  <>
                    Your {amount > 0 ? <strong>{formatMoney(amount, currency)}</strong> : "donation"} to <strong>{title}</strong> is confirmed.
                  </>
                )}
                {email ? <> A receipt is on its way to <strong>{email}</strong>.</> : " A receipt is on its way to your inbox."}
              </p>
            </section>
          ) : (
            <section className={styles.hero} aria-labelledby="thanks-title">
              <h1 id="thanks-title">We&apos;re confirming your payment</h1>
              <p className={styles.lead}>
                If your payment went through, you&apos;ll get a receipt by email within a few minutes. If you don&apos;t, you haven&apos;t been charged
                and you can try again.
              </p>
              {campaign?._id && (
                <Link href={`/donate/${campaign._id}`} className="ft-btn ft-btn--secondary">
                  Back to the donation page
                </Link>
              )}
            </section>
          )}

          {success && (
            <>
              <section className={styles.next} aria-labelledby="next-title">
                <h2 id="next-title">What happens to your money</h2>
                <ol>
                  <li>
                    <strong>It&apos;s held in escrow.</strong> The organiser can&apos;t withdraw it in one go.
                  </li>
                  <li>
                    <strong>It&apos;s released in stages.</strong> Each payout is a request with a stated purpose that our team reviews. Where possible
                    it&apos;s paid straight to the supplier.
                  </li>
                  <li>
                    <strong>You can check every step.</strong> Payouts, receipts and your donation are on the campaign&apos;s public ledger.
                  </li>
                </ol>
                {campaign?._id && (
                  <Link href={`/campaign/${campaign._id}/tracker`} className="ft-btn ft-btn--link">
                    Open the money tracker →
                  </Link>
                )}
              </section>

              <div className={styles.actions}>
                <section className={styles.card} aria-labelledby="follow-title">
                  <h2 id="follow-title">Get spending updates</h2>
                  {follow === "yes" ? (
                    <p className={styles.ok} role="status">
                      Done. We&apos;ll email {email || "you"} whenever money is paid out from this campaign.
                    </p>
                  ) : follow === "no" ? (
                    <p className="ft-muted">No problem. You can always check the tracker.</p>
                  ) : (
                    <>
                      <p>We&apos;ll email you each time money is paid out, with what it was for.</p>
                      <div className={styles.buttons}>
                        <button type="button" className="ft-btn ft-btn--primary" onClick={followCampaign} disabled={!email || follow === "saving"}>
                          {follow === "saving" ? "Saving…" : "Yes, email me updates"}
                        </button>
                        <button type="button" className="ft-btn ft-btn--quiet" onClick={() => setFollow("no")}>
                          No thanks
                        </button>
                      </div>
                    </>
                  )}
                </section>

                <section className={styles.card} aria-labelledby="share-title">
                  <h2 id="share-title">Help it reach its goal</h2>
                  <p>Campaigns shared by donors raise far more. One message to friends or family makes a difference.</p>
                  <div className={styles.buttons}>
                    {campaign && (
                      <a
                        className="ft-btn ft-btn--primary"
                        style={{ background: "#075e54", borderColor: "#075e54" }}
                        href={whatsappShareUrl({
                          title,
                          url: `https://fundandtrace.com/campaign/${campaign._id}?ref=wa`,
                          raised: Number(campaign.funding?.amountRaised) || 0,
                          goal: Number(campaign.funding?.amountExpected) || 0,
                          currency,
                          donated: amount,
                        })}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Share on WhatsApp
                      </a>
                    )}
                    <button type="button" className="ft-btn ft-btn--secondary" onClick={() => setShowShare(true)}>
                      More ways to share
                    </button>
                    {authenticated && (
                      <button type="button" className="ft-btn ft-btn--quiet" onClick={() => setShowComment(true)}>
                        Leave a message
                      </button>
                    )}
                  </div>
                </section>
              </div>

              {!authenticated && (
                <p className={styles.account}>
                  <Link href="/SignUp">Create a free account</Link> to see all your donations in one place and request refunds.
                </p>
              )}
            </>
          )}
        </div>

        <TopCampaignSection heading="Other campaigns that need support" tag="Keep giving" data={related} loading={relatedLoading} />
      </main>
      <Footer />
      {campaign && <ShareModal campaign={campaign} showModal={showShare} onModalClose={() => setShowShare(false)} />}
      <CommentModal
        details={{ name, email, campaignId, time: Date.now() }}
        showModal={showComment}
        onModalClose={() => setShowComment(false)}
      />
    </Layout>
  );
}
