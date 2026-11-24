import React, { useEffect, useState } from "react";
import axios from "axios";
import { getApiBaseUrl } from "../../utils/api";
import styles from "./trust.module.scss";

export type BankDetails = { bankCode: string; bankName: string; accountNumber: string; accountName: string };
type Bank = { code: string; name: string };

type Props = {
  currency: string;
  value: BankDetails;
  onChange: (next: BankDetails) => void;
  idPrefix?: string;
  /** Rendered when no bank payout rail serves this currency (e.g. GBP/USD, or no provider configured). */
  fallback?: React.ReactNode;
};

/**
 * Bank picker + account-name check for African payout currencies
 * (Flutterwave/Paystack). Renders nothing when the currency is paid through
 * Stripe Connect, so existing GBP/USD/EUR forms are unchanged.
 */
export default function BankAccountFields({ currency, value, onChange, idPrefix = "bank", fallback = null }: Props) {
  const [country, setCountry] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [status, setStatus] = useState<"idle" | "checking" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!currency) return;
    let alive = true;
    axios
      .get(`${getApiBaseUrl()}/api/payouts/options`, { params: { currency } })
      .then((r) => {
        const opts = r.data?.data;
        if (!alive) return;
        setCountry(opts?.bankPayoutsAvailable ? opts.country : null);
        setLoaded(true);
      })
      .catch(() => {
        if (!alive) return;
        setCountry(null);
        setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, [currency]);

  useEffect(() => {
    if (!country) return;
    axios
      .get(`${getApiBaseUrl()}/api/payouts/banks`, { params: { country } })
      .then((r) => setBanks(r.data?.data || []))
      .catch(() => setBanks([]));
  }, [country]);

  if (!country) return loaded ? <>{fallback}</> : null;

  const resolve = async () => {
    if (!value.bankCode || value.accountNumber.length < 6) return;
    setStatus("checking");
    setMessage("");
    try {
      const r = await axios.post(
        `${getApiBaseUrl()}/api/payouts/resolve-account`,
        { bankCode: value.bankCode, accountNumber: value.accountNumber },
        { withCredentials: true }
      );
      const accountName = r.data?.data?.accountName || "";
      onChange({ ...value, accountName });
      setStatus("ok");
      setMessage(accountName);
    } catch (err) {
      setStatus("error");
      setMessage(axios.isAxiosError(err) && err.response?.status === 404 ? "We couldn't find that account at this bank." : "Couldn't check the account right now.");
    }
  };

  return (
    <fieldset className={styles.bankFields}>
      <legend className={styles.bankLegend}>Bank account for payouts ({currency})</legend>
      <label htmlFor={`${idPrefix}-bank`} className={styles.fieldLabel}>
        Bank
      </label>
      <select
        id={`${idPrefix}-bank`}
        className="form-select"
        value={value.bankCode}
        onChange={(e) => {
          const bank = banks.find((b) => b.code === e.target.value);
          setStatus("idle");
          onChange({ ...value, bankCode: e.target.value, bankName: bank?.name || "", accountName: "" });
        }}
      >
        <option value="">{banks.length ? "Choose your bank" : "Loading banks…"}</option>
        {banks.map((b) => (
          <option key={`${b.code}-${b.name}`} value={b.code}>
            {b.name}
          </option>
        ))}
      </select>

      <label htmlFor={`${idPrefix}-account`} className={styles.fieldLabel}>
        Account number
      </label>
      <input
        id={`${idPrefix}-account`}
        className="form-control"
        inputMode="numeric"
        autoComplete="off"
        value={value.accountNumber}
        onChange={(e) => {
          setStatus("idle");
          onChange({ ...value, accountNumber: e.target.value.replace(/\s+/g, ""), accountName: "" });
        }}
        onBlur={resolve}
        aria-describedby={`${idPrefix}-account-status`}
      />
      <p id={`${idPrefix}-account-status`} className={status === "error" ? styles.fieldError : styles.fieldHint} aria-live="polite">
        {status === "checking" && "Checking account…"}
        {status === "ok" && `✓ Account holder: ${message}`}
        {status === "error" && message}
        {status === "idle" && "We'll confirm the account holder's name before saving."}
      </p>
    </fieldset>
  );
}
