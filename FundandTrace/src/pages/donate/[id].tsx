import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import styles from "./donatePage.module.scss";
import Footer from "../../components/Footer/Footer";
import { useRouter } from "next/router";
import axios from "axios";

import { toast } from "../../../store/slices/ToastSlice";
import Spinner from "../../components/composed/spinner/Spinner";
import { loadStripe } from "@stripe/stripe-js";
import Layout from "../../components/Layout";
import styled from "styled-components";
import { useAppDispatch } from "./../../../store/hooks";
const stripePromise = loadStripe(process.env.STRIPEPUBLIC || "");
import {
  getCountries,
  getAllCountries,
} from "../../components/helperFunctions/locationFunctions";
import {
  addCommaToNumber,
  getCurrency,
  getDaysRemaining,
  getDualCurrencyEstimate,
  getProcessorFeeEstimate,
  getPresetDonationAmounts,
  selectPaymentRail,
} from "../../components/helperFunctions/helperFunctions";
import { Campaign } from "../../types/campaign";
import type { GetServerSidePropsContext } from "next";

interface Country {
  name: string;
}

interface GeoLocationInfo {
  country_name?: string;
}

interface DonatePageProps {
  campaign: Campaign | null;
  campaignId?: string | string[];
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const campaignId = context.query.id;
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const campaigndata = await axios.get(
      `${apiUrl}/api/campaigns/campaign/${campaignId}`,
      { timeout: 3000 }
    );
    const campaign = campaigndata?.data?.data || null;

    return {
      props: {
        campaign,
        campaignId,
      },
    };
  } catch (error) {
    return {
      props: {
        campaign: null,
        campaignId,
      },
    };
  }
}

