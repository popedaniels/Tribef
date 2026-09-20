import React from "react";
import Navbar from "../../components/Navbar/Navbar";
import styled from "styled-components";
import Layout from "../../components/Layout";
import Link from "next/link";
import ContactUsSection from "../../components/HelpComponents/ContactUsSection";

export default function Help() {
  return (
    <Layout
      showFooter
      title="FAQ | Fund&Trace"
      description="Get help with some Frequently Asked Questions"
    >
      <Wrapper>
        <section style={{ height: "77px" }}>
          <Navbar />
        </section>
        <Header className="mb-3">
          <h1 className="text-heading mb-0 text-center">
            Frequently Asked Questions
          </h1>
        </Header>
        <div className="mb-5 custom-container">
          <p className="text-center mb-0">Date of posting: 7th August 2021</p>
        </div>
        <section className="mb-5 custom-container grid-container">
          <article className="d-flex flex-column align-items-center pt-4 pb-2 px-3 mx-auto mx-md-0">
            <img
              src="/images/icons/general.svg"
              alt="help general icon"
              width={70}
              height={70}
            />
            <h3 className="my-3">General</h3>
            <p className="mb-0 text-center">
              Find out about how we operate, understand Fund&Trace policies and
              how we protect our customers, etc.
            </p>
            <Link href="/help/general" passHref>
              <a className="my-3 text-blue">View all</a>
            </Link>
          </article>
          <article className="d-flex flex-column align-items-center pt-4 pb-2 px-3 mx-auto mx-md-0">
            <img
              src="/images/icons/fundraisers.png"
              alt="help fundraisers icon"
              width={70}
              height={70}
            />
            <h3 className="my-3">Fundraisers</h3>
            <p className="mb-0 text-center">
              Learn how to plan, create and manage your crowdfunding campaign
              for individual and non-profit
            </p>
            <Link href="/help/fundraisers" passHref>
              <a className="my-3 text-blue">View all</a>
            </Link>
          </article>
          <article className="d-flex flex-column align-items-center pt-4 pb-2 px-3 mx-auto mx-md-0">
            <img
              src="/images/icons/donors.png"
              alt="help donors icon"
              width={70}
              height={70}
            />
            <h3 className="my-3">Donors</h3>
            <p className="mb-0 text-center">
              Learn how to evaluate and donate to crowdfunding campaigns, track
              campaigns and customize your profile..
            </p>
            <Link href="/help/donors" passHref>
              <a className="my-3 text-blue">View all</a>
            </Link>
          </article>
        </section>

        <ContactUsSection />
      </Wrapper>
    </Layout>
  );
}

const Wrapper = styled.main`
  article {
    background: #ffffff;
    border: 1px solid #e4e4e4;
    box-sizing: border-box;
    box-shadow: 0px 6px 12px rgba(50, 50, 71, 0.06);
    border-radius: 4px;
    max-width: 400px;
    h3 {
      font-style: normal;
      font-weight: 600;
      font-size: 18px;
      line-height: 24px;
      /* identical to box height, or 133% */

      display: flex;
      align-items: center;

      color: #272424;
    }
  }
  .grid-container {
    max-width: 1100px;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    row-gap: 1.5rem;
    column-gap: 1.5rem;

    @media screen and (min-width: 768px) and (max-width: 1023px) {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    @media screen and (max-width: 767px) {
      grid-template-columns: repeat(1, minmax(0, 1fr));
    }
  }
`;

const Header = styled.header`
  background: #f9f9f9;
  padding: 50px 15px;
`;
