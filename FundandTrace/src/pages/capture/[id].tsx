import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import CaptureFlow from "../../components/capture/CaptureFlow";
import { CaptureSession } from "../../utils/evidence";
import { getApiBaseUrl } from "../../utils/api";

/**
 * Phone hand-off: opened from the QR code on a computer. The capture token is
 * in the URL fragment (#t=…), which browsers never send to any server, so it
 * stays out of logs and Referer headers. No sign-in needed: the token only
 * allows capturing for this one session, for 20 minutes.
 */
export default function PhoneCapture() {
  const router = useRouter();
  const id = String(router.query.id || "");
  // null = not read yet (the fragment is only available after mount).
  const [token, setToken] = useState<string | null>(null);
  const [session, setSession] = useState<CaptureSession | null>(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = new URLSearchParams(window.location.hash.slice(1)).get("t") || "";
    setToken(t);
  }, []);

  // Remove the token from the address bar (and history) once the router has
  // settled: Next re-applies the original URL, hash included, when it becomes
  // ready, so clearing it earlier doesn't stick. Keep Next's history state.
  useEffect(() => {
    if (!router.isReady || !token || !window.location.hash) return;
    window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
  }, [router.isReady, token]);

  useEffect(() => {
    if (!router.isReady || !id || token === null) return;
    if (!token) {
      setError("This link is incomplete. Scan the QR code again from your computer.");
      return;
    }
    fetch(`${getApiBaseUrl()}/api/evidence/sessions/${id}`, { headers: { "X-Capture-Token": token } })
      .then(async (r) => {
        const b = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(b?.error || "This capture link isn't valid any more. Start again on your computer.");
        if (b.data.status !== "open") throw new Error("This capture has already been completed or has expired. Start again on your computer if needed.");
        setSession(b.data);
      })
      .catch((e) => setError(e.message));
  }, [router.isReady, id, token]);

  return (
    <>
      <Head>
        <title>Capture | Fund&amp;Trace</title>
        <meta name="robots" content="noindex" />
        <meta name="referrer" content="no-referrer" />
      </Head>
      <main style={{ padding: "20px 16px 40px", maxWidth: 600, margin: "0 auto" }}>
        <p className="ft-eyebrow">Fund&amp;Trace · secure capture</p>
        {error && (
          <div role="alert" className="ft-card" style={{ padding: 16 }}>
            {error}
          </div>
        )}
        {!error && !session && !done && <div className="ft-skeleton" style={{ height: 300, borderRadius: 16 }} />}
        {done && (
          <div className="ft-card" style={{ padding: 20 }}>
            <span className="ft-chip ft-chip--ok">Done</span>
            <h1 style={{ fontSize: 22, margin: "12px 0 8px" }}>All sent</h1>
            <p style={{ margin: 0 }}>You can close this page. Your computer will update in a few seconds.</p>
          </div>
        )}
        {session && !done && <CaptureFlow session={session} token={token || ""} onSubmitted={() => setDone(true)} />}
      </main>
    </>
  );
}