export default function DonatePage({ campaign, campaignId }: DonatePageProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [currency, setCurrency] = useState(campaign?.funding?.currency || "USD");
  const [tip, setTip] = useState(Number(7.5) / 100);
  const [amount, setAmount] = useState(0);
  // const [tipInput, setTipInput] = useState();
  const [others, setOthers] = useState(false);
  const [anonymous, setAnonymous] = useState(false);
  const [zip, setZip] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [loading, setLoading] = useState(false);
  const [terms, setTerms] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [paymentRail, setPaymentRail] = useState<"stripe" | "flutterwave" | "paystack">("stripe");
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { status } = router.query;
  const [countries, setCountries] = useState<Country[]>([]);
  const [showCountries, setShowCountries] = useState(false);
  const [allCountries, setAllCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [countryData, setCountryData] = useState<GeoLocationInfo>({});

  const getInitialCountryData = async () => {
    try {
      const cData = await getCountries();
      const detectedCountry = cData?.country_name || "Nigeria";
      setCountry(detectedCountry);
      setCountryData(cData);
      
      // Smart location routing: default to Flutterwave for African corridors,
      // Paystack for Nigeria/Ghana/Kenya, Stripe for international
      const isNigeria = detectedCountry === "Nigeria";
      const isAfrican = ["Nigeria", "Ghana", "Kenya", "South Africa", "Uganda", "Rwanda", "Tanzania", "Egypt"].includes(detectedCountry);
      if (isNigeria) {
        setPaymentRail("paystack");
      } else if (isAfrican) {
        setPaymentRail("flutterwave");
      } else {
        setPaymentRail("stripe");
      }
    } catch (error) {
    }
  };

  useEffect(() => {
    getInitialCountryData();
  }, []);

  const handleGetAllCountries = useCallback(async () => {
    try {
      const data = await getAllCountries();
      setCountries(data);
      setAllCountries(data);
    } catch (error) {
    }
  }, []);

  const handleCountrySearch = useCallback(() => {
    setCountries(
      allCountries?.filter((c) =>
        c?.name?.toLowerCase().includes(selectedCountry?.toLowerCase())
      )
    );
  }, [allCountries, selectedCountry]);

  useEffect(() => {
    handleGetAllCountries();
  }, [handleGetAllCountries]);

  useEffect(() => {
    handleCountrySearch();
  }, [handleCountrySearch]);

  // When country is manually chosen, auto-recommend best payment gateway
  const handleSelectCountry = (countryName: string) => {
    setCountry(countryName);
    setShowCountries(false);
    setPaymentRail(selectPaymentRail(countryName));
  };

  // Share/referral attribution (?ref=CODE on campaign links).
  const referralCode =
    typeof router.query.ref === "string" ? router.query.ref.slice(0, 64) : "";

  const payWithStripe = async () => {
    if (tip >= 0 && amount > 0 && zip && email && country && terms) {
      setLoading(true);
      const payment = {
        tx_ref: "Fundandtrace" + Date.now(),
        amount: others ? tip + amount : amount + amount * tip,
        currency: currency,

        payment_options: "card",
        meta: {
          paymentMethod: "Stripe",
          paymentOption: "card",
          zipCode: zip,
          country: country,
          campaignId: router.query.id,
          tip: others ? tip : amount * tip,
          amount: others ? tip + amount : amount + amount * tip,
          anonymous: anonymous,
          referralCode: referralCode,
        },
        customer: {
          email: email,
          name: `${firstName} ${lastName}`,
        },
        customizations: {
          title: `${campaign?.basicInformation?.campaignTitle} Payments`,
          description: `Fundandtrace Donation for ${campaign?.basicInformation?.campaignTitle}`,
          logo: campaign?.basicInformation?.campaignImage,
        },
      };

      const stripe = await stripePromise;
      if (!stripe) {
        setLoading(false);
        dispatch(toast(true, "Payment service is unavailable.", "error"));
        return;
      }

      try {
        const response = await axios.post(
          process.env.NEXT_PUBLIC_API_URL +
            "/api/donations/createStripeSession/" +
            campaignId,
          payment
        );

        const result = await stripe.redirectToCheckout({
          sessionId: response?.data?.id,
        });
        setLoading(false);
        if (result.error) {
          dispatch(toast(true, result.error.message || "Payment redirect error", "error"));
        }
      } catch (err) {
        setLoading(false);
        dispatch(toast(true, err?.response?.data?.error || "Error initiating checkout", "error"));
      }
    } else {
      dispatch(toast(true, "Please fill out all required fields and accept terms.", "error"));
    }
  };

  const payWithFlutterwave = async () => {
    if (tip >= 0 && amount > 0 && zip && email && country && terms) {
      setLoading(true);
      const payment = {
        tx_ref: "Fundandtrace" + Date.now(),
        amount: others ? tip + amount : amount + amount * tip,
        currency: currency,
        redirect_url:
          process.env.NEXT_PUBLIC_API_URL +
          "/api/donations/flutterwave/" +
          campaign?._id,
        payment_options: "card,ussd,banktransfer,mobilemoneyghana,mpesa",
        meta: {
          paymentMethod: "Flutterwave",
          paymentOption: "card",
          zipCode: zip,
          country: country,
          campaignId: router.query.id,
          tip: others ? tip : amount * tip,
          amount: others ? tip + amount : amount + amount * tip,
          anonymous: anonymous,
          referralCode: referralCode,
        },
        customer: {
          email: email,
          name: `${firstName} ${lastName}`,
        },
        customizations: {
          title: `${campaign?.basicInformation?.campaignTitle} Payments`,
          description: `Fundandtrace Donation for ${campaign?.basicInformation?.campaignTitle}`,
          logo: campaign?.basicInformation?.campaignImage,
        },
      };

      try {
        const link = await axios.post(
          process.env.NEXT_PUBLIC_API_URL + "/api/donations/initialize",
          {
            payment: payment,
          }
        );

        if (link && link.data) {
          window.location.href = link.data;
        } else {
          setLoading(false);
          dispatch(toast(true, "Unable to initialize Flutterwave checkout", "error"));
        }
      } catch (err) {
        setLoading(false);
        dispatch(toast(true, err?.response?.data?.error || "Error initializing payment", "error"));
      }
    } else {
      dispatch(toast(true, "Please fill out all required fields and accept terms.", "error"));
    }
  };

  const payWithPaystack = async () => {
    if (tip >= 0 && amount > 0 && zip && email && country && terms) {
      setLoading(true);
      const totalAmount = others ? tip + amount : amount + amount * tip;
      const payment = {
        tx_ref: "FundandtracePS" + Date.now(),
        amount: totalAmount,
        currency: currency,
        meta: {
          paymentMethod: "Paystack",
          paymentOption: "card",
          zipCode: zip,
          country: country,
          campaignId: router.query.id,
          tip: others ? tip : amount * tip,
          amount: others ? tip + amount : amount + amount * tip,
          anonymous: anonymous,
          referralCode: referralCode,
        },
        customer: {
          email: email,
          name: `${firstName} ${lastName}`,
        },
        customizations: {
          title: `${campaign?.basicInformation?.campaignTitle} Payments`,
          description: `Fundandtrace Donation for ${campaign?.basicInformation?.campaignTitle}`,
          logo: campaign?.basicInformation?.campaignImage,
        },
      };

      try {
        const response = await axios.post(
          process.env.NEXT_PUBLIC_API_URL +
            "/api/donations/initializePaystack/" +
            campaign?._id,
          payment
        );

        if (response?.data?.authorizationUrl) {
          window.location.href = response.data.authorizationUrl;
        } else {
          setLoading(false);
          dispatch(toast(true, "Unable to initialize Paystack checkout", "error"));
        }
      } catch (err) {
        setLoading(false);
        dispatch(toast(true, err?.response?.data?.error || "Error initializing payment", "error"));
      }
    } else {
      dispatch(toast(true, "Please fill out all required fields and accept terms.", "error"));
    }
  };

  // Location-Aware Submit Routing
  const submit = async () => {
    if (paymentRail === "flutterwave") {
      await payWithFlutterwave();
    } else if (paymentRail === "paystack") {
      await payWithPaystack();
    } else {
      await payWithStripe();
    }
  };

  useEffect(() => {
    if (status == "failed") {
      dispatch(toast(true, "Transaction Failed, please Try again", "error"));
    }
  }, [status, dispatch]);

  const presetAmounts = getPresetDonationAmounts(currency);
  const feeEstimate = getProcessorFeeEstimate(amount, currency, paymentRail);
  const dualEstimate = getDualCurrencyEstimate(
    amount,
    currency,
    currency === "GBP" ? "NGN" : currency === "NGN" ? "GBP" : "USD"
  );
  const progressString = (
    ((campaign?.funding?.amountRaised || 0) /
      (campaign?.funding?.amountExpected || 1)) *
    100
  ).toFixed(1);

  return (
    <Layout
      ogImage={`${campaign?.basicInformation?.campaignImage}`}
      title={`Donation | ${campaign?.basicInformation?.campaignTitle}`}
      description={`Donate to ${campaign?.basicInformation?.campaignTitle}`}
    >
      <div className={styles.container}>
        <div className={styles.donatePage__blueBg}>
          <div className="custom-container">
            <div
              className="d-flex align-items-center mb-5 py-1"
              onClick={() => router.push(`/campaign/${campaign?._id}`)}
              style={{
                cursor: "pointer",
                width: "max-content",
                borderRadius: 4,
              }}
              role="button"
            >
              <img
                src="/images/icons/blueLeft.svg"
                width="18px"
                height="15px"
                alt="back"
              />
              <p className="mb-0 ml-2" style={{ color: "var(--color-primary)" }}>
                Back
              </p>
            </div>
            <p className="mb-5 text-blue">DONATE</p>
            <h3 className="text-heading mb-5">
              You’re donating to {campaign?.basicInformation?.campaignTitle}
            </h3>
            <div className="d-flex mb-3 flex-column flex-lg-row justify-content-between mt-4">
              <div
                className={[styles.input, "d-flex flex-column"].join(" ")}
                style={{ width: "47%" }}
              >
                <h2 className="text-medium mb-4">
                  First Name <span className="text-danger">*</span>
                </h2>
                <input
                  type="text"
                  onChange={(e) => setFirstName(e.target.value)}
                  value={firstName}
                  name="firstName"
                  id="firstName"
                />
              </div>
              <div
                className={[styles.input, "d-flex flex-column"].join(" ")}
                style={{ width: "47%" }}
              >
                <h2 className="text-medium mb-4">
                  Last Name <span className="text-danger">*</span>
                </h2>
                <input
                  type="text"
                  name="lastName"
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>
            <div
              className={[styles.input, "d-flex flex-column mb-5 w-100"].join(
                " "
              )}
            >
              <h2 className="text-medium mb-4">
                Email Address <span className="text-danger">*</span>
              </h2>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="mb-5">
              <input
                type="checkbox"
                name="anonymous"
                id="anonymous"
                className="mr-3 mt-1"
                checked={anonymous}
                onChange={() => setAnonymous(!anonymous)}
              />
              <label htmlFor="anonymous">Hide your name (anonymous)</label>
            </div>
            <div className="d-flex mb-5 justify-content-between mt-4">
              <div className="d-flex flex-column " style={{ width: "47%" }}>
                <h2 className="text-medium mb-4">Country</h2>
                <Select className="d-flex align-items-center justify-content-between name">
                  <button
                    onClick={() => setShowCountries(!showCountries)}
                    className="w-100 d-flex align-items-center justify-content-between"
                    style={{
                      border: "none",
                      minWidth: "100%",
                      borderStyle: "none",
                      boxShadow: "none",
                      outline: "none",
                      background: "white",
                      height: "48px",
                      padding: 0,
                    }}
                  >
                    <p
                      className="mb-0 value"
                      style={{
                        fontWeight: !country ? 300 : "",
                        opacity: !country ? 0.9 : 1,
                        fontSize: !country ? 14 : 16,
                      }}
                    >
                      {country ? country : "Country"}
                    </p>
                    <img
                      src="/images/icons/dropdown.svg"
                      width={13}
                      height={8}
                      className="pt-0 ml-2"
                     alt="" />
                  </button>

                  {showCountries && (
                    <div
                      onClick={() => setShowCountries(false)}
                      className="overlay"
                    ></div>
                  )}
                  {showCountries && (
                    <div className="dropdown bg-white">
                      <input
                        type="search"
                        autoFocus={true}
                        placeholder="Search"
                        autoComplete="new-password"
                        value={selectedCountry}
                        onChange={(e) => setSelectedCountry(e.target.value)}
                        style={{
                          position: "sticky",
                          top: 0,
                          width: "100%",
                          border: "none",
                          outline: "none",
                          background: "#E5E5E5",
                        }}
                        className="py-1 px-2"
                      />
                      <p
                        className="options py-3 mb-0 px-2"
                        onClick={() => {
                          setShowCountries(false);
                          setCountry("");
                        }}
                        role="button"
                      >
                        Country
                      </p>
                      {countries.map((c, i) => (
                        <p
                          className="options mb-0 px-2 py-3"
                          key={i}
                          onClick={() => handleSelectCountry(c?.name)}
                          role="button"
                        >
                          {c?.name}
                        </p>
                      ))}
                    </div>
                  )}
                </Select>
              </div>
              <div className="d-flex flex-column " style={{ width: "47%" }}>
                <h2 className="text-medium mb-4">Zip/Postal Code</h2>
                <input
                  type="text"
                  onChange={(e) => setZip(e.target.value)}
                  value={zip}
                />
              </div>
            </div>

            {/* Smart Location-Based Payment Gateway Selector */}
            <div className="mb-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h3 className="text-medium-heading mb-0">Select Payment Rail</h3>
                {country && (
                  <span className="badge badge-light px-3 py-2" style={{ borderRadius: 999, fontSize: 12 }}>
                    📍 Location: {country}
                  </span>
                )}
              </div>
              <div className="d-flex flex-column flex-md-row gap-3 justify-content-between mb-4">
                <div
                  onClick={() => setPaymentRail("stripe")}
                  className={`p-3 border rounded d-flex flex-column justify-content-between cursor-pointer ${
                    paymentRail === "stripe" ? "border-primary bg-light" : "border-secondary"
                  }`}
                  style={{
                    flex: 1,
                    minHeight: "90px",
                    cursor: "pointer",
                    borderWidth: paymentRail === "stripe" ? "2px" : "1px",
                    borderColor: paymentRail === "stripe" ? "var(--color-primary)" : "#E2E8F0",
                    background: paymentRail === "stripe" ? "var(--color-primary-light, #F0F3FF)" : "#FFFFFF",
                    borderRadius: "8px",
                  }}
                  role="button"
                >
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <strong style={{ color: "#1E293B" }}>💳 Stripe International</strong>
                    {paymentRail === "stripe" && <span style={{ color: "var(--color-primary)" }}>✓ Active</span>}
                  </div>
                  <p className="mb-0 text-small text-muted">
                    Apple Pay, Google Pay, Visa & Mastercard (GBP, USD, EUR)
                  </p>
                </div>

                <div
                  onClick={() => setPaymentRail("flutterwave")}
                  className={`p-3 border rounded d-flex flex-column justify-content-between cursor-pointer mt-3 mt-md-0 ml-md-3 ${
                    paymentRail === "flutterwave" ? "border-primary bg-light" : "border-secondary"
                  }`}
                  style={{
                    flex: 1,
                    minHeight: "90px",
                    cursor: "pointer",
                    borderWidth: paymentRail === "flutterwave" ? "2px" : "1px",
                    borderColor: paymentRail === "flutterwave" ? "var(--color-primary)" : "#E2E8F0",
                    background: paymentRail === "flutterwave" ? "var(--color-primary-light, #F0F3FF)" : "#FFFFFF",
                    borderRadius: "8px",
                  }}
                  role="button"
                >
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <strong style={{ color: "#1E293B" }}>🏦 Flutterwave Pan-African</strong>
                    {paymentRail === "flutterwave" && <span style={{ color: "var(--color-primary)" }}>✓ Active</span>}
                  </div>
                  <p className="mb-0 text-small text-muted">
                    Direct Bank Transfer, USSD, M-Pesa & Mobile Money (NGN, KES, GHS)
                  </p>
                </div>

                <div
                  onClick={() => setPaymentRail("paystack")}
                  className={`p-3 border rounded d-flex flex-column justify-content-between cursor-pointer mt-3 mt-md-0 ml-md-3 ${
                    paymentRail === "paystack" ? "border-primary bg-light" : "border-secondary"
                  }`}
                  style={{
                    flex: 1,
                    minHeight: "90px",
                    cursor: "pointer",
                    borderWidth: paymentRail === "paystack" ? "2px" : "1px",
                    borderColor: paymentRail === "paystack" ? "var(--color-primary)" : "#E2E8F0",
                    background: paymentRail === "paystack" ? "var(--color-primary-light, #F0F3FF)" : "#FFFFFF",
                    borderRadius: "8px",
                  }}
                  role="button"
                >
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <strong style={{ color: "#1E293B" }}>🟢 Paystack Nigeria</strong>
                    {paymentRail === "paystack" && <span style={{ color: "var(--color-primary)" }}>✓ Active</span>}
                  </div>
                  <p className="mb-0 text-small text-muted">
                    Bank Transfer, Card, USSD & QR Pay (NGN, GHS, ZAR, KES)
                  </p>
                </div>
              </div>
            </div>

            {/* UK Gift Aid Tax Relief Disclosure */}
            {country === "United Kingdom" && (
              <div
                className="p-3 mb-4 d-flex align-items-center"
                style={{
                  background: "#F0FDF4",
                  border: "1px solid #BBF7D0",
                  borderRadius: "8px",
                }}
              >
                <span style={{ fontSize: "20px", marginRight: "12px" }}>🇬🇧</span>
                <div>
                  <strong style={{ color: "#166534", fontSize: "14px" }}>UK Gift Aid Eligible</strong>
                  <p className="mb-0 text-small" style={{ color: "#15803D" }}>
                    Boost your donation value by 25% with UK Gift Aid at 0% platform fee deduction.
                  </p>
                </div>
              </div>
            )}

            <div className="d-flex align-items-center mb-4">
              <img src="/images/icons/lock.svg" height="21px" alt="" />
              <p className="text-small ml-3 mb-0">
                100% Escrow Protected: Funds held in custody until milestone review.
              </p>
            </div>
          </div>
        </div>

        <div className={styles.donatePage__summary}>
          <h3 className="mb-4 text-medium-heading">Donation Summary</h3>
          <p className="text-small mb-2">Select or Enter Your Contribution</p>

          {/* Quick Preset Buttons */}
          <div className="d-flex flex-wrap gap-2 mb-3">
            {presetAmounts.map((presetVal) => (
              <button
                type="button"
                key={presetVal}
                onClick={() => setAmount(presetVal)}
                className={`btn btn-sm mr-2 mb-2 ${
                  amount === presetVal ? "btn-primary" : "btn-outline-secondary"
                }`}
                style={{
                  borderRadius: "6px",
                  fontWeight: 600,
                  fontSize: "14px",
                  padding: "6px 14px",
                  borderWidth: "1px",
                }}
              >
                {getCurrency(currency)}{addCommaToNumber(presetVal)}
              </button>
            ))}
          </div>

          <div className={styles.money}>
            <div
              className="d-flex align-items-center justify-content-center font-weight-bold"
              style={{
                height: "50px",
                padding: "5px 15px",
                background: "#fafafa",
                fontSize: "18px",
              }}
            >
              {getCurrency(currency)}
            </div>
            <input
              type="number"
              className="money-input"
              style={{ borderStyle: "none", fontSize: "18px", fontWeight: "bold" }}
              value={amount || ""}
              placeholder="0"
              onChange={(e) => setAmount(Number(e.target.value))}
            />
            <div style={{ position: "relative" }}>
              <div
                onClick={() => setShowDropdown(!showDropdown)}
                className="d-flex align-items-center justify-content-center"
                style={{
                  height: "50px",
                  padding: "5px 10px",
                  width: "110px",
                  background: "#F2F2F2",
                  borderLeft: "0.5px solid #C4C4C4",
                  borderRadius: "0px 4px 4px 0px",
                  cursor: "pointer",
                }}
                role="button"
              >
                <p className="mb-0 mr-2 font-weight-bold">{currency}</p>
                <img
                  src="/images/icons/dropdown.svg"
                  width={13}
                  height={8}
                  className="pt-0"
                  alt=""
                />
              </div>
              <div
                style={{
                  position: "absolute",
                  top: "110%",
                  right: 0,
                  display: showDropdown ? "block" : "none",
                  width: "140px",
                  zIndex: 50,
                  boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                  background: "white",
                  borderRadius: "4px",
                }}
              >
                <ul className={styles.currency_drop} style={{ margin: 0, padding: "8px 0", listStyle: "none" }}>
                  {["USD", "GBP", "EUR", "NGN", "KES", "GHS"].map((currItem) => (
                    <li
                      key={currItem}
                      className="px-3 py-2 cursor-pointer hover-bg-light"
                      style={{ cursor: "pointer", fontWeight: currency === currItem ? 700 : 400 }}
                      onClick={() => {
                        setCurrency(currItem);
                        setShowDropdown(false);
                      }}
                    >
                      {getCurrency(currItem)} {currItem}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Dual Currency Purchasing Power Preview */}
          {dualEstimate && amount > 0 && (
            <div
              className="p-2 mt-2 mb-3 text-muted text-small d-flex align-items-center justify-content-between"
              style={{ background: "#F8FAFC", borderRadius: "6px", border: "1px dashed #CBD5E1" }}
            >
              <span>🌍 Estimated purchasing power:</span>
              <strong style={{ color: "#334155" }}>
                ≈ {dualEstimate.symbol}{dualEstimate.amount} {dualEstimate.currency}
              </strong>
            </div>
          )}

          <div style={{ marginBottom: 30 }}>
            <h3 className="mb-2 mt-4 text-medium-heading">Support Fund&Trace (Optional Tip)</h3>
            <p className="text-small mb-3 text-muted">
              Fund&Trace charges <strong>0% platform fees</strong> to organizers. We operate entirely through voluntary donor tips:
            </p>
            <div className="d-flex align-items-center">
              <select
                name="tips"
                id="tips"
                style={{ width: 150, height: "42px", borderRadius: "6px" }}
                className={styles.select}
                onChange={(e) => {
                  if (e.target.value === "others") {
                    setOthers(true);
                    setTip(0);
                  } else {
                    setTip(Number(e.target.value) / 100);
                    setOthers(false);
                  }
                }}
              >
                <option value="7.5">7.5%</option>
                <option value="10">10%</option>
                <option value="12.5">12.5%</option>
                <option value="20">20%</option>
                <option value="0">No Tip (0%)</option>
                <option value="others">Custom Amount</option>
              </select>
              {others && (
                <div className="ml-3 d-flex align-items-center">
                  <span className="font-weight-bold">{getCurrency(currency)}</span>
                  <input
                    className="ml-1"
                    type="number"
                    autoFocus
                    min="0"
                    placeholder="0"
                    onChange={(e) => setTip(Number(e.target.value))}
                    style={{
                      width: 120,
                      border: "none",
                      outline: "none",
                      borderBottom: "2px solid var(--color-primary)",
                      height: 36,
                      background: "transparent",
                      fontSize: "16px",
                      fontWeight: "bold",
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className={styles.line}></div>

          {/* Itemized Fee Transparency Breakdown */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <p className="mb-0 text-small">Donation Subtotal</p>
            <p className="font-weight-bold mb-0 text-black">
              {getCurrency(currency)}{addCommaToNumber(amount || 0)}
            </p>
          </div>

          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex align-items-center">
              <p className="mb-0 text-small mr-2">Platform Fee</p>
              <span className="badge badge-success" style={{ fontSize: "11px", borderRadius: 4, background: "#10B981" }}>
                0% FREE
              </span>
            </div>
            <p className="font-weight-bold mb-0 text-success">
              {getCurrency(currency)}0.00
            </p>
          </div>

          <div className="d-flex justify-content-between align-items-center mb-3">
            <p className="mb-0 text-small">Optional Tip</p>
            <p className="font-weight-bold mb-0 text-black">
              {getCurrency(currency)}
              {addCommaToNumber(others ? tip : tip ? Number((amount * tip).toFixed(2)) : 0)}
            </p>
          </div>

          <div className="d-flex justify-content-between align-items-center mb-4 pt-3 border-top">
            <p className="font-weight-bold mb-0 text-black" style={{ fontSize: "18px" }}>Total Charged</p>
            <p className="font-weight-bold mb-0 text-primary" style={{ fontSize: "20px", color: "var(--color-primary)" }}>
              {getCurrency(currency)}
              {addCommaToNumber(
                Number(((amount || 0) + (others ? tip : tip ? amount * tip : 0)).toFixed(2))
              )}
            </p>
          </div>

          <div className="mb-4 d-flex align-items-start">
            <input
              type="checkbox"
              name="policy"
              id="policy"
              checked={terms}
              className="mr-3 mt-1"
              onChange={(e) => setTerms(!terms)}
              style={{ width: "18px", height: "18px" }}
            />
            <label htmlFor="policy" className={`mb-0 ${!terms ? "text-danger" : "text-muted"}`} style={{ fontSize: "13px" }}>
              I agree to the Terms of Service, Privacy Policy, and milestone escrow terms.
            </label>
          </div>

          <button
            className="btn btn-brand-primary text-white w-100 mb-4"
            style={{
              height: "50px",
              fontSize: "16px",
              fontWeight: 700,
              background: "var(--color-primary)",
              borderRadius: "6px",
            }}
            onClick={submit}
            disabled={loading}
          >
            {loading ? (
              <Spinner type="TailSpin" width={25} height={25} color={"white"} />
            ) : (
              <p className="mb-0 text-white">
                Donate {getCurrency(currency)}
                {addCommaToNumber(
                  Number(((amount || 0) + (others ? tip : tip ? amount * tip : 0)).toFixed(2))
                )} Now
              </p>
            )}
          </button>

          <div
            className={[styles.card, "d-flex w-100 flex-column mt-5 pt-5"].join(
              " "
            )}
          >
            <img
              className={styles.card_img}
              src={campaign?.basicInformation?.campaignImage}
              alt="campaignPic"
              width="100%"
              height="200px"
            />
            <div className="py-4">
              <div className="d-flex align-items-center">
                <img
                  src="/images/icons/location.svg"
                  alt="location-icon"
                  width="13px"
                  height="16px"
                  className="mr-2"
                />
                <h3 className="text-blue mb-0">
                  {campaign?.basicInformation?.locationState},{" "}
                  {campaign?.basicInformation?.locationCountry}
                </h3>
              </div>
              <div className="mt-4">
                <h3 className="text-medium mb-3">
                  {campaign?.basicInformation?.campaignTitle}
                </h3>

                <p
                  className="mb-2 text-capitalize"
                  style={{
                    fontWeight: "normal",
                    fontSize: "14px",
                    color: "#807373",
                  }}
                >
                  {campaign?.category}
                </p>
                <div className="d-flex align-items-baseline">
                  <h3 className="text-heading mr-2">
                    {campaign?.funding?.currency == "USD"
                      ? "$"
                      : campaign?.funding?.currency == "GBP"
                      ? "£"
                      : "₦"}
                    {addCommaToNumber(campaign?.funding?.amountRaised)}
                  </h3>
                  <p
                    className="mb-0"
                    style={{ fontWeight: "300", color: "#B3B3B3" }}
                  >
                    raised of{" "}
                    {campaign?.funding?.currency == "USD"
                      ? "$"
                      : campaign?.funding?.currency == "GBP"
                      ? "£"
                      : "₦"}
                    {addCommaToNumber(campaign?.funding?.amountExpected)}
                  </p>
                </div>
                <div className={["progress mb-3", styles.progress].join(" ")}>
                  <div
                    className={[styles.progressbar, "progress-bar "].join(" ")}
                    role="progressbar"
                    style={{ width: progressString + "%" }}
                    aria-valuenow={Number(progressString)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  ></div>
                </div>
                <div className="d-flex align-items-center">
                  <img
                    src="/images/icons/time.svg"
                    alt="time"
                    width="17.5px"
                    height="17.5px"
                    className="mr-2"
                  />
                  <p className="mb-0" style={{ color: "#807373" }}>
                    {getDaysRemaining(campaign)} days left
                  </p>
                </div>
              </div>
            </div>
          </div>
          <p className="mb-2">Organizer</p>
          <div className="d-flex align-items-center mb-5">
            <img
              src="/images/icons/profile.svg"
              width={24}
              height={24}
             alt="" />
            <p className="ml-4 mb-0 mr-4" style={{ fontWeight: 400 }}>
              {campaign?.organizer}
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </Layout>
  );
}

const Select = styled.div`
  width: 100%;
  background: #ffffff;
  border: none;
  box-shadow: 0px 2px 2px rgba(50, 50, 71, 0.06);
  box-sizing: border-box;
  height: 46px;
  padding: 5px 15px;
  &:disabled {
    color: #b3b3b3;
  }
  position: relative;
  .value{
    overflow: hidden;
    whitespace: nowrap;
    max-height: 100%;
  }
  .options{
    @media screen and (max-width: 767px) {
      border-top: 1px solid #E5E5E5
    }
    background: transparent;
    &:hover {
      background: #E5E5E5;
    }
  }
  .dropdown{
    position: absolute;
    top: 110%;
     box-shadow: -2px 4px 48px rgba(50, 50, 71, 0.05),
    2px 10px 24px rgba(50, 50, 71, 0.05);
    z-index: 1000000000;
    cursor: pointer;
    width: max-content;
    max-height: 300px;
    overflow-y: scroll;
    left: 0;
    @media screen and (max-width: 767px) {
      position: fixed;
      top: 50%;
      left: 50%;
      width: 90%;
      border-radius: 4px;
      max-width: 430px;
      max-height: 400px;
      transform: translate(-50%, -50%)
    }
  }
  .overlay{
    width: 100vw;
    height:100vh;
    position:fixed;
    z-index 1000000;
    left: 0;
    top: 0;
    @media screen and (max-width: 767px) {
      background: rgba(0,0,0,0.5)
    }
  }
`;
