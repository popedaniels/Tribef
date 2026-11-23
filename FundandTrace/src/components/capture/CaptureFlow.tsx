import React, { useMemo, useState } from "react";
import LiveCamera, { CaptureMeta } from "./LiveCamera";
import styles from "./capture.module.scss";
import { CaptureSession, SealedRecord, Slot, SLOT_LABEL, sha256Bytes } from "../../utils/evidence";
import { getApiBaseUrl } from "../../utils/api";

type Props = {
  session: CaptureSession;
  /** Token for this session (from creation, or the QR link's fragment). */
  token: string;
  onSubmitted: (session: CaptureSession) => void;
  /** Show "continue on your phone" (desktop only). */
  allowHandoff?: boolean;
};

const IDENTITY_STEPS: Record<string, { mode: "photo" | "video"; facing: "user" | "environment"; instruction: string }> = {
  id_front: { mode: "photo", facing: "environment", instruction: "Lay your ID flat in good light. Fill the frame with the front, with all four corners visible and no glare." },
  id_back: { mode: "photo", facing: "environment", instruction: "Now the back of the same ID." },
  selfie_video: {
    mode: "video",
    facing: "user",
    instruction: "Face the camera in good light. When recording starts, say your code out loud, then follow the instructions on screen.",
  },
};

const getLocation = () =>
  new Promise<{ lat: number; lng: number; accuracy: number } | null>((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
    return undefined;
  });

const short = (h: string) => `${h.slice(0, 10)}…${h.slice(-6)}`;

