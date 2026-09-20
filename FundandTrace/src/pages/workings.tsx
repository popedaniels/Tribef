import React, { useState } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import styled from "styled-components";
import Layout from "../components/Layout";
import Navbar from "../components/Navbar/Navbar";
import StartFunding from "../components/homepageComponents/StartFundingSection/StartFunding";
import { selectAuthStateState } from "../../store/slices/authSlice";

const comparisonData = [
  {
    feature: "Platform Fee",
    fundAndTrace: "0% (Free forever)",
    traditional: "5% - 8% deducted from total",
    winner: "ft",
  },
  {
    feature: "Disbursement Model",
    fundAndTrace: "Milestone-based (Verified in phases)",
    traditional: "Lump sum without required milestones",
    winner: "ft",
  },
  {
    feature: "Donor Financial Statements",
    fundAndTrace: "Automated periodic audit reports",
    traditional: "None (zero post-donation visibility)",
    winner: "ft",
  },
  {
    feature: "Scam & Diversion Protection",
    fundAndTrace: "Proof & invoice verification before release",
    traditional: "Manual report only after funds are drained",
    winner: "ft",
  },
  {
    feature: "Multi-Currency Local Payouts",
    fundAndTrace: "USD, GBP, NGN direct to local bank accounts",
    traditional: "High cross-border conversion & wire fees",
    winner: "ft",
  },
];

const faqs = [
  {
    question: "How does the milestone disbursement system protect donors?",
    answer:
      "When an organizer creates a campaign on Fund&Trace, they break down their target into sequential project phases (e.g., Phase 1: Medical diagnosis, Phase 2: Surgical procedure, Phase 3: Recovery). Funds for subsequent phases are only disbursed after receipts, invoices, or progress proof are uploaded and verified.",
  },
  {
    question: "Why does Fund&Trace charge 0% platform fee?",
    answer:
      "We believe that every single penny donated should directly fuel the intended cause. Standard payment gateway processing fees (e.g., Stripe, Flutterwave) still apply, but Fund&Trace deducts zero commission from creators or donors.",
  },
  {
    question: "What happens if a creator fails to provide milestone proof?",
    answer:
      "If a creator cannot substantiate milestone completion with verifiable documentation, remaining escrowed funds are held, investigated by our team, and can be refunded back to contributors or re-routed to a verified institution (e.g., direct hospital payout).",
  },
  {
    question: "How do donors receive audit statements?",
    answer:
      "Whenever funds are disbursed from a campaign you supported, our system automatically generates an itemized financial statement and emails it directly to you. You can also review real-time audit logs in your donor dashboard.",
  },
  {
    question: "How fast can I set up a campaign?",
    answer:
      "Campaign setup takes under 10 minutes. Once your identity and payout details are submitted, your campaign goes live with built-in social sharing tools for WhatsApp, Twitter, Facebook, and Instagram.",
  },
];

