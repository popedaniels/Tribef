import React from "react";
import styled from "styled-components";
import Navbar from "../components/Navbar/Navbar";
import Layout from "../components/Layout";
import StartFunding from "../components/homepageComponents/StartFundingSection/StartFunding";

interface TeamMember {
  name: string;
  image: string;
  position: string;
  twitter: string;
  linkedin: string;
  email: string;
}

const Team: TeamMember[] = [
  {
    name: "Wisdom Osara",
    image: "/images/ideas1.png",
    position: "CO-FOUNDER & CEO",
    twitter: "https://twitter.com/fundandtrace",
    linkedin: "https://linkedin.com/company/fundandtrace",
    email: "wisdom@fundandtrace.com",
  },
  {
    name: "Daniel Maxwell",
    image: "/images/ideas2.png",
    position: "HEAD OF PRODUCT & OPERATIONS",
    twitter: "https://twitter.com/fundandtrace",
    linkedin: "https://linkedin.com/company/fundandtrace",
    email: "daniel@fundandtrace.com",
  },
  {
    name: "Amina Yusuf",
    image: "/images/ideas3.png",
    position: "HEAD OF DISBURSEMENT & AUDIT",
    twitter: "https://twitter.com/fundandtrace",
    linkedin: "https://linkedin.com/company/fundandtrace",
    email: "amina@fundandtrace.com",
  },
  {
    name: "Samuel Adebayo",
    image: "/images/larry.jpg",
    position: "LEAD ENGINEER",
    twitter: "https://twitter.com/fundandtrace",
    linkedin: "https://linkedin.com/company/fundandtrace",
    email: "samuel@fundandtrace.com",
  },
];

const TeamCard = ({ teamDetail }: { teamDetail: TeamMember }) => {
  return (
    <article className="d-flex flex-column align-items-center teamCard">
      <img
        src={teamDetail?.image}
        alt={teamDetail?.name}
        style={{ borderRadius: "50%", width: 120, height: 120, objectFit: "cover" }}
        className="pic mb-3"
      />
      <h4 className="mb-1" style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text-heading)" }}>
        {teamDetail?.name}
      </h4>
      <p style={{ fontSize: 13, color: "var(--color-primary)", fontWeight: 600 }} className="mb-3">
        {teamDetail?.position}
      </p>
      <div className="d-flex align-items-center">
        <a href={teamDetail?.twitter} target="_blank" rel="noreferrer">
          <img src="/images/about/twitter.svg" width="18px" height="16px" alt="twitter" className="mx-2" />
        </a>
        <a href={teamDetail?.linkedin} target="_blank" rel="noreferrer">
          <img src="/images/about/linkedIn.svg" width="18px" height="16px" alt="linkedin" className="mx-2" />
        </a>
        <a href={`mailto:${teamDetail?.email}`}>
          <img src="/images/about/email.svg" width="18px" height="16px" alt="email" className="mx-2" />
        </a>
      </div>
    </article>
  );
};

