import React, { useEffect, useState } from "react";
import styles from "./capture.module.scss";
import { apiUrl, FLAG_LABEL, SealedRecord, verifyRecordInBrowser, VerifyResult } from "../../utils/evidence";
import { getApiBaseUrl } from "../../utils/api";

const when = (d: string) =>
  new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

function Item({ r }: { r: SealedRecord }) {
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [checking, setChecking] = useState(false);
  const src = apiUrl(r.mediaUrl);

  const verify = async () => {
    setChecking(true);
    try {
      setResult(await verifyRecordInBrowser(r));
    } finally {
      setChecking(false);
    }
  };

  return (
    <li className={styles.item}>
      {src ? (
        r.mime.startsWith("video/") ? (
          <video src={src} controls playsInline preload="metadata" aria-label={r.caption || "Campaign video"} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={r.caption || "Campaign photo"} loading="lazy" decoding="async" />
        )
      ) : null}
      <div className={styles.itemBody}>
        <span className={styles.sealBadge}>⛨ Captured live · sealed</span>
        {r.caption && <p>{r.caption}</p>}
        <span className="ft-muted">
          {when(r.receivedAt)}
          {r.locationCoarse ? ` · near ${r.locationCoarse.lat.toFixed(2)}, ${r.locationCoarse.lng.toFixed(2)}` : ""}
          {r.ipCountry ? ` · sent from ${r.ipCountry}` : ""}
        </span>
        {r.flags.length > 0 && <span className="ft-muted">{r.flags.map((f) => FLAG_LABEL[f] || f).join(" · ")}</span>}
        {!result && (
          <button type="button" className="ft-btn ft-btn--link ft-btn--sm" onClick={verify} disabled={checking} style={{ alignSelf: "flex-start", padding: 0 }}>
            {checking ? "Checking…" : "Verify it hasn't been changed"}
          </button>
        )}
        {result && (
          <ul className={styles.checks} aria-live="polite">
            <li data-ok={String(result.fileMatches)}>
              {result.fileMatches === null ? "File not available to check" : result.fileMatches ? "File is exactly what was captured" : "File does NOT match its fingerprint"}
            </li>
            <li data-ok={String(result.recordMatches)}>{result.recordMatches ? "Time, place and details are unchanged" : "Details were changed after sealing"}</li>
            <li data-ok={String(result.linkMatches)}>{result.linkMatches ? `Linked into the public evidence chain (#${r.seq})` : "Chain link is broken"}</li>
            <li data-ok={String(result.signature)}>
              {result.signature === null ? "Signature: your browser can't check Ed25519 (use the verify script)" : result.signature ? "Signed by Fund&Trace" : "Signature is invalid"}
            </li>
          </ul>
        )}
        {result && (
          <span className={styles.meta}>
            Fingerprint (SHA-256): {r.sha256}
          </span>
        )}
      </div>
    </li>
  );
}

/** Live-captured, sealed photos and videos for a campaign. Renders nothing if there are none. */
export default function EvidenceGallery({ campaignId, title = "Live evidence from the organiser" }: { campaignId: string; title?: string }) {
  const [items, setItems] = useState<SealedRecord[] | null>(null);

  useEffect(() => {
    if (!campaignId) return undefined;
    let cancelled = false;
    fetch(`${getApiBaseUrl()}/api/evidence/campaign/${campaignId}`)
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((b) => !cancelled && setItems(b.data || []))
      .catch(() => !cancelled && setItems([]));
    return () => {
      cancelled = true;
    };
  }, [campaignId]);

  if (!items || !items.length) return null;
  return (
    <section aria-labelledby="evidence-title" style={{ marginTop: 24 }}>
      <h3 id="evidence-title" style={{ fontSize: 18, marginBottom: 4 }}>
        {title}
      </h3>
      <p className="ft-muted" style={{ marginTop: 0, fontSize: 14 }}>
        Taken with the camera in our app, timed by our server and fingerprinted on arrival. Anyone can check that nothing was edited since.
      </p>
      <ul className={styles.gallery} style={{ listStyle: "none", padding: 0 }}>
        {items.map((r) => (
          <Item key={r.id} r={r} />
        ))}
      </ul>
    </section>
  );
}
