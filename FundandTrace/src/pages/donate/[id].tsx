import { useI18n } from "../../i18n";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import type { GetServerSidePropsContext } from "next";
import type { Stripe } from "@stripe/stripe-js";

import Layout from "../../components/Layout";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import FrozenBanner from "../../components/trust/FrozenBanner";
import { toast } from "../../../store/slices/ToastSlice";
import { useAppDispatch } from "../../../store/hooks";
import { getApiBaseUrl } from "../../utils/api";
import { cdnImage } from "../../utils/cloudinary";
import { quote, FeeSchedule } from "../../utils/fees";
import { visitorCountry } from "../../utils/geo";
import { getAllCountries, getCountries } from "../../components/helperFunctions/locationFunctions";
import {
  formatMoney,
  getCurrency,
  getDaysRemaining,
  getDualCurrencyEstimate,
  getRatesAsOf,
  loadLiveRates,
  getPresetDonationAmounts,
  selectPaymentRail,
} from "../../components/helperFunctions/helperFunctions";
import type { Campaign } from "../../types/campaign";
import styles from "../../components/campaignPage/DonatePage.module.scss";

interface DonatePageProps {
  campaign: Campaign | null;
  campaignId?: string | string[];
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const campaignId = context.query.id;
  try {
    const res = await axios.get(`${getApiBaseUrl()}/api/campaigns/campaign/${campaignId}`, { timeout: 3000 });
    return { props: { campaign: res?.data?.data || null, campaignId } };
  } catch {
    return { props: { campaign: null, campaignId } };
  }
}

// Stripe.js is loaded on demand (and only once) so a blocked or offline
// js.stripe.com never breaks the page for donors paying another way.
let stripePromise: Promise<Stripe | null> | null = null;
const getStripe = () => {
  if (!stripePromise) {
    stripePromise = import("@stripe/stripe-js")
      .then(({ loadStripe }) => loadStripe(process.env.STRIPEPUBLIC || ""))
      .catch(() => {
        stripePromise = null;
        return null;
      });
  }
  return stripePromise;
};

type Rail = "stripe" | "flutterwave" | "paystack";

// Which gateway can take which currency (mirrors the backend checks).
const RAILS: { id: Rail; name: string; detail: string; currencies: string[] }[] = [
  { id: "paystack", name: "Paystack", detail: "Card, bank transfer, USSD", currencies: ["NGN", "GHS", "ZAR", "KES", "USD"] },
  { id: "flutterwave", name: "Flutterwave", detail: "Card, bank transfer, USSD, M-Pesa, mobile money", currencies: ["NGN", "GHS", "KES", "UGX", "TZS", "RWF", "ZAR", "USD", "GBP", "EUR"] },
  { id: "stripe", name: "Card", detail: "Visa, Mastercard, Amex, Apple Pay, Google Pay", currencies: ["GBP", "USD", "NGN"] },
];

const TIP_OPTIONS = [0, 5, 7.5, 10];
// Currencies where donors can pay from a mobile wallet.
const MOMO_LABEL: Record<string, { id: "mpesa" | "mobilemoney"; label: string }> = {
  KES: { id: "mpesa", label: "M-PESA" },
  GHS: { id: "mobilemoney", label: "Mobile money (MTN, Telecel, AirtelTigo)" },
  UGX: { id: "mobilemoney", label: "Mobile money (MTN, Airtel)" },
  RWF: { id: "mobilemoney", label: "Mobile money (MTN, Airtel)" },
  TZS: { id: "mobilemoney", label: "Mobile money" },
  ZMW: { id: "mobilemoney", label: "Mobile money" },
};
const FALLBACK_IMAGE = "/images/stories/water_story.jpg";
const EMAIL_RE = /^\S+@\S+\.\S+$/;

type Field = "amount" | "firstName" | "lastName" | "email" | "country" | "terms" | "gaHouse" | "gaPostcode";

