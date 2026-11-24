import React, { useEffect, useState } from "react";
import Link from "next/link";
import Layout from "../components/Layout";
import Navbar from "../components/Navbar/Navbar";
import { getApiBaseUrl } from "../utils/api";
import { FeeSchedule, quote } from "../utils/fees";
import { formatMoney } from "../components/helperFunctions/helperFunctions";
import styles from "../components/campaignPage/FeesPage.module.scss";

// Shown until the live schedule loads (same defaults as the server).
const FALLBACK_MODES = { paystack: "required", flutterwave: "required", stripe: "optional" } as const;

const METHODS: { rail: "paystack" | "flutterwave" | "stripe"; where: string; rate: string }[] = [
  { rail: "paystack", where: "Nigeria (cards, bank transfer, USSD)", rate: "1.5% + ₦100, capped at ₦2,000 (₦100 waived under ₦2,500)" },
  { rail: "paystack", where: "Ghana (cards, mobile money)", rate: "1.95%" },
  { rail: "paystack", where: "Kenya", rate: "M-PESA 1.5% · cards 2.9%" },
  { rail: "flutterwave", where: "Nigeria", rate: "2%, capped at ₦2,000" },
  { rail: "flutterwave", where: "Other African currencies and mobile money", rate: "2.9%" },
  { rail: "stripe", where: "UK cards", rate: "1.5% + 20p (EEA cards 2.5% + 20p, other cards 3.25% + 20p)" },
];

const COMPETITORS = [
  {
    name: "GoFundMe (UK)",
    personal: "2.9% + 25p per donation, taken from the donation",
    charity: "1.9% + 20p per donation",
    model: "Optional donor tips",
    source: "https://www.gofundme.com/en-gb/c/blog/gofundme-fees",
  },
  {
    name: "JustGiving (UK)",
    personal: "2.9% + 35p per donation",
    charity: "1.9% + 30p per donation, plus 5% of Gift Aid if they claim it",
    model: "Optional donor tips",
    source: "https://www.justgiving.com/info/fees",
  },
  {
    name: "M-Changa (Kenya)",
    personal: "4.25% platform fee + 2.5% on cards (0% processing on M-Pesa)",
    charity: "Same",
    model: "Platform fee on every donation",
    source: "https://mchanga.africa/fees",
  },
];

type Mode = "required" | "optional" | "off";
const modeText = (m: Mode) =>
  m === "required" ? "Added to the donor's total, at cost" : m === "optional" ? "Donor can choose to cover it (never pre-ticked)" : "Absorbed by Fund&Trace";

