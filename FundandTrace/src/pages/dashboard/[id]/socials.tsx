import axios from "axios";
import type { GetServerSidePropsContext } from "next";
import { useCallback, useEffect, useState } from "react";
import { useAppDispatch } from "../../../../store/hooks";
import type { Campaign } from "../../../types/campaign";
import CampaignDashboardLayout from "../../../layouts/CampaignDashboardLayout";
import api, { getApiBaseUrl } from "../../../utils/api";
import { whatsappShareUrl } from "../../../utils/share";
import { formatMoney } from "../../../components/helperFunctions/helperFunctions";
import { toast } from "../../../../store/slices/ToastSlice";
import styles from "../../../components/campaignPage/SharePage.module.scss";

interface SocialsProps {
  campaign: Campaign | null;
  campaignId: GetServerSidePropsContext["query"]["id"];
}
type Team = { id: string; name: string; slug: string; captainName?: string; raised: number; donations: number };

const SITE = "https://fundandtrace.com";

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const campaignId = context.query.id;
  try {
    const res = await axios.get(`${getApiBaseUrl()}/api/campaigns/campaign/${campaignId}`, { timeout: 4000 });
    return { props: { campaign: res?.data?.data || null, campaignId } };
  } catch {
    return { props: { campaign: null, campaignId } };
  }
}

export default function Socials({ campaign, campaignId }: SocialsProps) {
  const dispatch = useAppDispatch();
  const id = String(campaignId || "");
  const title = campaign?.basicInformation?.campaignTitle || "my campaign";
  const currency = campaign?.funding?.currency || "USD";
  const link = `${SITE}/campaign/${id}`;
  const [teams, setTeams] = useState<Team[]>([]);
  const [name, setName] = useState("");
  const [captain, setCaptain] = useState("");
  const [busy, setBusy] = useState(false);

  const loadTeams = useCallback(() => {
    api.get(`/api/giving/campaign/${id}`).then((r) => setTeams(r.data?.data?.teams || [])).catch(() => {});
  }, [id]);
  useEffect(loadTeams, [loadTeams]);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      dispatch(toast(true, "Link copied", "success"));
    } catch {
      dispatch(toast(true, "Couldn't copy. Select the link and copy it instead.", "error"));
    }
  };

  const addTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return;
    setBusy(true);
    try {
      await api.post(`/api/giving/campaign/${id}/teams`, { name: name.trim(), captainName: captain.trim() });
      setName("");
      setCaptain("");
      loadTeams();
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      dispatch(toast(true, msg || "Couldn't create the team.", "error"));
    } finally {
      setBusy(false);
    }
  };

  const removeTeam = async (t: Team) => {
    try {
      await api.delete(`/api/giving/campaign/${id}/teams/${t.id}`);
      loadTeams();
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      dispatch(toast(true, msg || "Couldn't delete the team.", "error"));
    }
  };

  const enc = encodeURIComponent;
  const shares = [
    { label: "WhatsApp", href: whatsappShareUrl({ title, url: `${link}?ref=wa`, raised: Number(campaign?.funding?.amountRaised) || 0, goal: Number(campaign?.funding?.amountExpected) || 0, currency }) },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${enc(`${link}?ref=fb`)}` },
    { label: "X", href: `https://x.com/intent/post?text=${enc(`Please support "${title}"`)}&url=${enc(`${link}?ref=x`)}` },
    { label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(`${link}?ref=li`)}` },
  ];

  return (
    <CampaignDashboardLayout active={3} campaignId={campaignId} title={title} page="Share">
      <div className={styles.page}>
        <section className={styles.card} aria-labelledby="share-heading">
          <h2 id="share-heading">Share your campaign</h2>
          <p className="ft-muted">This is the preview people see when you share the link. It updates as donations come in.</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.preview} src={`/api/og/campaign/${id}`} alt={`Share preview for ${title}`} width={1200} height={630} loading="lazy" />
          <div className={styles.buttons}>
            {shares.map((s) => (
              <a key={s.label} className={`ft-btn ${s.label === "WhatsApp" ? styles.wa : "ft-btn--secondary"}`} href={s.href} target="_blank" rel="noopener noreferrer">
                {s.label}
              </a>
            ))}
          </div>
          <div className={styles.linkRow}>
            <input readOnly value={link} aria-label="Campaign link" onFocus={(e) => e.currentTarget.select()} />
            <button type="button" className="ft-btn ft-btn--primary" onClick={() => copy(link)}>
              Copy link
            </button>
          </div>
        </section>

        <section className={styles.card} aria-labelledby="teams-heading">
          <h2 id="teams-heading">Fundraising teams</h2>
          <p className="ft-muted">
            Let supporters fundraise as a team, such as a running club, a church or an office. Each team gets its own link, donations are credited to it, and a leaderboard shows on your
            campaign page.
          </p>
          <form className={styles.teamForm} onSubmit={addTeam}>
            <label>
              <span>Team name</span>
              <input className="form-control" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} placeholder="e.g. Kaduna Runners" />
            </label>
            <label>
              <span>
                Captain <span className="ft-muted">(optional)</span>
              </span>
              <input className="form-control" value={captain} maxLength={60} onChange={(e) => setCaptain(e.target.value)} />
            </label>
            <button type="submit" className="ft-btn ft-btn--primary" disabled={busy || name.trim().length < 2}>
              {busy ? "Adding…" : "Add team"}
            </button>
          </form>
          {teams.length > 0 ? (
            <ul className={styles.teams}>
              {teams.map((t) => {
                const teamLink = `${SITE}/donate/${id}?team=${t.slug}`;
                return (
                  <li key={t.id}>
                    <div>
                      <strong>{t.name}</strong>
                      <span className="ft-muted">
                        {" "}
                        · {formatMoney(t.raised, currency)} from {t.donations} donation{t.donations === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className={styles.teamActions}>
                      <button type="button" className="ft-btn ft-btn--secondary" onClick={() => copy(teamLink)}>
                        Copy team link
                      </button>
                      {t.donations === 0 && (
                        <button type="button" className="ft-btn ft-btn--quiet" onClick={() => removeTeam(t)}>
                          Delete
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="ft-muted mb-0">No teams yet.</p>
          )}
        </section>

        <section className={styles.card} aria-labelledby="match-heading">
          <h2 id="match-heading">Matched giving</h2>
          <p className="ft-muted mb-0">
            Have a business or donor willing to match gifts? Email <a href="mailto:support@fundandtrace.com">support@fundandtrace.com</a> with their details. We confirm the sponsor before the
            &quot;matched&quot; banner goes live, so donors can trust it.
          </p>
        </section>
      </div>
    </CampaignDashboardLayout>
  );
}