type Giving = {
  giftAid: { available: boolean; charityName?: string; wording?: string };
  teams: { id: string; name: string; slug: string; raised: number }[];
  matching: { live: boolean; sponsorName: string; ratio: number; remaining: number } | null;
};
// UK postcode, same rule as the server (services/donationExtras.js).
const UK_POSTCODE = /^(GIR ?0AA|[A-PR-UWYZ][A-HK-Y]?\d[A-Z\d]? ?\d[ABD-HJLNP-UW-Z]{2})$/i;

export default function DonatePage({ campaign, campaignId }: DonatePageProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { t } = useI18n();
  // Donations are always taken in the campaign's currency (the API enforces it).
  const currency = String(campaign?.funding?.currency || "USD").toUpperCase();
  const availableRails = RAILS.filter((r) => r.currencies.includes(currency));

  const [amount, setAmount] = useState<number>(0);
  const [amountText, setAmountText] = useState("");
  // No tip by default: an optional extra must be actively chosen (UK Consumer
  // Contracts Regulations 2013 reg. 40 — a preselected extra isn't consent).
  const [tipPct, setTipPct] = useState<number | "custom">(0);
  const [feeSchedule, setFeeSchedule] = useState<FeeSchedule | null>(null);
  const [coverFee, setCoverFee] = useState(false); // opt-in only (UK/EU cards)
  const [method, setMethod] = useState<"card" | "mpesa" | "mobilemoney">("card");
  const [donorCountry, setDonorCountry] = useState("");
  const [customTip, setCustomTip] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [country, setCountry] = useState("");
  // The donor's own currency (from their detected country), for "about X" only.
  const [visitorCurrency, setVisitorCurrency] = useState("");
  const [, setRatesLoaded] = useState(0);
  const [zip, setZip] = useState("");
  const [countries, setCountries] = useState<{ name: string }[]>([]);
  const [rail, setRail] = useState<Rail>(availableRails[0]?.id || "stripe");
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [refundDays, setRefundDays] = useState<number | null>(null);
  const [giving, setGiving] = useState<Giving | null>(null);
  const [giftAid, setGiftAid] = useState(false); // never pre-ticked
  const [gaHouse, setGaHouse] = useState("");
  const [gaPostcode, setGaPostcode] = useState("");
  const [teamId, setTeamId] = useState("");
  const fieldRefs = useRef<Partial<Record<Field, HTMLElement | null>>>({});

  const chooseRailFor = useCallback(
    (countryName: string) => {
      const preferred = selectPaymentRail(countryName) as Rail;
      setRail(availableRails.some((r) => r.id === preferred) ? preferred : availableRails[0]?.id || "stripe");
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currency]
  );

  useEffect(() => {
    getAllCountries().then((list) => setCountries(list || [])).catch(() => setCountries([]));
    getCountries()
      .then((geo) => {
        if (geo?.country_name) {
          setCountry((c) => c || geo.country_name);
          chooseRailFor(geo.country_name);
          if (geo.currency) setVisitorCurrency(geo.currency);
        }
      })
      .catch(() => {});
    loadLiveRates().then(() => setRatesLoaded((n) => n + 1));
  }, [chooseRailFor]);

  useEffect(() => {
    setDonorCountry(visitorCountry()?.code || "");
    axios
      .get(`${getApiBaseUrl()}/api/fees/schedule`, { timeout: 5000 })
      .then((r) => setFeeSchedule(r.data?.data || null))
      .catch(() => setFeeSchedule(null));
  }, []);

  useEffect(() => {
    if (!campaign?._id) return;
    axios
      .get(`${getApiBaseUrl()}/api/giving/campaign/${campaign._id}`, { timeout: 5000 })
      .then((r) => {
        const g: Giving | null = r.data?.data || null;
        setGiving(g);
        const slug = typeof router.query.team === "string" ? router.query.team : "";
        const t = slug && g?.teams.find((x) => x.slug === slug);
        if (t) setTeamId(t.id);
      })
      .catch(() => setGiving(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign?._id]);

  useEffect(() => {
    axios
      .get(`${getApiBaseUrl()}/api/donations/refund-policy`, { timeout: 5000 })
      .then((r) => setRefundDays(r.data?.data?.enabled ? Number(r.data.data.windowDays) || null : null))
      .catch(() => setRefundDays(null));
  }, []);

  useEffect(() => {
    if (router.query.status === "failed") {
      dispatch(toast(true, t("donate.failed"), "error"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query.status, dispatch]);

  const tip = useMemo(() => {
    if (tipPct === "custom") {
      const t = Number(customTip);
      return Number.isFinite(t) && t > 0 ? Math.round(t * 100) / 100 : 0;
    }
    return Math.round(amount * tipPct) / 100;
  }, [tipPct, customTip, amount]);
  // Card/processing fee: added at cost on African rails, opt-in on UK/EU cards.
  const feeQuote = quote(feeSchedule, { rail, currency, base: Math.round((amount + tip) * 100) / 100, coverFee, method: method === "card" ? "" : method, donorCountry });
  const fee = amount > 0 ? feeQuote.fee : 0;
  const total = Math.round((amount + tip + fee) * 100) / 100;
  const momo = MOMO_LABEL[currency];

  const errors = useMemo(() => {
    const e: Partial<Record<Field, string>> = {};
    if (!(amount > 0)) e.amount = t("donate.err.amount");
    if (!firstName.trim()) e.firstName = t("donate.err.firstName");
    if (!lastName.trim()) e.lastName = t("donate.err.lastName");
    if (!EMAIL_RE.test(email.trim())) e.email = t("donate.err.email");
    if (!country) e.country = t("donate.err.country");
    if (!terms) e.terms = t("donate.err.terms");
    if (giftAid && !gaHouse.trim()) e.gaHouse = "Gift Aid needs your house name or number.";
    if (giftAid && !UK_POSTCODE.test(gaPostcode.trim())) e.gaPostcode = "Enter your UK home postcode for Gift Aid.";
    return e;
  }, [amount, firstName, lastName, email, country, terms, giftAid, gaHouse, gaPostcode, t]);
  const show = (f: Field) => (submitted ? errors[f] : undefined);

  if (!campaign) {
    return (
      <Layout title="Campaign unavailable" description="This campaign could not be loaded.">
        <Navbar />
        <main className={styles.unavailable}>
          <h1>We couldn&apos;t load this campaign</h1>
          <p>It may have ended, or the link may be wrong. You haven&apos;t been charged.</p>
          <Link href="/Categories" className="ft-btn ft-btn--primary">
            Browse campaigns
          </Link>
        </main>
      </Layout>
    );
  }

  const title = campaign.basicInformation?.campaignTitle || "this campaign";
  const raised = Number(campaign.funding?.amountRaised) || 0;
  const goal = Number(campaign.funding?.amountExpected) || 0;
  const pct = goal > 0 ? Math.min(100, Math.round((100 * raised) / goal)) : 0;
  const presets = getPresetDonationAmounts(currency);
  // Prefer the donor's own currency; otherwise GBP (or USD for GBP campaigns).
  const intlCurrency = visitorCurrency && visitorCurrency !== currency ? visitorCurrency : currency === "GBP" ? "USD" : "GBP";
  const est = amount > 0 ? getDualCurrencyEstimate(amount, currency, intlCurrency) || getDualCurrencyEstimate(amount, currency, currency === "GBP" ? "USD" : "GBP") : null;
  const rateDate = new Date(getRatesAsOf()).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const approx = est ? formatMoney(Math.round(Number(String(est.amount).replace(/,/g, ""))), est.currency) : null;

  if (campaign.disputeGovernance?.isLocked) {
    return (
      <Layout title={`Donations paused · ${title}`} description="Donations to this campaign are paused while it is reviewed.">
        <Navbar />
        <main className={styles.unavailable}>
          <h1>Donations to {title} are paused</h1>
          <div style={{ maxWidth: 640, width: "100%", textAlign: "left" }}>
            <FrozenBanner lockReason={campaign.disputeGovernance?.lockReason} />
          </div>
          <div className="d-flex flex-wrap justify-content-center" style={{ gap: 12 }}>
            <Link href={`/campaign/${campaign._id}/tracker`} className="ft-btn ft-btn--primary">
              See where the money went
            </Link>
            <Link href="/Categories" className="ft-btn ft-btn--secondary">
              Explore other campaigns
            </Link>
          </div>
        </main>
      </Layout>
    );
  }

  const referralCode = typeof router.query.ref === "string" ? router.query.ref.slice(0, 64) : "";

  const buildPayment = () => ({
    tx_ref: `Fundandtrace${rail === "paystack" ? "PS" : ""}${Date.now()}`,
    amount: total,
    currency,
    payment_options: rail === "flutterwave" ? "card,ussd,banktransfer,mobilemoneyghana,mpesa" : "card",
    redirect_url: rail === "flutterwave" ? `${getApiBaseUrl()}/api/donations/flutterwave/${campaign._id}` : undefined,
    meta: {
      paymentMethod: rail === "stripe" ? "Stripe" : rail === "paystack" ? "Paystack" : "Flutterwave",
      paymentOption: "card",
      zipCode: zip.trim(),
      country,
      campaignId: campaign._id,
      tip,
      amount: total,
      processingFee: fee,
      coverFee,
      method: method === "card" ? "" : method,
      donorCountry,
      anonymous,
      referralCode,
      ...(teamId ? { teamId } : {}),
      ...(giftAid
        ? { giftAid: { declared: true, firstName: firstName.trim(), lastName: lastName.trim(), houseNameOrNumber: gaHouse.trim(), postcode: gaPostcode.trim() } }
        : {}),
    },
    customer: { email: email.trim(), name: `${firstName.trim()} ${lastName.trim()}` },
    customizations: {
      title: `${title} donation`,
      description: `Fund&Trace donation to ${title}`,
      logo: campaign.basicInformation?.campaignImage,
    },
  });

  const fail = (err: unknown, fallback: string) => {
    const e = err as { response?: { data?: { error?: string } } };
    setLoading(false);
    dispatch(toast(true, e?.response?.data?.error || fallback, "error"));
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setSubmitted(true);
    const firstInvalid = (Object.keys(errors) as Field[])[0];
    if (firstInvalid) {
      fieldRefs.current[firstInvalid]?.focus();
      return;
    }
    setLoading(true);
    const payment = buildPayment();
    try {
      if (rail === "stripe") {
        const stripe = await getStripe();
        if (!stripe) return fail(null, "Card payments can't load right now. Try another payment method or try again in a moment.");
        const res = await axios.post(`${getApiBaseUrl()}/api/donations/createStripeSession/${campaignId}`, payment);
        const result = await stripe.redirectToCheckout({ sessionId: res?.data?.id });
        if (result.error) fail(null, result.error.message || "We couldn't open the card payment page.");
      } else if (rail === "paystack") {
        const res = await axios.post(`${getApiBaseUrl()}/api/donations/initializePaystack/${campaign._id}`, payment);
        if (res?.data?.authorizationUrl) window.location.href = res.data.authorizationUrl;
        else fail(null, "We couldn't open Paystack. Please try again.");
      } else {
        const res = await axios.post(`${getApiBaseUrl()}/api/donations/initialize`, { payment });
        if (res?.data) window.location.href = res.data;
        else fail(null, "We couldn't open Flutterwave. Please try again.");
      }
    } catch (err) {
      fail(err, t("donate.startFailed"));
    }
  };

  const ref = (f: Field) => (el: HTMLElement | null) => {
    fieldRefs.current[f] = el;
  };

  return (
    <Layout title={`Donate · ${title}`} description={`Donate to ${title}`} ogImage={`https://fundandtrace.com/api/og/campaign/${campaign._id}`}>
      <Navbar />
      <main className={styles.page}>
        <div className={styles.container}>
          <Link href={`/campaign/${campaign._id}`} className={styles.back}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
            {t("donate.back")}
          </Link>

          <div className={styles.layout}>
            <form className={styles.form} onSubmit={submit} noValidate aria-labelledby="donate-title">
              <header className={styles.header}>
                <img src={cdnImage(campaign.basicInformation?.campaignImage || FALLBACK_IMAGE, 160)} alt="" className={styles.mobileThumb} width={80} height={80} decoding="async" />
                <div>
                  <span className="ft-eyebrow">{t("donate.eyebrow")}</span>
                  <h1 id="donate-title">{title}</h1>
                </div>
              </header>

              {/* 1. Amount */}
              <fieldset className={styles.section}>
                <legend>{t("donate.yourDonation")}</legend>
                <div className={styles.presets} role="group" aria-label="Suggested amounts">
                  {presets.map((p) => (
                    <button
                      key={p}
                      type="button"
                      className="ft-pill"
                      aria-pressed={amount === p && amountText === String(p)}
                      onClick={() => {
                        setAmount(p);
                        setAmountText(String(p));
                      }}
                    >
                      {formatMoney(p, currency)}
                    </button>
                  ))}
                </div>
                <label htmlFor="amount" className={styles.label}>
                  {t("donate.orEnter")}
                </label>
                <div className={`${styles.amountField} ${show("amount") ? styles.invalid : ""}`}>
                  <span aria-hidden="true">{getCurrency(currency).trim()}</span>
                  <input
                    id="amount"
                    ref={ref("amount")}
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="0"
                    value={amountText}
                    aria-invalid={Boolean(show("amount"))}
                    aria-describedby="amount-help"
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^\d.]/g, "");
                      setAmountText(v);
                      const n = Number(v);
                      setAmount(Number.isFinite(n) ? n : 0);
                    }}
                  />
                  <span className={styles.code}>{currency}</span>
                </div>
                <p id="amount-help" className={show("amount") ? styles.error : styles.help}>
                  {show("amount") || (approx ? t("donate.approx", { approx, date: rateDate, currency }) : t("donate.takenIn", { currency }))}
                </p>
              </fieldset>

              {/* 2. Details */}
              <fieldset className={styles.section}>
                <legend>{t("donate.yourDetails")}</legend>
                <div className={styles.row}>
                  <div>
                    <label htmlFor="firstName" className={styles.label}>{t("donate.firstName")}</label>
                    <input id="firstName" ref={ref("firstName")} className="form-control" autoComplete="given-name" value={firstName} aria-invalid={Boolean(show("firstName"))} onChange={(e) => setFirstName(e.target.value)} />
                    {show("firstName") && <p className={styles.error}>{show("firstName")}</p>}
                  </div>
                  <div>
                    <label htmlFor="lastName" className={styles.label}>{t("donate.lastName")}</label>
                    <input id="lastName" ref={ref("lastName")} className="form-control" autoComplete="family-name" value={lastName} aria-invalid={Boolean(show("lastName"))} onChange={(e) => setLastName(e.target.value)} />
                    {show("lastName") && <p className={styles.error}>{show("lastName")}</p>}
                  </div>
                </div>
                <label htmlFor="email" className={styles.label}>{t("donate.email")}</label>
                <input id="email" ref={ref("email")} type="email" className="form-control" autoComplete="email" value={email} aria-invalid={Boolean(show("email"))} aria-describedby="email-help" onChange={(e) => setEmail(e.target.value)} />
                <p id="email-help" className={show("email") ? styles.error : styles.help}>
                  {show("email") || t("donate.emailHelp")}
                </p>
                <div className={styles.row}>
                  <div>
                    <label htmlFor="country" className={styles.label}>{t("donate.country")}</label>
                    <select
                      id="country"
                      ref={ref("country")}
                      className="form-control"
                      autoComplete="country-name"
                      value={country}
                      aria-invalid={Boolean(show("country"))}
                      onChange={(e) => {
                        setCountry(e.target.value);
                        chooseRailFor(e.target.value);
                      }}
                    >
                      <option value="">{t("donate.select")}</option>
                      {country && !countries.some((c) => c.name === country) && <option value={country}>{country}</option>}
                      {countries.map((c) => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                    {show("country") && <p className={styles.error}>{show("country")}</p>}
                  </div>
                  <div>
                    <label htmlFor="zip" className={styles.label}>
                      {t("donate.postcodeOptional")} <span className="ft-muted">{t("donate.optional")}</span>
                    </label>
                    <input id="zip" className="form-control" autoComplete="postal-code" value={zip} onChange={(e) => setZip(e.target.value)} />
                  </div>
                </div>
                <label className={styles.check}>
                  <input type="checkbox" checked={anonymous} onChange={() => setAnonymous(!anonymous)} />
                  <span>{t("donate.anonymous")}</span>
                </label>
                {giving && giving.teams.length > 0 && (
                  <div>
                    <label htmlFor="team" className={styles.label}>
                      {t("donate.team")} <span className="ft-muted">{t("donate.optional")}</span>
                    </label>
                    <select id="team" className="form-control" value={teamId} onChange={(e) => setTeamId(e.target.value)}>
                      <option value="">{t("donate.noTeam")}</option>
                      {giving.teams.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </fieldset>

              {giving?.giftAid.available && currency === "GBP" && amount > 0 && (
                <fieldset className={`${styles.section} ${styles.giftAid}`}>
                  <legend>
                    Boost your donation by {formatMoney(Math.round(amount * 25) / 100, "GBP", { exact: true })} with Gift Aid
                  </legend>
                  <p className="ft-muted" style={{ fontSize: 14, marginTop: 0 }}>
                    If you&apos;re a UK taxpayer, {giving.giftAid.charityName} can claim 25p from HMRC for every £1 you give, at no cost to you.
                  </p>
                  <label className={styles.check}>
                    <input type="checkbox" checked={giftAid} onChange={() => setGiftAid(!giftAid)} />
                    <span>{giving.giftAid.wording}</span>
                  </label>
                  {giftAid && (
                    <>
                      <p className="ft-muted" style={{ fontSize: 13 }}>
                        HMRC needs your name (above) and home address. Please tell {giving.giftAid.charityName} if you stop paying tax or change your name or address.
                      </p>
                      <div className={styles.row}>
                        <div>
                          <label htmlFor="gaHouse" className={styles.label}>House name or number</label>
                          <input id="gaHouse" ref={ref("gaHouse")} className="form-control" autoComplete="address-line1" value={gaHouse} aria-invalid={Boolean(show("gaHouse"))} onChange={(e) => setGaHouse(e.target.value)} />
                          {show("gaHouse") && <p className={styles.error}>{show("gaHouse")}</p>}
                        </div>
                        <div>
                          <label htmlFor="gaPostcode" className={styles.label}>Home postcode</label>
                          <input id="gaPostcode" ref={ref("gaPostcode")} className="form-control" autoComplete="postal-code" value={gaPostcode} aria-invalid={Boolean(show("gaPostcode"))} onChange={(e) => setGaPostcode(e.target.value.toUpperCase())} />
                          {show("gaPostcode") && <p className={styles.error}>{show("gaPostcode")}</p>}
                        </div>
                      </div>
                    </>
                  )}
                </fieldset>
              )}

              {/* 3. Payment */}
              <fieldset className={styles.section}>
                <legend>{t("donate.howToPay")}</legend>
                <div className={styles.rails}>
                  {availableRails.map((r) => (
                    <label key={r.id} className={`${styles.rail} ${rail === r.id ? styles.railOn : ""}`}>
                      <input type="radio" name="rail" value={r.id} checked={rail === r.id} onChange={() => setRail(r.id)} />
                      <span>
                        <strong>{r.name}</strong>
                        <span>{r.detail}</span>
                      </span>
                    </label>
                  ))}
                </div>
                {momo && rail !== "stripe" && (
                  <div className={styles.presets} role="radiogroup" aria-label="Pay with" style={{ marginTop: 12 }}>
                    <button type="button" className="ft-pill" role="radio" aria-checked={method === "card"} onClick={() => setMethod("card")}>
                      {t("donate.method.card")}
                    </button>
                    <button type="button" className="ft-pill" role="radio" aria-checked={method !== "card"} onClick={() => setMethod(momo.id)}>
                      {momo.label}
                    </button>
                  </div>
                )}
                <p className={styles.help}>You&apos;ll finish paying on {rail === "stripe" ? "Stripe's" : rail === "paystack" ? "Paystack's" : "Flutterwave's"} secure page. We never see your card details.</p>
              </fieldset>

              {/* 4. Tip */}
              <fieldset className={styles.section}>
                <legend>{t("donate.tipTitle")} <span className="ft-muted">{t("donate.optional")}</span></legend>
                <p className={styles.help} style={{ marginTop: 0 }}>
                  {t("donate.tipBody")}
                </p>
                <div className={styles.presets} role="group" aria-label="Tip">
                  {TIP_OPTIONS.map((pct) => (
                    <button key={pct} type="button" className="ft-pill" aria-pressed={tipPct === pct} onClick={() => setTipPct(pct)}>
                      {pct === 0 ? t("donate.noTip") : `${pct}%`}
                    </button>
                  ))}
                  <button type="button" className="ft-pill" aria-pressed={tipPct === "custom"} onClick={() => setTipPct("custom")}>
                    {t("donate.other")}
                  </button>
                </div>
                {tipPct === "custom" && (
                  <div className={styles.customTip}>
                    <label htmlFor="customTip" className={styles.label}>Tip amount ({currency})</label>
                    <input id="customTip" inputMode="decimal" className="form-control" value={customTip} onChange={(e) => setCustomTip(e.target.value.replace(/[^\d.]/g, ""))} />
                  </div>
                )}
              </fieldset>

              {/* Summary (also shown in the sidebar on desktop) */}
              <div className={styles.section}>
                {giving?.matching?.live && amount > 0 && (
                  <p className={styles.matchNote} role="status">
                    <strong>{giving.matching.sponsorName}</strong> will match your gift
                    {giving.matching.ratio !== 1 ? ` ${giving.matching.ratio}×` : ""}: +
                    {formatMoney(Math.min(amount * giving.matching.ratio, giving.matching.remaining), currency, { exact: true })} pledged
                    <span className="ft-muted"> ({formatMoney(giving.matching.remaining, currency)} of matching left; added when the sponsor pays)</span>
                  </p>
                )}
                <dl className={styles.breakdown}>
                  <div><dt>{t("donate.summary.donation")}</dt><dd>{formatMoney(amount, currency)}</dd></div>
                  <div><dt>{t("donate.summary.tip")}</dt><dd>{formatMoney(tip, currency)}</dd></div>
                  <div><dt>{t("donate.summary.platformFee")}</dt><dd className={styles.free}>{formatMoney(0, currency)}</dd></div>
                  {feeQuote.mode === "required" && amount > 0 && (
                    <div>
                      <dt>
                        {t("donate.summary.cardFee", { rail: rail === "paystack" ? "Paystack" : "Flutterwave" })}
                      </dt>
                      <dd>{formatMoney(fee, currency, { exact: true })}</dd>
                    </div>
                  )}
                  {feeQuote.mode === "optional" && coverFee && amount > 0 && (
                    <div><dt>{t("donate.summary.coverFee")}</dt><dd>{formatMoney(fee, currency, { exact: true })}</dd></div>
                  )}
                  <div className={styles.total}><dt>{t("donate.summary.total")}</dt><dd>{formatMoney(total, currency, { exact: true })}</dd></div>
                </dl>
                {feeQuote.mode === "required" && amount > 0 && (
                  <p className={styles.help} style={{ marginTop: 0 }}>
                    {t("donate.feeExplainer", { amount: formatMoney(amount, currency) })}
                  </p>
                )}
                {feeQuote.mode === "optional" && amount > 0 && feeQuote.offered > 0 && (
                  <label className={styles.check}>
                    <input type="checkbox" checked={coverFee} onChange={() => setCoverFee(!coverFee)} />
                    <span>
                      {t("donate.coverFeeOptIn", { fee: formatMoney(feeQuote.offered, currency, { exact: true }) })} <span className="ft-muted">{t("donate.optional")}</span>
                    </span>
                  </label>
                )}
                <label className={`${styles.check} ${show("terms") ? styles.checkInvalid : ""}`}>
                  <input type="checkbox" ref={ref("terms") as (el: HTMLInputElement | null) => void} checked={terms} aria-invalid={Boolean(show("terms"))} onChange={() => setTerms(!terms)} />
                  <span>
                    {t("donate.terms").split(/(\{terms\}|\{privacy\})/).map((part, i) =>
                      part === "{terms}" ? <Link key={i} href="/terms" target="_blank">{t("donate.termsLink")}</Link> : part === "{privacy}" ? <Link key={i} href="/privacy" target="_blank">{t("donate.privacyLink")}</Link> : part
                    )}
                  </span>
                </label>
                {show("terms") && <p className={styles.error}>{show("terms")}</p>}

                {submitted && Object.keys(errors).length > 0 && (
                  <p className={styles.errorSummary} role="alert">
                    {Object.keys(errors).length === 1 ? t("donate.fixOne") : t("donate.fixMany", { n: Object.keys(errors).length })}
                  </p>
                )}

                <button type="submit" className="ft-btn ft-btn--primary ft-btn--lg ft-btn--block" disabled={loading} aria-busy={loading}>
                  {loading ? t("donate.opening") : amount > 0 ? t("donate.submit", { total: formatMoney(total, currency, { exact: true }) }) : t("donate.submitBare")}
                </button>
                <p className={styles.secure}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
                  {t("donate.secure")}
                  {refundDays ? ` ${t("donate.refundable", { days: refundDays })}` : ""}
                </p>
              </div>
            </form>

            <aside className={styles.aside} aria-label="Campaign you're supporting">
              <div className={styles.campaignCard}>
                <img src={cdnImage(campaign.basicInformation?.campaignImage || FALLBACK_IMAGE, 720)} alt="" loading="lazy" decoding="async" />
                <div className={styles.campaignBody}>
                  <h2>{title}</h2>
                  {campaign.organizer && <p className="ft-muted">Organised by {campaign.organizer}</p>}
                  <p className={styles.raised}>
                    <strong>{formatMoney(raised, currency)}</strong> raised of {formatMoney(goal, currency)}
                  </p>
                  <div className="ft-progress" role="progressbar" aria-label="Funding progress" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                    <span style={{ width: `${pct}%` }} />
                  </div>
                  <p className="ft-muted" style={{ marginTop: 8, fontSize: 13.5 }}>
                    {pct}% funded · {Math.max(0, Number(getDaysRemaining(campaign)) || 0)} days left
                  </p>
                </div>
              </div>
              <ul className={styles.promises}>
                <li>{t("donate.trust.escrow")}</li>
                <li>{t("donate.trust.review")}</li>
                <li>{t("donate.trust.ledger")}</li>
              </ul>
              <Link href={`/campaign/${campaign._id}/tracker`} className="ft-btn ft-btn--link">
                See where the money has gone so far →
              </Link>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </Layout>
  );
}
