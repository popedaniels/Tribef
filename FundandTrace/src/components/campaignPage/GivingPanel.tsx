import { useEffect, useState } from "react";
import Link from "next/link";
import api from "../../utils/api";
import { formatMoney } from "../helperFunctions/helperFunctions";
import styles from "./GivingPanel.module.scss";

type Team = { id: string; name: string; slug: string; captainName?: string; goal: number; raised: number; donations: number };
type Matching = { live: boolean; sponsorName: string; ratio: number; cap: number; pledged: number; received: number; remaining: number };

/** Matched-giving banner and team leaderboard (FT-042). Renders nothing when neither is set up. */
export default function GivingPanel({ campaignId, currency }: { campaignId: string; currency: string }) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [matching, setMatching] = useState<Matching | null>(null);
  useEffect(() => {
    api
      .get(`/api/giving/campaign/${campaignId}`)
      .then((r) => {
        setTeams(r.data?.data?.teams || []);
        setMatching(r.data?.data?.matching || null);
      })
      .catch(() => {});
  }, [campaignId]);

  if (!teams.length && !matching) return null;
  const top = teams.slice(0, 5);
  const best = Math.max(1, ...top.map((t) => t.raised));

  return (
    <section className={styles.panel} aria-labelledby="giving-heading">
      <h2 id="giving-heading" className="sr-only">
        Matching and teams
      </h2>
      {matching && (
        <div className={`${styles.match} ${matching.live ? "" : styles.matchDone}`}>
          <p>
            <strong>{matching.sponsorName}</strong>{" "}
            {matching.live
              ? `is matching donations${matching.ratio !== 1 ? ` ${matching.ratio}×` : ""}: ${formatMoney(matching.remaining, currency)} of matching left.`
              : "matched donations to this campaign."}
          </p>
          <p className="ft-muted">
            {formatMoney(matching.pledged, currency)} pledged · {formatMoney(matching.received, currency)} received so far. Pledges are added to the
            campaign when the sponsor pays.
          </p>
        </div>
      )}
      {top.length > 0 && (
        <>
          <h3 className={styles.title}>Team leaderboard</h3>
          <ol className={styles.teams}>
            {top.map((t) => (
              <li key={t.id}>
                <div className={styles.teamHead}>
                  <span>{t.name}</span>
                  <span>{formatMoney(t.raised, currency)}</span>
                </div>
                <div className={styles.bar} aria-hidden="true">
                  <span style={{ width: `${Math.round((100 * t.raised) / best)}%` }} />
                </div>
                <Link href={`/donate/${campaignId}?team=${encodeURIComponent(t.slug)}`} className={styles.teamLink}>
                  Donate with {t.name}
                </Link>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
