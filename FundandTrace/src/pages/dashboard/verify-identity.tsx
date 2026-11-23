import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import DashboardLayout from "../../layouts/DashboardLayout";
import CaptureFlow from "../../components/capture/CaptureFlow";
import { selectAuthStateState } from "../../../store/slices/authSlice";
import { getApiBaseUrl } from "../../utils/api";
import { safeNextPath } from "../../hooks/useRequireAuth";
import { CaptureSession, DOC_TYPES } from "../../utils/evidence";

type Identity = {
  status: "unverified" | "pending" | "verified" | "requires_input" | "canceled";
  method?: string | null;
  submittedAt?: string | null;
  rejectionReason?: string;
  idCountry?: string | null;
};

const COUNTRIES = ["Nigeria", "Ghana", "Kenya", "United Kingdom", "United States", "South Africa", "Uganda", "Rwanda", "Cameroon", "Other"];

const json = async (url: string, init?: RequestInit) => {
  const res = await fetch(url, { credentials: "include", ...init, headers: { "Content-Type": "application/json", ...(init?.headers || {}) } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(body?.error || `Request failed (${res.status})`), { body, status: res.status });
  return body;
};

export default function VerifyIdentity() {
  const router = useRouter();
  const { profile } = useSelector(selectAuthStateState);
  const next = safeNextPath(router.query.return, "/dashboard");
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [stripeAvailable, setStripeAvailable] = useState(false);
  const [country, setCountry] = useState("");
  const [docType, setDocType] = useState("passport");
  const [session, setSession] = useState<(CaptureSession & { captureToken: string }) | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!profile?._id) return;
    try {
      const [status, options] = await Promise.all([
        json(`${getApiBaseUrl()}/api/identity/status/${profile._id}`),
        json(`${getApiBaseUrl()}/api/identity/options`).catch(() => ({ data: {} })),
      ]);
      setIdentity(status.data);
      setStripeAvailable(Boolean(options.data?.stripe));
    } catch {
      setIdentity({ status: "unverified" });
    }
  }, [profile?._id]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    if (profile?.country && !country) setCountry(COUNTRIES.includes(profile.country) ? profile.country : "");
  }, [profile?.country, country]);

  const start = async () => {
    setError("");
    if (!country) return setError("Choose the country that issued your ID.");
    setBusy(true);
    try {
      const body = await json(`${getApiBaseUrl()}/api/evidence/sessions`, {
        method: "POST",
        body: JSON.stringify({ kind: "identity", docType, docCountry: country }),
      });
      setSession(body.data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
    return undefined;
  };

  const startStripe = async () => {
    setError("");
    setBusy(true);
    try {
      const body = await json(`${getApiBaseUrl()}/api/identity/create-session`, { method: "POST", body: JSON.stringify({ userId: profile?._id }) });
      if (body.data?.url) window.location.href = body.data.url;
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  // If they finish on their phone (QR hand-off), notice it here.
  useEffect(() => {
    if (!session || session.status !== "open") return undefined;
    const t = window.setInterval(async () => {
      try {
        const body = await json(`${getApiBaseUrl()}/api/evidence/sessions/${session.id}`, { headers: { "X-Capture-Token": session.captureToken } });
        if (body.data?.status && body.data.status !== "open") {
          await load();
          setSession(null);
        }
      } catch {
        /* keep polling */
      }
    }, 5000);
    return () => window.clearInterval(t);
  }, [session, load]);

  const submitted = identity?.status === "pending" && identity.submittedAt;

  return (
    <DashboardLayout active={3} page="Verify your identity">
      <main className="custom mx-auto py-5" style={{ maxWidth: 640 }}>
        <p className="ft-eyebrow">Organiser verification</p>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>Verify your identity</h1>
        <p className="ft-muted" style={{ marginBottom: 24 }}>
          Donors give with confidence when they know a real, checked person runs the campaign. It takes about two minutes: a photo of your ID and a short selfie video, taken
          live with your camera. Your ID is encrypted and only seen by our review team.
        </p>

        {!identity && <div className="ft-skeleton" style={{ height: 120, borderRadius: 14 }} />}

        {identity?.status === "verified" && (
          <div className="ft-card" style={{ padding: 20 }}>
            <span className="ft-chip ft-chip--ok">Verified</span>
            <p style={{ margin: "12px 0 16px" }}>Your identity is verified. Your campaigns show this to donors and you can receive payouts.</p>
            <Link href={next} className="ft-btn ft-btn--primary">
              Continue
            </Link>
          </div>
        )}

        {submitted && !session && (
          <div className="ft-card" style={{ padding: 20 }}>
            <span className="ft-chip ft-chip--warn">Under review</span>
            <p style={{ margin: "12px 0 16px" }}>
              Thanks, we&apos;ve got it. We usually review within one working day and will email you. You can launch your campaign now; payouts start once the check passes.
            </p>
            <Link href={next} className="ft-btn ft-btn--primary">
              Continue
            </Link>
          </div>
        )}

        {identity && identity.status !== "verified" && !submitted && !session && (
          <div className="ft-card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
            {identity.status === "requires_input" && (
              <div role="alert" style={{ padding: 12, borderRadius: 10, background: "#fff8eb", border: "1px solid #f5c26b" }}>
                <strong>Your last check needs another try.</strong>
                {identity.rejectionReason ? <p style={{ margin: "4px 0 0" }}>{identity.rejectionReason}</p> : null}
              </div>
            )}
            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontWeight: 600 }}>
              Country that issued your ID
              <select value={country} onChange={(e) => setCountry(e.target.value)} className="form-control">
                <option value="">Choose…</option>
                {COUNTRIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
              <legend style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Type of ID</legend>
              {DOC_TYPES.map((d) => (
                <label key={d.value} style={{ display: "flex", gap: 10, alignItems: "center", padding: "6px 0" }}>
                  <input type="radio" name="docType" value={d.value} checked={docType === d.value} onChange={() => setDocType(d.value)} />
                  {d.label}
                </label>
              ))}
            </fieldset>
            <div className="ft-muted" style={{ fontSize: 14 }}>
              You&apos;ll need: good light, your ID, and about two minutes. On a computer without a camera you can switch to your phone with a QR code.
            </div>
            {error && (
              <p role="alert" style={{ color: "#b42318", fontWeight: 600, margin: 0 }}>
                {error}
              </p>
            )}
            <button type="button" className="ft-btn ft-btn--primary ft-btn--lg" onClick={start} disabled={busy}>
              {busy ? "Starting…" : "Start verification"}
            </button>
            {stripeAvailable && (
              <button type="button" className="ft-btn ft-btn--link" onClick={startStripe} disabled={busy}>
                Prefer an automated check? Verify with Stripe Identity instead
              </button>
            )}
          </div>
        )}

        {session && session.status === "open" && (
          <CaptureFlow session={session} token={session.captureToken} allowHandoff onSubmitted={() => load().then(() => setSession(null))} />
        )}
      </main>
    </DashboardLayout>
  );
}