export default function CaptureFlow({ session: initial, token, onSubmitted, allowHandoff = false }: Props) {
  const [session, setSession] = useState(initial);
  const [sealed, setSealed] = useState<SealedRecord[]>([]);
  const [active, setActive] = useState<Slot | null>(null);
  const [shareLocation, setShareLocation] = useState(initial.kind === "evidence");
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [showQr, setShowQr] = useState(false);

  const isIdentity = session.kind === "identity";
  const done = useMemo(() => new Set([...session.records.map((r) => r.slot), ...sealed.map((r) => r.slot)]), [session.records, sealed]);
  const nextIdentitySlot = session.slots.find((s) => !done.has(s)) || null;
  const expired = new Date(session.expiresAt) < new Date();
  const canSubmit = isIdentity ? !nextIdentitySlot : sealed.length + session.records.length > 0;

  const upload = async (slot: Slot, blob: Blob, meta: CaptureMeta) => {
    setBusy("Sealing…");
    setError("");
    try {
      const location = shareLocation ? await getLocation() : null;
      const digest = await sha256Bytes(blob);
      const res = await fetch(`${getApiBaseUrl()}/api/evidence/sessions/${session.id}/media/${slot}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          "X-Capture-Token": token,
          "X-Content-SHA256": digest,
          "X-Capture-Meta": JSON.stringify({ ...meta, location }),
        },
        body: blob,
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Upload failed (${res.status})`);
      setSealed((s) => [...s, body.data as SealedRecord]);
      setActive(null);
    } catch (err) {
      setError((err as Error).message || "Upload failed. Please try again.");
    } finally {
      setBusy("");
    }
  };

  const submit = async () => {
    setBusy("Submitting…");
    setError("");
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/evidence/sessions/${session.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Capture-Token": token },
        body: JSON.stringify({ caption }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Couldn't submit (${res.status})`);
      setSession(body.data);
      onSubmitted(body.data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy("");
    }
  };

  if (expired && session.status === "open") {
    return (
      <div className={styles.notice} role="alert">
        This capture session has expired (they last 20 minutes so codes can&apos;t be reused). Go back and start again.
      </div>
    );
  }

  const current: Slot | null = isIdentity ? nextIdentitySlot : active;
  const step = current && (isIdentity ? IDENTITY_STEPS[current] : null);

  return (
    <div className={styles.flow}>
      <div className={styles.codeCard}>
        <div>
          <span className="ft-eyebrow">Your one-time code</span>
          <strong className={styles.bigCode}>{session.code}</strong>
        </div>
        <p className="ft-muted">
          {isIdentity
            ? "You'll say this code in your selfie video. It proves the video was recorded just now."
            : "Say this code in any video you record. Every capture is sealed with our clock and its fingerprint, so it can't be swapped or edited later."}
        </p>
      </div>

      {allowHandoff && session.qr && (
        <div className={styles.handoff}>
          <button type="button" className="ft-btn ft-btn--link" onClick={() => setShowQr((v) => !v)} aria-expanded={showQr}>
            {showQr ? "Hide QR code" : "No camera here? Continue on your phone"}
          </button>
          {showQr && (
            <div className={styles.qr}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={session.qr} alt="QR code to continue on your phone" width={200} height={200} />
              <p className="ft-muted">Scan with your phone camera. The link works once, for 20 minutes, and only for this capture.</p>
            </div>
          )}
        </div>
      )}

      {isIdentity && (
        <ol className={styles.steps} aria-label="Steps">
          {session.slots.map((s) => (
            <li key={s} data-state={done.has(s) ? "done" : s === current ? "current" : "todo"}>
              {done.has(s) ? "✓ " : ""}
              {SLOT_LABEL[s]}
            </li>
          ))}
        </ol>
      )}

      <label className={styles.toggle}>
        <input type="checkbox" checked={shareLocation} onChange={(e) => setShareLocation(e.target.checked)} />
        <span>
          Add my location {isIdentity ? "(only our review team sees it)" : "(donors see it rounded to about 1 km)"}
        </span>
      </label>

      {busy && (
        <p className={styles.busy} role="status">
          {busy}
        </p>
      )}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      {current && step && !busy && (
        <LiveCamera
          key={current}
          mode={step.mode}
          facing={step.facing}
          code={session.code}
          prompts={current === "selfie_video" ? session.prompts : []}
          instruction={step.instruction}
          maxSeconds={current === "selfie_video" ? 12 : 30}
          minSeconds={current === "selfie_video" ? 6 : 2}
          onCapture={(blob, meta) => upload(current, blob, meta)}
        />
      )}

      {!isIdentity && !active && !busy && (
        <div className={styles.actions}>
          <button type="button" className="ft-btn ft-btn--secondary" onClick={() => setActive("photo")}>
            Take a photo
          </button>
          <button type="button" className="ft-btn ft-btn--secondary" onClick={() => setActive("video")}>
            Record a video
          </button>
        </div>
      )}
      {!isIdentity && active && !busy && (
        <LiveCamera
          key={`${active}-${sealed.length}`}
          mode={active === "photo" ? "photo" : "video"}
          facing="environment"
          code={session.code}
          instruction={
            active === "photo"
              ? "Point the camera at what you're showing donors (the receipt, the work, the delivery)."
              : "Start by saying the code, then show what's happening. Up to 30 seconds."
          }
          maxSeconds={30}
          minSeconds={3}
          onCapture={(blob, meta) => upload(active, blob, meta)}
          onCancel={() => setActive(null)}
        />
      )}

      {sealed.length > 0 && (
        <ul className={styles.sealedList} aria-label="Sealed captures">
          {sealed.map((r) => (
            <li key={r.id}>
              <span className={styles.seal} aria-hidden="true">
                ⛨
              </span>
              <div>
                <strong>{SLOT_LABEL[r.slot]} sealed</strong>
                <span className="ft-muted">
                  #{r.seq} · {new Date(r.receivedAt).toLocaleTimeString()} · fingerprint <code>{short(r.sha256)}</code>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!isIdentity && sealed.length + session.records.length > 0 && (
        <label className={styles.caption}>
          <span>What does this show? (shown to donors)</span>
          <textarea value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={1000} rows={3} placeholder="e.g. Roofing sheets delivered to the clinic, 23 Nov" />
        </label>
      )}

      {canSubmit && !active && (
        <button type="button" className="ft-btn ft-btn--primary ft-btn--lg ft-btn--block" onClick={submit} disabled={Boolean(busy)}>
          {isIdentity ? "Submit for review" : session.purpose === "receipt" ? "Attach as proof of spend" : "Post to campaign"}
        </button>
      )}
    </div>
  );
}
