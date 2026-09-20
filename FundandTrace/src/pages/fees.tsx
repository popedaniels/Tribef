import React from "react";
import styled from "styled-components";
import StartFunding from "../components/homepageComponents/StartFundingSection/StartFunding";
import Layout from "../components/Layout";
import Navbar from "../components/Navbar/Navbar";
import Link from "next/link";

const fees = [
  {
    fundraiser: "Not-for-profit",
    platform: "0%",
    transaction: "1.4% + 20p**",
    tips: "Optional",
    currency: "1%",
    total: "2.5%",
    booster: "5%",
  },
  {
    fundraiser: "Corporation",
    platform: "3%",
    transaction: "1.4% + 20p**",
    tips: "Optional",
    currency: "1%",
    total: "5.4%",
    booster: "5%",
  },
  {
    fundraiser: "Individual/ Community Initiative",
    platform: "1%",
    transaction: "1.4% + 20p**",
    tips: "Optional",
    currency: "1%",
    total: "3.4%",
    booster: "5%",
  },
];

export default function FeesPage() {
  return (
    <Layout
      showFooter
      title="Fees | Fund&Trace"
      description="The Fees involved with using fund&trace"
    >
      <Wrapper>
        <div>
          <Navbar />
        </div>
        <Header className="mb-3" style={{ paddingTop: 130 }}>
          <h1 className="text-heading mb-0 text-center">
            <span style={{ color: "var(--color-primary)" }}>Transparent Pricing &amp; Fees</span> for Fundraisers
          </h1>
        </Header>
        <div className="mb-5 custom-container">
          <p className="text-center mb-0">
            Date of posting: 11th November, 2021
          </p>
        </div>
        <section className="mb-5 custom-container">
          <h2 className="text-heading">Fees</h2>
          <p>
            Fund&Trace’s mission stands to redefine crowdfunding by making it
            possible to track the use of funds received from donations, driving
            transparency between fundraisers and donors. Donors can now know
            when donations are received and how their donations are being spent.
            Fund&Trace categorises fundraisers into 3 main types:
          </p>
          <ul>
            <li>
              <strong>Not-for-profit</strong>: Registered charitable and
              not-for-profit organisations.
            </li>
            <li>
              <strong>Corporations</strong>: For-profit organisations and
              companies.
            </li>
            <li>
              <strong>Individuals</strong>: Individuals, groups or communities.
            </li>
          </ul>
        </section>
        <section className="custom-container mx-auto mb-5">
          <h2 className="text-heading">Fees Breakdown</h2>
          <p className="mb-4">
            The fee payable at the end of the campaign is dependent on the
            category of the fundraiser, therefore it is important to choose the
            correct category for your campaign. The table below shows the
            breakdown of the fees by fundraiser type.
          </p>
          <section
            className="w-100 overflow-auto"
            style={{ width: "100%", maxWidth: "100%" }}
          >
            <section className="border mx-auto" style={{ width: 1200 }}>
              <article
                className="bg-dark w-100 text-white d-flex"
                style={{ height: 50 }}
              >
                <div
                  className="px-3 d-flex align-items-center py-2"
                  style={{ width: "20%" }}
                >
                  Fundraiser
                </div>
                <div
                  className="px-3 d-flex align-items-center py-2"
                  style={{ width: "15%" }}
                >
                  Platform fee
                </div>
                <div
                  className="px-3 d-flex align-items-center py-2"
                  style={{ width: "15%" }}
                >
                  Transaction fee
                </div>
                <div
                  className="px-3 d-flex align-items-center py-2"
                  style={{ width: "10%" }}
                >
                  Tips
                </div>
                <div
                  className="px-3 d-flex align-items-center py-2"
                  style={{ width: "25%" }}
                >
                  Foreign currency fee (if any)
                </div>
                <div
                  className="px-3 d-flex align-items-center py-2"
                  style={{ width: "15%" }}
                >
                  Total fees
                </div>
                <div
                  className="px-3 d-flex align-items-center py-2"
                  style={{ width: "20%" }}
                >
                  Booster++ fund fee
                </div>
              </article>

              {fees.map((fee, i) => (
                <article
                  className="border-top border-bottom w-100 d-flex"
                  style={{ height: 50 }}
                  key={i}
                >
                  <div
                    className="px-3 d-flex align-items-center py-2 border-right"
                    style={{ width: "20%" }}
                  >
                    {fee?.fundraiser}
                  </div>
                  <div
                    className="px-3 d-flex align-items-center py-2 border-right"
                    style={{ width: "15%" }}
                  >
                    {fee?.platform}
                  </div>
                  <div
                    className="px-3 d-flex align-items-center py-2 border-right"
                    style={{ width: "15%" }}
                  >
                    {fee?.transaction}
                  </div>
                  <div
                    className="px-3 d-flex align-items-center py-2 border-right"
                    style={{ width: "10%" }}
                  >
                    {fee?.tips}
                  </div>
                  <div
                    className="px-3 d-flex align-items-center py-2 border-right"
                    style={{ width: "25%" }}
                  >
                    {fee?.currency}
                  </div>
                  <div
                    className="px-3 d-flex align-items-center py-2 border-right"
                    style={{ width: "15%" }}
                  >
                    {fee?.total}
                  </div>
                  <div
                    className="px-3 d-flex align-items-center py-2"
                    style={{ width: "20%" }}
                  >
                    {fee?.booster}
                  </div>
                </article>
              ))}
            </section>
          </section>
        </section>
        <section className="mb-5 custom-container">
          <h2 className="text-heading">Definitions:</h2>
          <ul>
            <li className="mb-3">
              <strong>Platform Fee</strong>: Fund&Trace charges this fee to
              continuously improve the performance of our website and community
              by incorporating new features and providing technical assistance
              to fundraisers. In the interest of supporting not-for-profit
              organisations, they are exempt from paying platform fees.{" "}
            </li>
            <li className="mb-3">
              <strong>Transaction Fee</strong>: This fee goes to the payment
              processor and is deducted from each contribution made to your
              campaign. Transaction fees are also dependent on each country or
              currency through which donation is made.
            </li>
            <li className="mb-3">
              <strong>Tips</strong>: We appreciate any tips donated to
              Fund&Trace and will re-invest it into the organisation to provide
              assistance to more campaigns and work towards making crowdfunding
              easier and more transparent. You can choose to tip us anywhere
              from 0% (no tip) to 15%.{" "}
            </li>
            <li className="mb-3">
              <strong>Foreign currency fee</strong>: Campaign targets are
              presented to donors with a live conversion preview into their
              local currency at checkout (see the dual-currency estimate on
              every campaign page). This helps donors in Africa and the diaspora
              give in a currency they understand, and donations are received in
              the currency of the donation. A conversion fee applies to
              donations made in a currency different from the campaign's
              settlement currency, and is calculated at the applicable payment
              provider's exchange rate — the effect is shown to the donor
              before they confirm.
            </li>
            <li>
              <strong>Booster++ fund (in development)</strong>: we are working
              with partners to launch fund matching. When a campaign qualifies,
              eligible donations will be matched by our partners so fundraisers
              reach their targets sooner. There will be a 0% platform or
              transaction fee charged on this extra fund once it goes live.
            </li>
          </ul>
        </section>
        <section className="mb-5 custom-container">
          <h2 className="text-heading">Fees Calculation</h2>
          <p>
            We have provided a quick example to show how our fees are calculated
            below.
          </p>
          <p>
            If a donor located in the UK donates £100 to a campaign created by a
            fundraiser outside the UK, the following will be deducted as fees:
          </p>
        </section>
        <section className="mb-5 custom-container">
          <section
            className="p-md-5 p-3"
            style={{ background: "#F0F1FE", borderRadius: "4px" }}
          >
            <h2 className="text-heading" style={{ color: "var(--color-primary)" }}>
              Fees example
            </h2>
            <ul style={{ color: "var(--color-primary)" }}>
              <li className="mb-3">
                <strong>Not-for-profit fundraiser</strong>:
                <ul>
                  <li>No platform fees will apply</li>
                  <li>Transaction fees: 1.4% + 20p (£1.60)</li>
                  <li>
                    Foreign currency fee: This fee will apply because the
                    campaign target will not be in ££ since the fundraiser is
                    outside the UK. Thus, £1 will be charged.
                  </li>
                </ul>
                <p>
                  Therefore, a total of £1.60 + £1 = £2.60 will be charged and
                  the fundraiser will receive £97.40.
                </p>
              </li>
              <li className="mb-3">
                <strong>For-profit/community project</strong>:
                <ul>
                  <li>
                    Platform fees will apply because this is a for-profit
                    campaign. Hence, £3 will be charged.{" "}
                  </li>
                  <li>Transaction fees: 1.4% + 20p (£1.60)</li>
                  <li>
                    Foreign currency fee: This fee will apply because the
                    campaign target will not be in ££ since the fundraiser is
                    outside the UK. Therefore, £1 will be charged.
                  </li>
                </ul>
                <p>
                  Therefore, a total of £3 + £1.60 + £1 = £5.60 will be charged
                  and the fundraiser will receive £94.40
                </p>
              </li>
              <li className="mb-3">
                <strong>Individual</strong>:
                <ul>
                  <li>
                    Lower platform fees will apply because this is an individual
                    campaign. Hence, £1 will be charged.{" "}
                  </li>
                  <li>Transaction fees: 1.4% + 20p (£1.60)</li>
                  <li>
                    Foreign currency fee: This fee will apply because the
                    campaign target will not be in ££ since the fundraiser is
                    outside the UK. Therefore, £1 will be charged.
                  </li>
                </ul>
                <p>
                  Therefore, a total of £1 + £1.60 + £1 = £3.60 will be charged
                  and the fundraiser will receive £96.40
                </p>
              </li>
            </ul>
          </section>{" "}
          <p className="mt-3">
            For all fundraisers, when the booster++ fund becomes active, if it
            is secured from any of our partners, only a 5% charge will be
            deducted from this supplementary funding.
          </p>
        </section>
        <section className="mb-5 custom-container">
          <h2 className="text-heading">
            Fees comparison with other crowdfunding platforms
          </h2>

          <p >
            The primary objective of fund and trace is to provide maximum
            support and value to fundraisers, we therefore benchmarked ourselves
            to similar platforms to provide the lowest fees.
          </p>
          <section className="pt-4" style={{width: "100%", overflowX: "auto", maxWidth: "100%"}}>
          <table>
            <tbody>
              <tr>
                <td style={{minWidth: 102}}>
                  <p>Country</p>
                </td>
                <td style={{minWidth: 132}}>
                  <p>Platform</p>
                </td>
                <td style={{minWidth: 260}}>
                  <p>Platform fees</p>
                </td>
                <td style={{minWidth: 190}}>
                  <p>Transaction fees</p>
                </td>
                <td style={{minWidth: 236}}>
                  <p>Total fees</p>
                </td>
                <td style={{minWidth: 160}}>
                  <p>Booster funding</p>
                </td>
              </tr>
              <tr>
                <td rowSpan={6} style={{minWidth: 102}}>
                  <p>UK/EU</p>
                </td>
                <td style={{minWidth: 132}}>
                  <p>Fund&amp;Trace</p>
                </td>
                <td style={{minWidth: 260}}>
                  <p>0% (charity/not-for-profit)</p>
                  <p>3.6% (for-profit)</p>
                  <p>1% (individual)</p>
                </td>
                <td style={{minWidth: 190}}>
                  <p>1.4% + 20p</p>
                  <p>&nbsp;</p>
                </td>
                <td style={{minWidth: 236}}>
                  <p>1.4% (charity/not-for-profit)</p>
                  <p>5% (for-profit)</p>
                  <p>2.6% (individual)</p>
                </td>
                <td style={{minWidth: 160}}>
                <input type="checkbox" checked readOnly style={{height:"20px", minWidth: "20px"}} />
                </td>
              </tr>
              <tr>
                <td style={{minWidth: 102}}>
                  <p>Crowdfunder</p>
                </td>
                <td style={{minWidth: 102}}>
                  <p>0% (charity/not-for-profit)</p>
                  <p>3% (Standard project)</p>
                </td>
                <td style={{minWidth: 190}}>
                  <p>1.9% + 23p</p>
                </td>
                <td style={{minWidth: 236}}>
                  <p>1.9% (charity/not-for-profit)</p>
                  <p>4.9% (Standard project)</p>
                </td>
                <td style={{minWidth: 160}}>
                  <input type="checkbox" checked readOnly style={{height:"20px", minWidth: "20px"}}  />
                </td>
              </tr>
              <tr>
                <td style={{minWidth: 102}}>
                  <p>Gofundme</p>
                </td>
                <td style={{minWidth: 102}}>
                  <p>0%</p>
                </td>
                <td style={{minWidth: 190}}>
                  <p>2.9% + 25p</p>
                </td>
                <td style={{minWidth: 236}}>
                  <p>2.9%</p>
                </td>
                <td style={{minWidth: 160}}>
                  <p>&nbsp;</p>
                </td>
              </tr>
              <tr>
                <td style={{minWidth: 102}}>
                  <p>JustGiving</p>
                </td>
                <td style={{minWidth: 102}}>
                  <p>0%</p>
                </td>
                <td style={{minWidth: 190}}>
                  <p>1.9% + 25p</p>
                </td>
                <td style={{minWidth: 236}}>
                  <p>1.9%</p>
                </td>
                <td style={{minWidth: 160}}>
                  <p>&nbsp;</p>
                </td>
              </tr>
              <tr>
                <td style={{minWidth: 102}}>
                  <p>Kickstarter</p>
                </td>
                <td style={{minWidth: 102}}>
                  <p>5%</p>
                </td>
                <td style={{minWidth: 190}}>
                  <p>3% + 20p</p>
                </td>
                <td style={{minWidth: 236}}>
                  <p>8%</p>
                </td>
                <td style={{minWidth: 160}}>
                  <p>&nbsp;</p>
                </td>
              </tr>
              <tr>
                <td style={{minWidth: 102}}>
                  <p>Indiegogo</p>
                </td>
                <td style={{minWidth: 102}}>
                  <p>5%</p>
                </td>
                <td style={{minWidth: 190}}>
                  <p>2.9% + 30p</p>
                </td>
                <td style={{minWidth: 236}}>
                  <p>7.9%</p>
                </td>
                <td style={{minWidth: 160}}>
                  <p>&nbsp;</p>
                </td>
              </tr>
            </tbody>
          </table>
          </section>

          
        </section>
        <section className="mb-5 custom-container">
          <h2 className="text-heading">Other regions</h2>

          <p>
            Fees as regards to other regions will be made available as soon as
            partnerships with the countries in these regions are finalized.
          </p>
        </section>
        <section className="mb-5 custom-container pb-5">
          <h2 className="text-heading">Still have questions?</h2>

          <p>
            Our <Link href="/help">help centre</Link> is packed with more
            information, you could also reach out to us through{" "}
            <a href="mailto:info@fundandtrace.com" target="_blank" rel="noreferrer">info@fundandtrace.com</a>
          </p>
        </section>
        <StartFunding />
      </Wrapper>
    </Layout>
  );
}

const Wrapper = styled.main`
  article {
    div {
      font-size: 16px;
      font-weight: 400;
    }
  }
  tr {
    border-bottom: 0.5px solid #dee2e6;
  }
  td {
    border-right: 0.5px solid #dee2e6;
    padding: 12px 16px;
  }
  table {
    margin: 0 auto;
    border-top: 1px solid #dee2e6;
    border-left: 1px solid #dee2e6;
    p {
      margin-bottom: 0;
    }
  }
`;

const Header = styled.header`
  background: #f9f9f9;
  padding: 50px 15px;
`;
