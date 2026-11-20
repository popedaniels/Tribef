import React, { useEffect, useState } from "react";
import axios from "axios";
import { getApiBaseUrl } from "../../utils/api";
import styles from "./trust.module.scss";

export type ScoreFactor = { key: string; label: string; points: number; max: number; detail: string };
export type ScoreResult = { score: number; grade: string; factors: ScoreFactor[]; proofOverdue: string[] };

const toneFor = (score: number) => (score >= 85 ? "excellent" : score >= 70 ? "strong" : score >= 50 ? "fair" : "low");

/** Ring + grade; expandable list of the facts behind the score. */
export default function TransparencyScore({ campaignId, initiallyOpen = false }: { campaignId?: string; initiallyOpen?: boolean }) {
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(initiallyOpen);

  useEffect(() => {
    if (!campaignId) return;
    let alive = true;
    axios
      .get(`${getApiBaseUrl()}/api/campaigns/${campaignId}/transparency`, { timeout: 8000 })
      .then((r) => alive && setResult(r.data?.data || null))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [campaignId]);

  if (failed || !campaignId) return null;
  if (!result) {
    return <div className={styles.scoreSkeleton} aria-hidden="true" />;
  }

  const tone = toneFor(result.score);
  const circumference = 2 * Math.PI * 26;
  return (
    <section className={styles.scoreCard} aria-labelledby={`score-${campaignId}`}>
      <div className={styles.scoreHeader}>
        <svg className={`${styles.ring} ${styles[tone]}`} viewBox="0 0 64 64" role="img" aria-label={`Transparency Score ${result.score} out of 100`}>
          <circle cx="32" cy="32" r="26" className={styles.ringTrack} />
          <circle
            cx="32"
            cy="32"
            r="26"
            className={styles.ringValue}
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - result.score / 100)}
          />
          <text x="32" y="37" textAnchor="middle" className={styles.ringText}>
            {result.score}
          </text>
        </svg>
        <div className={styles.scoreMeta}>
          <p id={`score-${campaignId}`} className={styles.scoreLabel}>
            Transparency Score
          </p>
          <p className={`${styles.scoreGrade} ${styles[tone]}`}>{result.grade}</p>
          <button type="button" className={styles.linkButton} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            {open ? "Hide how it's calculated" : "How it's calculated"}
          </button>
        </div>
      </div>
      {open && (
        <ul className={styles.factors}>
          {result.factors.map((f) => (
            <li key={f.key} className={styles.factor}>
              <div className={styles.factorTop}>
                <span>{f.label}</span>
                <span className={styles.factorPoints}>
                  {f.points}/{f.max}
                </span>
              </div>
              <div className={styles.factorBar} aria-hidden="true">
                <span style={{ width: `${(100 * f.points) / f.max}%` }} />
              </div>
              <p className={styles.factorDetail}>{f.detail}</p>
            </li>
          ))}
          <li className={styles.factorNote}>Calculated only from facts Fund&amp;Trace can verify. Updated continuously.</li>
        </ul>
      )}
    </section>
  );
}
