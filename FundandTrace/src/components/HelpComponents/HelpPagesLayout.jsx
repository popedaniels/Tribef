import React from "react";
import Navbar from "../../components/Navbar/Navbar";
import styled from "styled-components";
import Layout from "../../components/Layout";
import Link from "next/link";
import ContactUsSection from "../../components/HelpComponents/ContactUsSection";

export default function HelpPagesLayout({ description, page, children }) {
  return (
    <Layout showFooter title="FAQ | Fund&Trace" description={description}>
      <Wrapper>
        <section style={{ height: "77px" }}>
          <Navbar />
        </section>
        <section className="custom-container mb-5 mt-4">
          <p className="text-blue">
            <span className="text-blue">
              {" "}
              <Link href="/help" passHref>
                <a
                  className="text-blue text-underline"
                  style={{ textDecoration: "underline" }}
                >
                  Frequently asked questions
                </a>
              </Link>
            </span>{" "}
            <span>{"/"} </span>
            {page}{" "}
          </p>
        </section>
        <section
          style={{ maxWidth: "1060px" }}
          className="mx-auto custom-container"
        >
          <h2 className="text-heading">{page}</h2>
          <p className="mb-5">Date of posting: 24 February 2021</p>
          {children}
        </section>
        <ContactUsSection />
      </Wrapper>
    </Layout>
  );
}

const Wrapper = styled.main``;
