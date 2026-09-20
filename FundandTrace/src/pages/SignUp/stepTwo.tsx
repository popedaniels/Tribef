import React from "react";
import styled from "styled-components";
import { useRouter } from "next/router";
import Link from "next/link";
import Navbar from "../../components/Navbar/Navbar";
import axios from "axios";

import { toast } from "../../../store/slices/ToastSlice";
import Layout from "../../components/Layout";
import { useAppDispatch } from "./../../../store/hooks";

export default function StepOne() {
  const router = useRouter();
  const { email } = router.query;
  const dispatch = useAppDispatch();

  const handleSubmit = async () => {
    try {
      const res = await axios.post(
        process.env.NEXT_PUBLIC_API_URL +
          "/api/auth/signup/verifyEmail/" +
          email
      );
      res && dispatch(toast(true, "Verification Mail sent!", "success"));
    } catch (error) {
      dispatch(toast(true, "Something went wrong, try again", "error"));
    }
  };

  return (
    <Layout
      title="Fund&Trace | Sign Up"
      description="Sign Up to Fund&Trace, The leading fundraising platform"
    >
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
          <article className="d-flex flex-column justify-content-center align-items-center">
            <p className="mb-4 text-blue">VERIFICATION</p>
            <h2 className="text-heading mb-4 text-center">
              Verify your email address to continue
            </h2>
            <img src="/images/mail.png" width="260px" className="mb-5" alt="" />
            <p className="mb-5 text text-center">
              An email has been sent to {email} with a link to verify your
              account. If you have not received the email after a few
              minutes,please check your spam folder
            </p>
            <button className="btn" onClick={handleSubmit}>
              <p className="mb-0 text-white">Resend</p>
            </button>
          </article>
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
      padding: 39px 62px;
      background-color: white;
      .text {
        font-style: normal;
        font-weight: 400;
        font-size: 18px;
        line-height: 24px;
        /* or 133% */

        color: #979797;
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
