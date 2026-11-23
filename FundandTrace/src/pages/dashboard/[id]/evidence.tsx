import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import CampaignDashboardLayout from "../../../layouts/CampaignDashboardLayout";
import CaptureFlow from "../../../components/capture/CaptureFlow";
import EvidenceGallery from "../../../components/capture/EvidenceGallery";
import { CaptureSession } from "../../../utils/evidence";
import { getApiBaseUrl } from "../../../utils/api";

/**
 * Organiser adds live, sealed evidence: a progress photo/video for donors,
 * or a receipt for a payout (?purpose=receipt&fr=<fundingRequestId>).
 */
export default function CampaignEvidence() {
  const router = useRouter();
  const campaignId = String(router.query.id || "");
  const purpose = router.query.purpose === "receipt" ? "receipt" : "update";
  const fundingRequestId = typeof router.query.fr === "string" ? router.query.fr : "";
  const [session, setSession] = useState<(CaptureSession & { captureToken: string }) | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [posted, setPosted] = useState(false);

  const start = async () => {
    setError("");
    setBusy(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/evidence/sessions`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "evidence", purpose, campaignId, fundingRequestId: fundingRequestId || undefined }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Couldn't start (${res.status})`);
      setSession(body.data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const isReceipt = purpose === "receipt";
  return (
    <CampaignDashboardLayout active={1} campaignId={campaignId} page={isReceipt ? "Proof of spend" : "Live evidence"}>
      <main className="custom mx-auto py-4" style={{ maxWidth: 720 }}>
        <p className="ft-eyebrow">{isReceipt ? "Proof of spend" : "Show donors the work"}</p>
        <h1 style={{ fontSize: 26, marginBottom: 8 }}>{isReceipt ? "Capture the receipt live" : "Add live photos or video"}</h1>
        <p className="ft-muted" style={{ marginBottom: 20 }}>
          {isReceipt
            ? "Photograph the receipt or invoice for this payout now, in the app. It's sealed with our time and a fingerprint, so donors can see it hasn't been edited."
            : "Photos and videos taken here are timed by our server, fingerprinted and sealed. Donors see a “captured live” badge and can check nothing was changed."}
        </p>

        {posted ? (
          <div className="ft-card" style={{ padding: 20 }}>
            <span className="ft-chip ft-chip--ok">{isReceipt ? "Proof attached" : "Posted"}</span>
            <p style={{ margin: "12px 0 16px" }}>{isReceipt ? "Your receipt is attached to the payout." : "Your update is live on the campaign page."}</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href={`/campaign/${campaignId}`} className="ft-btn ft-btn--primary">
                View campaign
              </Link>
              <button
                type="button"
                className="ft-btn ft-btn--secondary"
                onClick={() => {
                  setPosted(false);
                  setSession(null);
                }}
              >
                Add more
              </button>
            </div>
          </div>
        ) : session ? (
          <CaptureFlow session={session} token={session.captureToken} allowHandoff onSubmitted={() => setPosted(true)} />
        ) : (
          <div className="ft-card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            <ul className="ft-muted" style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>
              <li>Uses your camera only. Files from your gallery can&apos;t be added here.</li>
              <li>In a video, say the code we show you, so viewers know it was filmed today.</li>
              <li>Location is optional and shown to donors rounded to about 1 km.</li>
            </ul>
            {error && (
              <p role="alert" style={{ color: "#b42318", fontWeight: 600, margin: 0 }}>
                {error}
              </p>
            )}
            <button type="button" className="ft-btn ft-btn--primary ft-btn--lg" onClick={start} disabled={busy || !campaignId}>
              {busy ? "Starting…" : "Open camera"}
            </button>
          </div>
        )}

        {!isReceipt && campaignId && <EvidenceGallery campaignId={campaignId} title="Already posted" />}
      </main>
    </CampaignDashboardLayout>
  );
}
