import React, { useEffect, useRef } from "react";

// Cloudflare Turnstile, loaded only when the API asks for a challenge (after
// unusually many payment starts from one connection). Ordinary donors never
// load it.
type TurnstileApi = {
  render: (el: HTMLElement, opts: { sitekey: string; callback: (token: string) => void; "error-callback"?: () => void; theme?: string }) => string;
  remove: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let loading: Promise<void> | null = null;
function load(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = SRC;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => {
        loading = null;
        reject(new Error("Turnstile failed to load"));
      };
      document.head.appendChild(s);
    });
  }
  return loading;
}

export default function Turnstile({ siteKey, onToken, onError }: { siteKey: string; onToken: (token: string) => void; onError?: () => void }) {
  const el = useRef<HTMLDivElement>(null);
  const cb = useRef(onToken);
  cb.current = onToken;
  const errCb = useRef(onError);
  errCb.current = onError;
  useEffect(() => {
    let id = "";
    let cancelled = false;
    load()
      .then(() => {
        if (cancelled || !el.current || !window.turnstile) return;
        id = window.turnstile.render(el.current, { sitekey: siteKey, callback: (t) => cb.current(t), "error-callback": () => errCb.current?.(), theme: "light" });
      })
      .catch(() => errCb.current?.());
    return () => {
      cancelled = true;
      if (id && window.turnstile) window.turnstile.remove(id);
    };
  }, [siteKey]);
  return <div ref={el} style={{ minHeight: 65, margin: "12px 0" }} />;
}
