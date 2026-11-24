import React, { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import axios from "axios";
import Layout from "../components/Layout";
import Navbar from "../components/Navbar/Navbar";
import { getApiBaseUrl } from "../utils/api";

// Confirmation page for the unsubscribe link in donor update emails. Opening
// the link changes nothing (mail scanners prefetch links); the button does.
export default function Unsubscribe() {
  const { query, isReady } = useRouter();
  const e = String(query.e || "");
  const s = String(query.s || "");
  const t = String(query.t || "");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const all = s === "all";

  const submit = async () => {
    setState("busy");
    try {
      await axios.post(`${getApiBaseUrl()}/api/email/unsubscribe`, { e, s, t });
      setState("done");
    } catch (err) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Something went wrong. Please try the link again.");
      setState("error");
    }
  };

  return (
    <Layout title="Email updates | Fund&Trace" description="Manage Fund&Trace donor update emails">
      <Head>
        <meta name="robots" content="noindex" />
      </Head>
      <Navbar />
      <main style={{ maxWidth: 520, margin: "48px auto", padding: "0 16px" }}>
        {!isReady ? null : !e || !s || !t ? (
          <>
            <h1 style={{ fontSize: 26 }}>Link not valid</h1>
            <p>This unsubscribe link is incomplete. Please use the link from the email again.</p>
          </>
        ) : state === "done" ? (
          <>
            <h1 style={{ fontSize: 26 }}>You&apos;re unsubscribed</h1>
            <p>
              {e} won&apos;t get payout and receipt emails {all ? "for any campaign" : "for this campaign"} any more. The campaign tracker still shows every payout and
              receipt.
            </p>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 26 }}>Stop {all ? "all campaign updates" : "updates for this campaign"}?</h1>
            <p>
              {e} will no longer get emails when money is paid out or a receipt is added {all ? "for any campaign you've supported" : "for this campaign"}.
            </p>
            {state === "error" && <p role="alert" style={{ color: "#b91c1c" }}>{error}</p>}
            <button type="button" className="ft-btn ft-btn--primary" onClick={submit} disabled={state === "busy"}>
              {state === "busy" ? "Saving…" : "Unsubscribe"}
            </button>
          </>
        )}
      </main>
    </Layout>
  );
}