export default function AboutUsPage() {
  return (
    <Layout url="https://fundandtrace.com" ogImage="/og-image.jpg"
      description="Learn about Fund&Trace's mission to eliminate crowdfunding fraud and bring radical transparency to global fundraising."
      title="About Us | Fund&Trace"
      showFooter
    >
      <Wrapper>
        <Navbar />

        {/* Hero */}
        <section className="text-center mb-5 pb-4" style={{ paddingTop: 140 }}>
          <article className="custom-container">
            <p className="text-blue mb-3 font-weight-bold">OUR PURPOSE</p>
            <h1 className="text-heading mb-3 mx-auto text-center" style={{ maxWidth: 900, fontSize: 38, fontWeight: 800 }}>
              Making Fundraising <span style={{ color: "var(--color-primary)" }}>Accessible &amp; Radical</span> for the World
            </h1>
            <p className="mx-auto text-center text-muted" style={{ maxWidth: 720, fontSize: 17, lineHeight: 1.6 }}>
              We are building the trust layer for global social giving so that every changemaker has
              the credibility to raise capital and every donor knows their money truly matters.
            </p>
          </article>
        </section>

        {/* Who We Are */}
        <section className="d-flex d-md-block flex-column justify-content-between align-items-md-start custom-container whoWeAre mb-5 pb-4">
          <img
            src="/images/about/aboutUs.png"
            alt="about us team"
            className="float-right order-md-1 order-12 mb-md-4"
          />
          <article className="order-md-12 order-1 mb-4 mb-md-0">
            <p className="text-blue mb-2 font-weight-bold">WHO WE ARE</p>
            <h3 className="text-heading mb-3" style={{ fontSize: 28, fontWeight: 700 }}>
              A Community Driven by Impact and Integrity
            </h3>
            <p className="mb-3 text-muted" style={{ lineHeight: 1.7, fontSize: 15 }}>
              Fund&amp;Trace was founded on a simple observation: billions of dollars in charitable
              and humanitarian appeals go unfunded every year simply because potential donors fear
              misuse or lack of accountability.
            </p>
            <p className="mb-3 text-muted" style={{ lineHeight: 1.7, fontSize: 15 }}>
              By integrating milestone-based escrow verification, automated donor reporting, and
              0% platform commissions, we enable grassroot campaigns, non-profits, and families to
              prove their integrity and mobilize supporters worldwide.
            </p>
          </article>
        </section>

        {/* Story Section */}
        <section className="custom-container" style={{ clear: "both", paddingTop: 60 }}>
          <p className="text-blue mb-2 text-md-center font-weight-bold">THE FOUR PILLARS</p>
          <h2 className="text-heading mb-3 text-md-center" style={{ fontSize: 32, fontWeight: 800 }}>
            How We Build Unbreakable Trust
          </h2>
          <p style={{ maxWidth: 680, fontSize: 16 }} className="mx-auto text-md-center text-muted mb-5">
            Our platform connects donors, creators, communities, and verified audit protocols into a
            single virtuous cycle of honest giving.
          </p>
        </section>

        {/* 4 Pillars Flow */}
        <section className="custom-container d-flex flex-md-row flex-column justify-content-between story mb-5 pb-5">
          <article className="left pt-4">
            <div className="mb-5 position-relative">
              <img
                src="/images/about/arrow1.svg"
                alt="arrow decorator"
                className="d-none d-lg-block"
                style={{ position: "absolute", top: "-50px", right: "-50px" }}
              />
              <div className="box mb-3 d-flex align-items-lg-center justify-content-lg-center ml-lg-auto">
                0% Fee Giving
              </div>
              <p className="text-lg-right mb-0 text-muted" style={{ fontSize: 14 }}>
                100% of your donation fuels the intended cause with zero platform commission deductions.
              </p>
            </div>
            <div className="position-relative">
              <img
                src="/images/about/arrow3.svg"
                alt="arrow decorator"
                className="d-none d-lg-block"
                style={{ position: "absolute", top: "20px", right: "-80px" }}
              />
              <div className="box mb-3 d-flex align-items-lg-center justify-content-lg-center ml-lg-auto">
                Global Diaspora
              </div>
              <p className="text-lg-right mb-0 text-muted" style={{ fontSize: 14 }}>
                Connecting international benefactors with verified local causes across emerging regions.
              </p>
            </div>
          </article>

          <figure className="d-flex align-items-center justify-content-center">
            <img src="/images/about/aboutStory.png" width="100%" alt="about story illustration" />
          </figure>

          <article className="right pt-4">
            <div className="mb-5 position-relative">
              <img
                src="/images/about/arrow2.svg"
                alt="arrow decorator"
                className="d-none d-lg-block"
                style={{ position: "absolute", top: "-50px", left: "-50px" }}
              />
              <div className="box mb-3 d-flex align-items-lg-center justify-content-lg-center mr-lg-auto">
                Local Community
              </div>
              <p className="mb-0 text-muted" style={{ fontSize: 14 }}>
                Empowering grassroots organizers with professional fundraising and milestone tracking tools.
              </p>
            </div>
            <div className="position-relative">
              <img
                src="/images/about/arrow4.svg"
                alt="arrow decorator"
                className="d-none d-lg-block"
                style={{ position: "absolute", top: "20px", left: "-80px" }}
              />
              <div className="box mb-3 d-flex align-items-lg-center justify-content-lg-center mr-lg-auto">
                Real-Time Audits
              </div>
              <p className="mb-0 text-muted" style={{ fontSize: 14 }}>
                Itemized financial statements dispatched automatically as campaign funds are disbursed.
              </p>
            </div>
          </article>
        </section>

        {/* Mission & Vision */}
        <section className="custom-container mission mb-5 pb-5">
          <article className="d-md-flex flex-column flex-md-row justify-content-md-center align-items-md-center mb-5 mb-md-4 mx-auto">
            <img src="/images/about/mission1.png" width="220px" alt="Mission" className="mr-lg-4 mb-4 mb-lg-0 rounded" />
            <img src="/images/about/mission2.png" width="220px" alt="Mission" className="d-none d-lg-block mr-lg-4 rounded" />
            <div className="ml-md-4">
              <h3 className="text-heading mb-2" style={{ fontSize: 24, fontWeight: 700 }}>Our Mission</h3>
              <p className="mb-0 text-muted" style={{ lineHeight: 1.6, fontSize: 15 }}>
                To create a frictionless, zero-commission fundraising ecosystem where milestone
                verification replaces blind faith, enabling donors to support any cause with absolute
                confidence.
              </p>
            </div>
          </article>

          <article className="d-md-flex flex-column flex-md-row justify-content-md-center align-items-md-center mx-auto">
            <img src="/images/about/mission3.png" width="220px" alt="Vision" className="mr-lg-4 mb-4 mb-lg-0 rounded" />
            <img src="/images/about/mission4.png" width="220px" alt="Vision" className="d-none d-lg-block mr-lg-4 rounded" />
            <div className="ml-md-4">
              <h3 className="text-heading mb-2" style={{ fontSize: 24, fontWeight: 700 }}>Our Vision</h3>
              <p className="mb-0 text-muted" style={{ lineHeight: 1.6, fontSize: 15 }}>
                A world where distance, geography, and institutional distrust never stand between a
                person in need and the global community ready to help them.
              </p>
            </div>
          </article>
        </section>

        {/* Numbers Impact Strip */}
        <section style={{ background: "#F0F1FE" }} className="py-5">
          <section className="custom-container py-4">
            <article className="numbers mx-auto">
              <div className="mb-4 d-flex flex-column align-items-center">
                <h4 className="mb-2" style={{ color: "var(--color-primary)", fontSize: 42, fontWeight: 800 }}>
                  230+
                </h4>
                <p className="mb-0 font-weight-bold" style={{ color: "#424a66" }}>Active Campaigns</p>
              </div>
              <div className="mb-4 d-flex flex-column align-items-center">
                <h4 className="mb-2" style={{ color: "var(--color-primary)", fontSize: 42, fontWeight: 800 }}>
                  35,500+
                </h4>
                <p className="mb-0 font-weight-bold" style={{ color: "#424a66" }}>Verified Donors</p>
              </div>
              <div className="mb-4 d-flex flex-column align-items-center">
                <h4 className="mb-2" style={{ color: "var(--color-primary)", fontSize: 42, fontWeight: 800 }}>
                  $450,000+
                </h4>
                <p className="mb-0 font-weight-bold" style={{ color: "#424a66" }}>Raised for Causes</p>
              </div>
              <div className="mb-5 mb-md-0 d-flex flex-column align-items-center">
                <h4 className="mb-2" style={{ color: "var(--color-primary)", fontSize: 42, fontWeight: 800 }}>
                  100%
                </h4>
                <p className="mb-0 font-weight-bold" style={{ color: "#424a66" }}>Traceability Rate</p>
              </div>
              <div className="mb-5 mb-md-0 d-flex flex-column align-items-center">
                <h4 className="mb-2" style={{ color: "var(--color-primary)", fontSize: 42, fontWeight: 800 }}>
                  14+
                </h4>
                <p className="mb-0 font-weight-bold" style={{ color: "#424a66" }}>Countries Supported</p>
              </div>
              <div className="mb-5 mb-md-0 d-flex flex-column align-items-center">
                <h4 className="mb-2" style={{ color: "var(--color-primary)", fontSize: 42, fontWeight: 800 }}>
                  0%
                </h4>
                <p className="mb-0 font-weight-bold" style={{ color: "#424a66" }}>Platform Fee</p>
              </div>
            </article>
          </section>
        </section>

        {/* Leadership Team */}
        <section className="custom-container my-5 py-5">
          <p className="text-blue mb-2 text-center font-weight-bold">LEADERSHIP</p>
          <h2 className="text-heading mb-3 text-center" style={{ fontSize: 32, fontWeight: 800 }}>
            The Team Driving Radical Transparency
          </h2>
          <p className="mb-5 text-center mx-auto text-muted" style={{ maxWidth: 600, fontSize: 16 }}>
            Our leadership brings together experienced fintech operators, engineers, and non-profit
            leaders committed to honest social impact.
          </p>

          <div className="teams custom-container">
            {Team.map((team, i) => (
              <TeamCard key={i} teamDetail={team} />
            ))}
          </div>
        </section>

        <StartFunding />
      </Wrapper>
    </Layout>
  );
}

