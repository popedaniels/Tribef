import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { getApiBaseUrl } from "../../utils/api";
import styles from "./trust.module.scss";
import { formatMoney } from "../helperFunctions/helperFunctions";

type Entry = {
  campaignId: string;
  seq: number;
  type: "credit" | "payout" | "payout_reversal" | "refund";
  amount: number;
  currency: string;
  refId: string;
  memo: string;
  at: string;
  prevHash: string;
  hash: string;
};

const GENESIS = "0".repeat(64);
const LABELS: Record<Entry["type"], string> = {
  credit: "Donation received",
  payout: "Payout",
  payout_reversal: "Payout returned",
  refund: "Refund to donor",
};

const round2 = (n: number) => Math.round(Number(n) * 100) / 100;

/** Same canonical form as services/ledger.js on the server. */
export const canonicalEntry = (e: Entry) =>
  JSON.stringify([
    String(e.campaignId),
    Number(e.seq),
    String(e.type),
    round2(e.amount).toFixed(2),
    String(e.currency || "").toUpperCase(),
    String(e.refId),
    String(e.memo || ""),
    new Date(e.at).toISOString(),
    String(e.prevHash),
  ]);

const sha256 = async (text: string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

/** Recompute the whole chain in the visitor's browser — no trust in our server needed. */
export async function verifyChainInBrowser(entries: Entry[]) {
  let prev = GENESIS;
  for (let i = 0; i < entries.length; i += 1) {
    const e = entries[i];
    if (e.seq !== i + 1 || e.prevHash !== prev || (await sha256(canonicalEntry(e))) !== e.hash) {
      return { valid: false, brokenAt: e.seq };
    }
    prev = e.hash;
  }
  return { valid: true, head: prev };
}

export type AnchorProof = {
  included: boolean;
  anchor: { date: string; root: string; digest: string; publications?: { target: string; ok: boolean; ref?: string }[] };
  leaf?: { campaignId: string; seq: number; head: string };
  leafHash?: string;
  path?: { hash: string; side: "left" | "right" }[];
};

/**
 * Check, in the browser, that the published daily anchor commits to this
 * campaign's ledger as it stood then, and that today's ledger still has the
 * same entry at that position (so history wasn't rewritten since).
 * Mirrors services/anchoring.js.
 */
export async function verifyAnchorInBrowser(proof: AnchorProof, entries: Entry[]) {
  if (!proof.included || !proof.leaf || !proof.path) return { valid: false, reason: "not included" };
  const { campaignId, seq, head } = proof.leaf;
  let h = await sha256(`ft-leaf:v1:${campaignId}:${seq}:${head}`);
  for (const step of proof.path) {
    h = step.side === "right" ? await sha256(`ft-node:v1:${h}${step.hash}`) : await sha256(`ft-node:v1:${step.hash}${h}`);
  }
  if (h !== proof.anchor.root) return { valid: false, reason: "proof does not lead to the published root" };
  const current = entries.find((e) => e.seq === seq);
  if (!current || current.hash !== head) return { valid: false, reason: `entry #${seq} has changed since ${proof.anchor.date}` };
  return { valid: true, seq, date: proof.anchor.date };
}

const money = (n: number, currency: string) => `${n > 0 ? "+" : ""}${formatMoney(n, currency)}`;

export default function PublicLedger({ campaignId }: { campaignId?: string }) {
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [error, setError] = useState("");
  const [verdict, setVerdict] = useState<{ valid: boolean; brokenAt?: number; head?: string } | null>(null);
  const [checking, setChecking] = useState(false);
  const [proof, setProof] = useState<AnchorProof | null>(null);
  const [anchorVerdict, setAnchorVerdict] = useState<{ valid: boolean; reason?: string; seq?: number; date?: string } | null>(null);

  useEffect(() => {
    if (!campaignId) return;
    axios
      .get(`${getApiBaseUrl()}/api/ledger/${campaignId}?limit=500`, { timeout: 8000 })
      .then((r) => setEntries(r.data?.data?.entries || []))
      .catch(() => setError("The ledger couldn't be loaded right now."));
    axios
      .get(`${getApiBaseUrl()}/api/ledger/${campaignId}/proof`, { timeout: 8000 })
      .then((r) => setProof(r.data?.data || null))
      .catch(() => setProof(null));
  }, [campaignId]);

  const verify = useCallback(async () => {
    if (!entries) return;
    setChecking(true);
    try {
      setVerdict(await verifyChainInBrowser(entries));
      if (proof?.included) setAnchorVerdict(await verifyAnchorInBrowser(proof, entries));
    } finally {
      setChecking(false);
    }
  }, [entries, proof]);

  if (!campaignId) return null;
  return (
    <section className={styles.ledger} aria-labelledby="ledger-title">
      <div className={styles.ledgerHeader}>
        <div>
          <h2 id="ledger-title" className={styles.ledgerTitle}>
            Public ledger
          </h2>
          <p className={styles.ledgerIntro}>
            Every donation, payout and refund, chained together with SHA-256 so no entry can be edited or removed without it
            showing. Check it yourself — the verification runs in your browser.
          </p>
        </div>
        <button type="button" className="ft-btn ft-btn--secondary" onClick={verify} disabled={!entries?.length || checking}>
          {checking ? "Verifying…" : "Verify ledger"}
        </button>
      </div>

      {verdict && (
        <p className={verdict.valid ? styles.verdictOk : styles.verdictBad} role="status">
          {verdict.valid
            ? `✓ Intact: all ${entries?.length} entries match their fingerprints.`
            : `✗ Integrity check failed at entry #${verdict.brokenAt}. Please report this to support.`}
          {verdict.valid && verdict.head ? <code className={styles.hash}>{verdict.head.slice(0, 16)}…</code> : null}
        </p>
      )}

      {anchorVerdict && (
        <p className={anchorVerdict.valid ? styles.verdictOk : styles.verdictBad} role="status">
          {anchorVerdict.valid
            ? `✓ Matches the public fingerprint published on ${anchorVerdict.date}: entries 1–${anchorVerdict.seq} are unchanged since then.`
            : `✗ Doesn't match the published daily fingerprint (${anchorVerdict.reason}). Please report this to support.`}
        </p>
      )}

      {proof?.included && !anchorVerdict && (
        <p className={styles.muted}>
          Anchored daily: on {proof.anchor.date} this ledger&apos;s first {proof.leaf?.seq} entries were committed to a public fingerprint
          {(() => {
            const pub = proof.anchor.publications?.find((p) => p.ok && p.ref?.startsWith("https://"));
            return pub ? (
              <>
                {" "}
                (
                <a href={pub.ref} target="_blank" rel="noopener noreferrer">
                  published here
                </a>
                )
              </>
            ) : null;
          })()}
          . &ldquo;Verify ledger&rdquo; checks that too.
        </p>
      )}

      {error && <p className={styles.muted}>{error}</p>}
      {entries && !entries.length && <p className={styles.muted}>No money has moved yet.</p>}
      {entries && entries.length > 0 && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption className="sr-only">Ledger entries, oldest first</caption>
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Date</th>
                <th scope="col">Event</th>
                <th scope="col" className={styles.num}>
                  Amount
                </th>
                <th scope="col">Fingerprint</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.seq}>
                  <td>{e.seq}</td>
                  <td>{new Date(e.at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</td>
                  <td>
                    {LABELS[e.type]}
                    {e.memo && !LABELS[e.type]?.toLowerCase().includes(e.memo.toLowerCase()) ? <span className={styles.muted}> · {e.memo}</span> : null}
                  </td>
                  <td className={`${styles.num} ${e.amount < 0 ? styles.out : styles.in}`}>{money(e.amount, e.currency)}</td>
                  <td>
                    <code className={styles.hash} title={e.hash}>
                      {e.hash.slice(0, 10)}…
                    </code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