export default function Workings() {
  const { authenticated } = useSelector(selectAuthStateState);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <Layout
      title="How Fund&Trace Works | Radical Crowdfunding Transparency"
      description="Learn how Fund&Trace eliminates fraud and maximizes social impact through milestone-based disbursements, 0% platform fees, and automated donor audit statements."
      showFooter
    >
      <PageWrapper>
        {/* Navigation */}
        <Navbar />

        {/* Hero Section */}
        <HeroSection>
          <div className="custom-container">
            <div className="heroInner">
              <span className="badge">The New Standard in Giving</span>
              <h1>
                How <span>Fund&amp;Trace</span> Works
              </h1>
              <p>
                We built Fund&amp;Trace to eliminate the black-box opacity of traditional
                fundraising. Here is how our milestone-based accountability engine protects
                donors and empowers creators.
              </p>

              <div className="ctaRow">
                <Link href={authenticated ? "/StartACampaign" : "/SignUp"} passHref>
                  <a className="btnPrimary">
                    <span>Start a 0% Fee Campaign</span>
                    <span>→</span>
                  </a>
                </Link>
                <a href="#comparison" className="btnSecondary">
                  <span>See Platform Comparison</span>
                  <span>↓</span>
                </a>
              </div>
            </div>
          </div>
        </HeroSection>

        {/* 4-Step Deep Dive */}
        <StepsSection>
          <div className="custom-container">
            <div className="sectionHeader">
              <span className="tag">Step-by-Step Cycle</span>
              <h2>4 Steps from Campaign Launch to Verified Impact</h2>
              <p>
                From the moment a campaign is created to the final disbursement, every transaction
                is logged, audited, and shared.
              </p>
            </div>

            <div className="stepsGrid">
              <div className="stepCard">
                <div className="stepNum">01</div>
                <div className="stepIconWrap">
                  <img src="/images/icons/setup.svg" alt="Setup" />
                </div>
                <h3>1. Phased Milestone Budgeting</h3>
                <p>
                  Creators outline their goals with itemized milestone phases (e.g., Equipment
                  Purchase $5k, Installation $3k). This sets clear expectations before any money is
                  collected.
                </p>
              </div>

              <div className="stepCard">
                <div className="stepNum">02</div>
                <div className="stepIconWrap">
                  <img src="/images/icons/payment.svg" alt="Give" />
                </div>
                <h3>2. Zero-Fee Community Giving</h3>
                <p>
                  Donors contribute securely via card, bank transfer, or mobile money in USD, GBP,
                  or NGN. Fund&amp;Trace charges 0% platform commission on all donations.
                </p>
              </div>

              <div className="stepCard">
                <div className="stepNum">03</div>
                <div className="stepIconWrap">
                  <img src="/images/icons/tracking.svg" alt="Verify" />
                </div>
                <h3>3. Milestone Review &amp; Release</h3>
                <p>
                  Initial funding unlocks Phase 1. Subsequent funds are disbursed only as
                  organizers submit valid receipts, invoices, and progress photos to our audit
                  review team.
                </p>
              </div>

              <div className="stepCard">
                <div className="stepNum">04</div>
                <div className="stepIconWrap">
                  <img src="/images/icons/accountable.svg" alt="Statements" />
                </div>
                <h3>4. Automated Donor Audit Statements</h3>
                <p>
                  Whenever funds are disbursed, an automated itemized ledger statement is dispatched
                  directly to every contributor’s inbox, ensuring complete peace of mind.
                </p>
              </div>
            </div>
          </div>
        </StepsSection>

        {/* Platform Comparison Matrix */}
        <ComparisonSection id="comparison">
          <div className="custom-container">
            <div className="sectionHeader">
              <span className="tag">Unmatched Advantage</span>
              <h2>Why Fund&amp;Trace Outperforms Legacy Platforms</h2>
              <p>
                See how our transparent infrastructure compares to traditional crowdfunding
                services.
              </p>
            </div>

            <div className="tableWrapper">
              <table className="comparisonTable">
                <thead>
                  <tr>
                    <th>Capability &amp; Safeguards</th>
                    <th className="highlightCol">Fund&amp;Trace</th>
                    <th>Traditional Crowdfunding</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((row, i) => (
                    <tr key={i}>
                      <td className="featureTitle">{row.feature}</td>
                      <td className="highlightCell">
                        <div className="cellContent">
                          <img src="/images/icons/blueCheck.svg" alt="check" width="18" height="18" />
                          <span>{row.fundAndTrace}</span>
                        </div>
                      </td>
                      <td className="otherCell">{row.traditional}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </ComparisonSection>

        {/* FAQ Section */}
        <FaqSection>
          <div className="custom-container">
            <div className="sectionHeader">
              <span className="tag">Got Questions?</span>
              <h2>Frequently Asked Questions</h2>
              <p>Everything you need to know about our transparency engine and policies.</p>
            </div>

            <div className="faqList">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className={`faqItem ${openFaq === index ? "faqOpen" : ""}`}
                  onClick={() => toggleFaq(index)}
                >
                  <div className="faqQuestion">
                    <h4>{faq.question}</h4>
                    <span className="faqIcon">{openFaq === index ? "−" : "+"}</span>
                  </div>
                  <AnimatePresence>
                    {openFaq === index && (
                      <motion.div
                        className="faqAnswer"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <p>{faq.answer}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </FaqSection>

        {/* Closing CTA */}
        <StartFunding />
      </PageWrapper>
    </Layout>
  );
}

const PageWrapper = styled.div`
  background: #ffffff;
  width: 100%;
`;

const HeroSection = styled.section`
  background: linear-gradient(180deg, #f8faff 0%, #f4f6fc 100%);
  padding: 140px 0 80px 0;
  text-align: center;

  .heroInner {
    max-width: 800px;
    margin: 0 auto;

    .badge {
      display: inline-block;
      background: #eef1fe;
      color: #4b5df5;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      padding: 6px 16px;
      border-radius: 4px;
      margin-bottom: 20px;
      border: 1px solid rgba(105, 121, 248, 0.2);
    }

    h1 {
      font-size: 46px;
      font-weight: 800;
      color: var(--color-text-heading);
      line-height: 1.2;
      margin-bottom: 20px;

      span {
        color: var(--color-primary);
      }

      @media screen and (max-width: 767px) {
        font-size: 32px;
      }
    }

    p {
      font-size: 18px;
      color: #555c77;
      line-height: 1.65;
      margin-bottom: 32px;

      @media screen and (max-width: 767px) {
        font-size: 16px;
      }
    }

    .ctaRow {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;

      @media screen and (max-width: 575px) {
        flex-direction: column;
      }

      .btnPrimary {
        background: var(--color-primary);
        color: #ffffff !important;
        font-weight: 600;
        font-size: 16px;
        padding: 14px 28px;
        border-radius: 4px;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 4px 14px rgba(105, 121, 248, 0.35);
        transition: all 0.2s ease;

        &:hover {
          background: #5566f1;
          transform: translateY(-2px);
          text-decoration: none;
        }

        @media screen and (max-width: 575px) {
          width: 100%;
          justify-content: center;
        }
      }

      .btnSecondary {
        background: #ffffff;
        color: #333a56 !important;
        font-weight: 600;
        font-size: 16px;
        padding: 14px 24px;
        border-radius: 4px;
        border: 1.5px solid #d5daeb;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        transition: all 0.2s ease;

        &:hover {
          border-color: var(--color-primary);
          color: var(--color-primary) !important;
          transform: translateY(-2px);
          text-decoration: none;
        }

        @media screen and (max-width: 575px) {
          width: 100%;
          justify-content: center;
        }
      }
    }
  }
`;

const StepsSection = styled.section`
  padding: 90px 0;
  background: #ffffff;

  .sectionHeader {
    text-align: center;
    max-width: 720px;
    margin: 0 auto 50px auto;

    .tag {
      display: inline-block;
      color: #4b5df5;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 12px;
      background: #eef1fe;
      padding: 4px 12px;
      border-radius: 4px;
    }

    h2 {
      font-size: 34px;
      font-weight: 800;
      color: var(--color-text-heading);
      margin-bottom: 14px;

      @media screen and (max-width: 767px) {
        font-size: 26px;
      }
    }

    p {
      font-size: 16px;
      color: #5d6580;
      line-height: 1.6;
      margin: 0;
    }
  }

  .stepsGrid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;

    @media screen and (max-width: 1024px) {
      grid-template-columns: repeat(2, 1fr);
    }

    @media screen and (max-width: 640px) {
      grid-template-columns: 1fr;
    }
  }

  .stepCard {
    background: #fbfcfe;
    border: 1px solid #e9edf8;
    border-radius: 4px;
    padding: 32px 24px;
    position: relative;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 16px 32px rgba(23, 28, 53, 0.08);
      border-color: #cbd4f5;
      background: #ffffff;
    }

    .stepNum {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--color-primary);
      color: #ffffff;
      font-weight: 700;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 18px;
    }

    .stepIconWrap {
      width: 52px;
      height: 52px;
      border-radius: 4px;
      background: #eef1fe;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 18px;

      img {
        width: 26px;
        height: 26px;
      }
    }

    h3 {
      font-size: 18px;
      font-weight: 700;
      color: var(--color-text-heading);
      margin-bottom: 12px;
      line-height: 1.35;
    }

    p {
      font-size: 14px;
      color: #5d6580;
      line-height: 1.6;
      margin: 0;
    }
  }
`;

const ComparisonSection = styled.section`
  padding: 90px 0;
  background: #f8faff;

  .sectionHeader {
    text-align: center;
    max-width: 720px;
    margin: 0 auto 50px auto;

    .tag {
      display: inline-block;
      color: #4b5df5;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 12px;
      background: #eef1fe;
      padding: 4px 12px;
      border-radius: 4px;
    }

    h2 {
      font-size: 34px;
      font-weight: 800;
      color: var(--color-text-heading);
      margin-bottom: 14px;

      @media screen and (max-width: 767px) {
        font-size: 26px;
      }
    }

    p {
      font-size: 16px;
      color: #5d6580;
      line-height: 1.6;
      margin: 0;
    }
  }

  .tableWrapper {
    background: #ffffff;
    border-radius: 4px;
    border: 1px solid #e8ecf8;
    overflow-x: auto;
    box-shadow: 0 12px 30px rgba(23, 28, 53, 0.04);
  }

  .comparisonTable {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
    min-width: 600px;

    th {
      padding: 20px 24px;
      font-size: 15px;
      font-weight: 700;
      color: var(--color-text-heading);
      background: #fbfcfe;
      border-bottom: 1px solid #e8ecf8;

      &.highlightCol {
        background: #eef1fe;
        color: #4b5df5;
        font-size: 16px;
      }
    }

    td {
      padding: 18px 24px;
      font-size: 14px;
      border-bottom: 1px solid #f0f2f9;
      color: #424a66;

      &.featureTitle {
        font-weight: 600;
        color: var(--color-text-heading);
      }

      &.highlightCell {
        background: #fbfcfe;
        font-weight: 700;
        color: #1e8e3e;

        .cellContent {
          display: flex;
          align-items: center;
          gap: 8px;
        }
      }

      &.otherCell {
        color: #788099;
      }
    }
  }
`;

const FaqSection = styled.section`
  padding: 90px 0;
  background: #ffffff;

  .sectionHeader {
    text-align: center;
    max-width: 680px;
    margin: 0 auto 50px auto;

    .tag {
      display: inline-block;
      color: #4b5df5;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 12px;
      background: #eef1fe;
      padding: 4px 12px;
      border-radius: 4px;
    }

    h2 {
      font-size: 34px;
      font-weight: 800;
      color: var(--color-text-heading);
      margin-bottom: 14px;

      @media screen and (max-width: 767px) {
        font-size: 26px;
      }
    }

    p {
      font-size: 16px;
      color: #5d6580;
      line-height: 1.6;
      margin: 0;
    }
  }

  .faqList {
    max-width: 800px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .faqItem {
    background: #fbfcfe;
    border: 1px solid #e9edf8;
    border-radius: 4px;
    padding: 22px 28px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      border-color: #cbd4f5;
    }

    &.faqOpen {
      background: #ffffff;
      border-color: var(--color-primary);
      box-shadow: 0 8px 24px rgba(105, 121, 248, 0.08);
    }

    .faqQuestion {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;

      h4 {
        font-size: 17px;
        font-weight: 700;
        color: var(--color-text-heading);
        margin: 0;
      }

      .faqIcon {
        font-size: 22px;
        font-weight: 600;
        color: var(--color-primary);
        line-height: 1;
      }
    }

    .faqAnswer {
      overflow: hidden;
      margin-top: 14px;
      padding-top: 14px;
      border-top: 1px solid #edf1fb;

      p {
        font-size: 15px;
        color: #5d6580;
        line-height: 1.65;
        margin: 0;
      }
    }
  }
`;
