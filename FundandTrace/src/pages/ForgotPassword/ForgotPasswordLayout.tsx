import React, { useEffect } from "react";
import type { ReactNode } from "react";
import Layout from "../../components/Layout";
import styled from "styled-components";
import Link from "next/link";
import Navbar from "../../components/Navbar/Navbar";
import { useSelector } from "react-redux";
import { selectAuthStateState } from "../../../store/slices/authSlice";
import { useRouter } from "next/router";

interface ForgotPasswordLayoutProps {
  children: React.ReactNode;
}

export default function ForgotPasswordLayout({ children }: ForgotPasswordLayoutProps) {
  const { authenticated } = useSelector(selectAuthStateState);
  const router = useRouter();

  useEffect(() => {
    authenticated && router.push("/");
  }, [authenticated, router]);

  return (
    <Layout url="https://fundandtrace.com" ogImage="/og-image.jpg" title={`Password Reset`}>
      <Wrapper>
        <div className="w-100 bg-white">
          <header className="header d-md-flex justify-content-between align-items-center custom-container d-none">
            <Link href="/" passHref>
              <a>
                <img
                  src="/images/logo.png"
                  alt="fundandtraceLogo"
                  width={78}
                  height={55}
                />
              </a>
            </Link>
          </header>
          <div className="d-block d-md-none">
            <Navbar />
          </div>
        </div>
        <main className="d-flex justify-content-center align-items-center">
          {children}
        </main>
      </Wrapper>
    </Layout>
  );
}

const Wrapper = styled.div`
  min-height: 100vh;
  background: #f9f9f9;
  .header {
    height: 70px;
  }
  main {
    padding: 50px 0;

    @media screen and (max-width: 767px) {
      padding: 125px 15px 50px 15px;
    }
    article {
      box-shadow: -2px 4px 48px rgba(50, 50, 71, 0.05),
        2px 10px 24px rgba(50, 50, 71, 0.05);
      border-radius: 4px;
      width: 662px;
      @media screen and (max-width: 767px) {
        width: 100%;
        max-width: 500px;
        padding: 39px 15px;
      }
      padding: 39px 125px;
      background-color: white;
      .text {
        font-style: normal;
        font-weight: 300;
        font-size: 14px;
        line-height: 24px;
        /* or 133% */

        color: #514949;

        opacity: 0.9;
      }
      button {
        background: var(--color-primary);
        box-shadow: 0px 2px 4px rgba(50, 50, 71, 0.06),
          0px 2px 2px rgba(50, 50, 71, 0.06);
        border-radius: 4px;
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        padding: 15px 30px;
      }
    }
  }
`;
