import React, { useEffect, useState } from "react";
import styled from "styled-components";
import Link from "next/link";
import Navbar from "../../components/Navbar/Navbar";
import { useSelector } from "react-redux";
import { selectAuthStateState } from "../../../store/slices/authSlice";
import axios from "axios";
import { useRouter } from "next/router";
import Spinner from "../../components/composed/spinner/Spinner";
import { toast } from "../../../store/slices/ToastSlice";
import Layout from "../../components/Layout";
import { useAppDispatch } from "./../../../store/hooks";

export default function Verify() {
  const { profile, authenticated } = useSelector(selectAuthStateState);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();

  useEffect(() => {
    profile?.verified && router.push("/");
    !authenticated && router.push("/");
  }, [authenticated, profile?.verified, router]);
  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await axios.post(
        process.env.NEXT_PUBLIC_API_URL +
          "/api/auth/signup/verifyEmail/" +
          profile?.email
      );
      res && setLoading(false);
      res && dispatch(toast(true, "Verification Mail sent!", "success"));
    } catch (error) {
      setLoading(false);
    }
  };
  return (
    <Layout url="https://fundandtrace.com" ogImage="/og-image.jpg" title="Fund&Trace | Verify">
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
              You have not verified your account yet.
            </h2>
            <img src="/images/mail.png" width="260px" className="mb-5" alt="" />
            <p className="mb-5 text text-center">
              Your account has not been verified yet. Kindly click the button
              below to send a verification link to your mail.
            </p>
            <button className="btn" onClick={handleSubmit}>
              {loading ? (
                <Spinner
                  type="TailSpin"
                  width={25}
                  height={25}
                  color={"white"}
                />
              ) : (
                <p className="mb-0 text-white">Send verification mail</p>
              )}
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
