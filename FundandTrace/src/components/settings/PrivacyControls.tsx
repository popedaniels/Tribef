import React, { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import { getApiBaseUrl } from "../../utils/api";
import { useAppDispatch } from "../../../store/hooks";
import { authStateActions } from "../../../store/slices/authSlice";

// Working privacy & security controls: two-factor sign-in, download my data,
// delete my account. All calls use the session cookie.
const api = (path: string) => `${getApiBaseUrl()}${path}`;
const cred = { withCredentials: true };
const errOf = (e: unknown, fallback: string) => (e as { response?: { data?: { error?: string } } })?.response?.data?.error || fallback;

const card: React.CSSProperties = { padding: "16px 0", borderBottom: "1px solid #eef0f3" };
const muted: React.CSSProperties = { color: "#5f6672", fontSize: 13, margin: "4px 0 10px" };

function TwoFactor() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [mode, setMode] = useState<"" | "enable" | "disable">("");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    axios
      .get(api("/api/auth/2fa/status"), cred)
      .then((r) => setEnabled(Boolean(r.data?.enabled)))
      .catch(() => setEnabled(null));
  }, []);

  const start = async () => {
    setMsg("");
    try {
      const r = await axios.post(api("/api/auth/2fa/setup"), {}, cred);
      setQr(r.data?.qrDataUrl || "");
      setSecret(new URLSearchParams(String(r.data?.otpauthUrl || "").split("?")[1] || "").get("secret") || "");
      setMode("enable");
    } catch (e) {
      setMsg(errOf(e, "Couldn't start setup"));
    }
  };
  const confirm = async () => {
    setBusy(true);
    setMsg("");
    try {
      await axios.post(api(`/api/auth/2fa/${mode}`), { token: code }, cred);
      setEnabled(mode === "enable");
      setMode("");
      setCode("");
      setQr("");
      setMsg(mode === "enable" ? "Two-factor sign-in is on. You'll need a code from your app each time you sign in." : "Two-factor sign-in is off.");
    } catch (e) {
      setMsg(errOf(e, "That code didn't work"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <article style={card}>
      <p className="mb-0" style={{ fontWeight: 600 }}>
        Two-factor sign-in {enabled === true ? <span style={{ color: "#166534", fontWeight: 500 }}>· On</span> : enabled === false ? <span style={{ color: "#92400e", fontWeight: 500 }}>· Off</span> : null}
      </p>
      <p style={muted}>Ask for a code from an authenticator app (Google Authenticator, 1Password, Authy) as well as your password. Strongly recommended if you run a campaign.</p>
      {mode === "enable" && (
        <div>
          <p style={{ fontSize: 14 }}>Scan this code in your app, then enter the 6-digit code it shows.</p>
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt="Authenticator QR code" width={180} height={180} />
          ) : null}
          {secret && (
            <details style={{ fontSize: 13, margin: "6px 0" }}>
              <summary>Can&apos;t scan? Enter this key</summary>
              <code style={{ wordBreak: "break-all" }}>{secret}</code>
            </details>
          )}
        </div>
      )}
      {mode ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <label htmlFor="tfa-code" className="sr-only">
            Authenticator code
          </label>
          <input
            id="tfa-code"
            className="form-control"
            style={{ maxWidth: 140 }}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          />
          <button type="button" className="ft-btn ft-btn--primary" disabled={busy || code.length !== 6} onClick={confirm}>
            {mode === "enable" ? "Turn on" : "Turn off"}
          </button>
          <button type="button" className="ft-btn ft-btn--ghost" onClick={() => (setMode(""), setCode(""))}>
            Cancel
          </button>
        </div>
      ) : enabled ? (
        <button type="button" className="ft-btn ft-btn--secondary" onClick={() => setMode("disable")}>
          Turn off
        </button>
      ) : enabled === false ? (
        <button type="button" className="ft-btn ft-btn--primary" onClick={start}>
          Set up
        </button>
      ) : null}
      {msg && (
        <p role="status" style={{ fontSize: 13, marginTop: 8 }}>
          {msg}
        </p>
      )}
    </article>
  );
}

function DownloadData() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const download = async () => {
    setBusy(true);
    setMsg("");
    try {
      const r = await axios.get(api("/api/auth/me/export"), cred);
      const blob = new Blob([JSON.stringify(r.data, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `fundandtrace-my-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    } catch (e) {
      setMsg(errOf(e, "Couldn't prepare your data. Please try again."));
    } finally {
      setBusy(false);
    }
  };
  return (
    <article style={card}>
      <p className="mb-0" style={{ fontWeight: 600 }}>
        Download my data
      </p>
      <p style={muted}>Your profile, campaigns, payouts, donations and settings, as a JSON file.</p>
      <button type="button" className="ft-btn ft-btn--secondary" onClick={download} disabled={busy}>
        {busy ? "Preparing…" : "Download"}
      </button>
      {msg && <p role="alert" style={{ fontSize: 13, color: "#b91c1c" }}>{msg}</p>}
    </article>
  );
}

function DeleteAccount() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    setMsg("");
    try {
      await axios.post(api("/api/auth/me/delete"), { password, confirm }, cred);
      try {
        localStorage.removeItem("persist:root");
      } catch {
        /* storage unavailable */
      }
      dispatch(authStateActions.logoutSuccess(false));
      router.replace("/?accountDeleted=1");
    } catch (e) {
      setMsg(errOf(e, "Couldn't delete your account."));
    } finally {
      setBusy(false);
    }
  };
  return (
    <article style={{ ...card, borderBottom: 0 }}>
      <p className="mb-0" style={{ fontWeight: 600, color: "#b91c1c" }}>
        Delete my account
      </p>
      <p style={muted}>
        Removes your account and sign-in. Records of money (donations, payouts, Gift Aid) are kept for 6 years as the law requires, with your name and email removed. You
        can&apos;t delete while campaign money is still held or monthly gifts are running.
      </p>
      {!open ? (
        <button type="button" className="ft-btn ft-btn--secondary" onClick={() => setOpen(true)}>
          Delete account…
        </button>
      ) : (
        <div style={{ display: "grid", gap: 8, maxWidth: 360 }}>
          <label htmlFor="del-pw" style={{ fontSize: 13 }}>
            Your password
          </label>
          <input id="del-pw" type="password" className="form-control" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <label htmlFor="del-confirm" style={{ fontSize: 13 }}>
            Type DELETE to confirm
          </label>
          <input id="del-confirm" className="form-control" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="ft-btn ft-btn--primary" style={{ background: "#b91c1c", borderColor: "#b91c1c" }} disabled={busy || confirm !== "DELETE" || !password} onClick={submit}>
              {busy ? "Deleting…" : "Delete permanently"}
            </button>
            <button type="button" className="ft-btn ft-btn--ghost" onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
      {msg && <p role="alert" style={{ fontSize: 13, color: "#b91c1c", marginTop: 8 }}>{msg}</p>}
    </article>
  );
}

export default function PrivacyControls() {
  return (
    <>
      <TwoFactor />
      <DownloadData />
      <DeleteAccount />
    </>
  );
}
