import React from "react";
import { NextPageContext } from "next";
import Link from "next/link";
import styled from "styled-components";
import Layout from "../components/Layout";
import Navbar from "../components/Navbar/Navbar";

interface ErrorProps {
  statusCode?: number;
}

export default function CustomError({ statusCode }: ErrorProps) {
  return (
    <Layout
      title={`${statusCode || "Error"} | Fund&Trace`}
      description="An error occurred on Fund&Trace."
      showFooter
    >
      <Navbar />
      <ErrorWrapper>
        <div className="custom-container text-center">
          <span className="errorCode">{statusCode || "500"}</span>
          <h1>{statusCode === 404 ? "Page Not Found" : "An Unexpected Error Occurred"}</h1>
          <p>
            {statusCode === 404
              ? "The page you are looking for does not exist or has been moved."
              : "Something went wrong on our end. Please try refreshing or return home."}
          </p>

          <div className="ctaRow">
            <Link href="/" passHref>
              <a className="btnPrimary">
                <span>← Back to Homepage</span>
              </a>
            </Link>

            <Link href="/Categories" passHref>
              <a className="btnSecondary">
                <span>Browse Campaigns</span>
              </a>
            </Link>
          </div>
        </div>
      </ErrorWrapper>
    </Layout>
  );
}

CustomError.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

const ErrorWrapper = styled.div`
  min-height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 140px 20px 80px 20px;
  background: linear-gradient(180deg, #f8faff 0%, #ffffff 100%);

  .errorCode {
    display: inline-block;
    font-size: 84px;
    font-weight: 900;
    color: var(--color-primary);
    line-height: 1;
    margin-bottom: 12px;
    letter-spacing: -2px;
  }

  h1 {
    font-size: 36px;
    font-weight: 800;
    color: var(--color-text-heading);
    margin-bottom: 16px;
  }

  p {
    font-size: 17px;
    color: #555c77;
    max-width: 520px;
    margin: 0 auto 32px auto;
    line-height: 1.6;
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
      font-size: 15px;
      padding: 12px 24px;
      border-radius: 4px;
      text-decoration: none;
      box-shadow: 0 4px 12px rgba(105, 121, 248, 0.3);
      transition: all 0.2s ease;

      &:hover {
        background: #5566f1;
        transform: translateY(-2px);
        text-decoration: none;
      }
    }

    .btnSecondary {
      background: #ffffff;
      color: #333a56 !important;
      font-weight: 600;
      font-size: 15px;
      padding: 12px 22px;
      border-radius: 4px;
      border: 1.5px solid #d5daeb;
      text-decoration: none;
      transition: all 0.2s ease;

      &:hover {
        border-color: var(--color-primary);
        color: var(--color-primary) !important;
        transform: translateY(-2px);
        text-decoration: none;
      }
    }
  }
`;
