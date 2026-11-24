import React from "react";
import styles from "./AuthGate.module.scss";

/** Full-page placeholder shown while the session is restored or a redirect to sign-in is in flight. */
export default function AuthGate({ label = "Loading your dashboard…" }: { label?: string }) {
  return (
    <div className={styles.gate} role="status" aria-live="polite">
      <span className={styles.spinner} aria-hidden="true" />
      <p className={styles.label}>{label}</p>
    </div>
  );
}