const Wrapper = styled.main`
  background: white;

  .whoWeAre {
    img {
      width: 48%;
      margin-left: 40px;
      object-fit: contain;
      border-radius: 4px;
      @media screen and (max-width: 767px) {
        width: 100%;
        margin-left: 0px;
      }
    }
  }

  .box {
    background: var(--color-primary);
    color: white;
    font-weight: 700;
    font-size: 14px;
    padding: 10px 22px;
    border-radius: 4px;
    width: max-content;
    box-shadow: 0 4px 12px rgba(105, 121, 248, 0.3);
  }

  .story {
    .left,
    .right {
      width: 32%;
      @media screen and (max-width: 991px) {
        width: 100%;
      }
    }
    figure {
      width: 32%;
      @media screen and (max-width: 991px) {
        width: 70%;
        margin: 30px auto;
      }
    }
  }

  .numbers {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 20px;
    max-width: 1200px;
    @media screen and (max-width: 991px) {
      grid-template-columns: repeat(3, 1fr);
    }
    @media screen and (max-width: 575px) {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .teams {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 30px;
    margin-bottom: 80px;

    @media screen and (max-width: 991px) {
      grid-template-columns: repeat(2, 1fr);
    }
    @media screen and (max-width: 575px) {
      grid-template-columns: 1fr;
    }

    .teamCard {
      background: #fbfcfe;
      border: 1px solid #e8ecf8;
      border-radius: 4px;
      padding: 32px 20px;
      transition: all 0.2s ease;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 24px rgba(23, 28, 53, 0.08);
        border-color: #cbd4f5;
        background: #ffffff;
      }
    }
  }
`;