export default function FeesPage() {
  const [schedule, setSchedule] = useState<FeeSchedule | null>(null);
  useEffect(() => {
    fetch(`${getApiBaseUrl()}/api/fees/schedule`)
      .then((r) => (r.ok ? r.json() : null))
      .then((b) => setSchedule(b?.data || null))
      .catch(() => setSchedule(null));
  }, []);
  const modes = (schedule?.modes || FALLBACK_MODES) as Record<string, Mode>;

  // Worked examples, computed with the same formula the checkout uses.
  const ngFee = schedule ? quote(schedule, { rail: "paystack", currency: "NGN", base: 10000 }).fee : 253.81;
  const ukFee = schedule ? quote(schedule, { rail: "stripe", currency: "GBP", base: 50, coverFee: true, donorCountry: "GB" }).fee : 0.97;
  const keFee = schedule ? quote(schedule, { rail: "paystack", currency: "KES", base: 1000, method: "mpesa" }).fee : 15.23;

  return (
    <Layout showFooter title="Fees | Fund&Trace" description="Fund&Trace charges no platform fee. Card processing fees are shown before you pay and passed on at cost.">
      <Navbar />
      <main className={styles.page}>
        <header className={styles.hero}>
          <p className="ft-eyebrow">Fees</p>
          <h1>0% platform fee. The campaign gets 100% of your gift.</h1>
          <p>
            We don&apos;t take a cut of donations, from organisers or donors. The only cost is the fee the card or mobile-money processor charges to move the money,
            and we show it to you before you pay.
          </p>
        </header>

        <section className={styles.cards} aria-label="Summary">
          <div className="ft-card">
            <strong className={styles.big}>0%</strong>
            <span>Platform fee, on every campaign</span>
          </div>
          <div className="ft-card">
            <strong className={styles.big}>At cost</strong>
            <span>Card/mobile-money fee, shown at checkout</span>
          </div>
          <div className="ft-card">
            <strong className={styles.big}>Optional</strong>
            <span>Tips to Fund&amp;Trace. Never preselected</span>
          </div>
        </section>

        <section className={styles.section}>
          <h2>Who pays the card fee</h2>
          <p>
            Payment processors deduct a fee from every payment. So that the campaign still receives your full donation, the fee is handled like this:
          </p>
          <ul className={styles.rules}>
            <li>
              <strong>Paying with Paystack or Flutterwave</strong> (Nigeria, Ghana, Kenya and other African currencies, including M-PESA and mobile money): the
              processor&apos;s fee is <strong>{modeText(modes.paystack).toLowerCase()}</strong>, listed on its own line before you pay.
            </li>
            <li>
              <strong>Paying by card in the UK or EU</strong> (Stripe): the law doesn&apos;t allow a surcharge for paying by consumer card, so the fee is{" "}
              <strong>never added automatically</strong>. You can tick a box to cover it if you&apos;d like; otherwise Fund&amp;Trace pays it.
            </li>
            <li>
              <strong>Tips</strong> to Fund&amp;Trace are optional and start at zero. Tips and covered fees are never credited to the campaign, and the campaign&apos;s
              donation is never reduced by them.
            </li>
          </ul>
          <div className={styles.tableWrap}>
            <table className={styles.table} aria-label="Processing fees by payment method">
              <thead>
                <tr>
                  <th scope="col">Paying with</th>
                  <th scope="col">Where</th>
                  <th scope="col">Processor&apos;s published rate</th>
                  <th scope="col">Who pays it</th>
                </tr>
              </thead>
              <tbody>
                {METHODS.map((m) => (
                  <tr key={m.rail + m.where}>
                    <td data-label="Paying with">{m.rail === "stripe" ? "Card (Stripe)" : m.rail === "paystack" ? "Paystack" : "Flutterwave"}</td>
                    <td data-label="Where">{m.where}</td>
                    <td data-label="Rate">{m.rate}</td>
                    <td data-label="Who pays">{modeText(modes[m.rail])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="ft-muted" style={{ fontSize: 14 }}>
            We use each processor&apos;s local rate, so you&apos;re never charged more than the fee on a local card. If you pay with a foreign card that costs more,
            Fund&amp;Trace covers the difference. Rates checked on {schedule?.checkedOn ? new Date(schedule.checkedOn).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "24 November 2026"}.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Worked examples</h2>
          <div className={styles.examples}>
            <div className="ft-card">
              <h3>₦10,000 in Lagos (Paystack)</h3>
              <dl>
                <div><dt>Donation</dt><dd>{formatMoney(10000, "NGN")}</dd></div>
                <div><dt>Card fee (at cost)</dt><dd>{formatMoney(ngFee, "NGN", { exact: true })}</dd></div>
                <div className={styles.total}><dt>You pay</dt><dd>{formatMoney(10000 + ngFee, "NGN", { exact: true })}</dd></div>
                <div className={styles.gets}><dt>Campaign receives</dt><dd>{formatMoney(10000, "NGN")}</dd></div>
              </dl>
            </div>
            <div className="ft-card">
              <h3>KSh 1,000 by M-PESA</h3>
              <dl>
                <div><dt>Donation</dt><dd>{formatMoney(1000, "KES")}</dd></div>
                <div><dt>M-PESA fee (at cost)</dt><dd>{formatMoney(keFee, "KES", { exact: true })}</dd></div>
                <div className={styles.total}><dt>You pay</dt><dd>{formatMoney(1000 + keFee, "KES", { exact: true })}</dd></div>
                <div className={styles.gets}><dt>Campaign receives</dt><dd>{formatMoney(1000, "KES")}</dd></div>
              </dl>
            </div>
            <div className="ft-card">
              <h3>£50 on a UK card</h3>
              <dl>
                <div><dt>Donation</dt><dd>{formatMoney(50, "GBP")}</dd></div>
                <div><dt>Cover the card fee?</dt><dd>optional, +{formatMoney(ukFee, "GBP", { exact: true })}</dd></div>
                <div className={styles.total}><dt>You pay</dt><dd>{formatMoney(50, "GBP")} or {formatMoney(50 + ukFee, "GBP", { exact: true })}</dd></div>
                <div className={styles.gets}><dt>Campaign receives</dt><dd>{formatMoney(50, "GBP")}</dd></div>
              </dl>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2>How this compares</h2>
          <p>On other platforms the processing fee usually comes out of the donation, so the campaign receives less than you gave.</p>
          <div className={styles.tableWrap}>
            <table className={styles.table} aria-label="Fees on other fundraising platforms">
              <thead>
                <tr>
                  <th scope="col">Platform</th>
                  <th scope="col">Personal fundraising</th>
                  <th scope="col">Charity fundraising</th>
                  <th scope="col">How they make money</th>
                </tr>
              </thead>
              <tbody>
                <tr className={styles.us}>
                  <td data-label="Platform">Fund&amp;Trace</td>
                  <td data-label="Personal">0% platform fee; card fee shown and passed on at cost (opt-in on UK/EU cards)</td>
                  <td data-label="Charity">Same</td>
                  <td data-label="Model">Optional donor tips</td>
                </tr>
                {COMPETITORS.map((c) => (
                  <tr key={c.name}>
                    <td data-label="Platform">
                      <a href={c.source} target="_blank" rel="noopener noreferrer">
                        {c.name}
                      </a>
                    </td>
                    <td data-label="Personal">{c.personal}</td>
                    <td data-label="Charity">{c.charity}</td>
                    <td data-label="Model">{c.model}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="ft-muted" style={{ fontSize: 14 }}>
            From each platform&apos;s own published fees page (linked), checked on 24 November 2026. Fees change; tell us if one is out of date.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Other costs</h2>
          <ul className={styles.rules}>
            <li>
              <strong>Payouts:</strong> bank-transfer fees charged by the processor when escrowed money is paid out are deducted from the payout and shown on the
              campaign&apos;s public tracker.
            </li>
            <li>
              <strong>Refunds:</strong> if you refund your own donation within the refund window, you get back everything you paid, including any tip and covered
              fee. The processor keeps its fee; we absorb it.
            </li>
          </ul>
          <Link href="/StartACampaign" className="ft-btn ft-btn--primary">
            Start a campaign for free
          </Link>
        </section>
      </main>
    </Layout>
  );
}
