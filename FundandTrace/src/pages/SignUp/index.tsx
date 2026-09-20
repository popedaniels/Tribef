import Link from "next/link";
import React, { useEffect } from "react";
import styled from "styled-components";
import Navbar from "../../components/Navbar/Navbar";
import { useSelector } from "react-redux";
import { selectAuthStateState } from "../../../store/slices/authSlice";
import { useRouter } from "next/router";
import Layout from "../../components/Layout";

export default function StepOne() {
  const { authenticated } = useSelector(selectAuthStateState);
  const router = useRouter();

  useEffect(() => {
    authenticated && router.push("/");
  }, [authenticated, router]);

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
            <div className="d-flex align-items-center">
              <p className="mb-0 mr-3">Already have an account?</p>
              <Link href="/SignUp/SignIn" passHref>
                <a className="mb-0" style={{ color: "var(--color-primary)" }}>
                  Sign in
                </a>
              </Link>
            </div>
          </header>
          <div className="d-block d-md-none">
            <Navbar />
          </div>
        </div>
        <main className="d-flex justify-content-center align-items-center">
          <section className="d-flex flex-column justify-content-center align-items-center">
            <h2 className="text-heading mb-5 text-center">Sign up as a/an?</h2>
            <article
              className="d-flex flex-column flex-md-row mb-4 box-row flex-wrap w-100"
              style={{ justifyContent: "space-between" }}
            >
              <div className="p-4 box">
                <p className="text-blue mb-3">Individual</p>
                <p className="mb-3">
                  I’m an <b>Individual</b>
                </p>
                <div className="d-flex align-items-center mb-2">
                  <img
                    src="/images/icons/blueCheck.svg"
                    alt="check"
                    width="20px"
                    height="20px"
                    className="mr-3"
                  />
                  <p className="mb-0">Standard dashboard</p>
                </div>
                <div className="d-flex align-items-center mb-2">
                  <img
                    src="/images/icons/blueCheck.svg"
                    alt="check"
                    width="20px"
                    height="20px"
                    className="mr-3"
                  />
                  <p className="mb-0">Campaign Dashboard</p>
                </div>
                <div className="d-flex align-items-center mb-4">
                  <img
                    src="/images/icons/blueCheck.svg"
                    alt="check"
                    width="20px"
                    height="20px"
                    className="mr-3"
                  />
                  <p className="mb-0">Personalized Settings, etc.</p>
                </div>
                <button
                  className="btn mt-4"
                  onClick={() => router.push(`/SignUp/individual`)}
                >
                  <p className="mb-0 text-white">Continue</p>
                </button>
              </div>

              <div className="p-4 box mt-4 mt-md-0">
                <p className="text-blue mb-3">Charity</p>
                <p className="mb-3">
                  I’m a <b>Charity</b> organization
                </p>
                <div className="d-flex align-items-center mb-2">
                  <img
                    src="/images/icons/blueCheck.svg"
                    alt="check"
                    width="20px"
                    height="20px"
                    className="mr-3"
                  />
                  <p className="mb-0">Charity Page</p>
                </div>
                <div className="d-flex align-items-center mb-2">
                  <img
                    src="/images/icons/blueCheck.svg"
                    alt="check"
                    width="20px"
                    height="20px"
                    className="mr-3"
                  />
                  <p className="mb-0">Standard dashboard</p>
                </div>
                <div className="d-flex align-items-center mb-4">
                  <img
                    src="/images/icons/blueCheck.svg"
                    alt="check"
                    width="20px"
                    height="20px"
                    className="mr-3"
                  />
                  <p className="mb-0">Campaign Dashboard, etc.</p>
                </div>
                <button
                  className="btn mt-4"
                  onClick={() => router.push(`/SignUp/charities`)}
                >
                  <p className="mb-0 text-white">Continue</p>
                </button>
              </div>
            </article>
          </section>
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
    padding: 50px;
    @media screen and (max-width: 767px) {
      width: 100%;
      padding: 125px 15px 50px 15px;
    }
    @media screen and (min-width: 768px) and (max-width: 1023px) {
      width: 100%;
    }

    section {
      box-shadow: -2px 4px 48px rgba(50, 50, 71, 0.05),
        2px 10px 24px rgba(50, 50, 71, 0.05);
      border-radius: 4px;
      width: 900px;
      @media screen and (max-width: 767px) {
        width: 100%;
        max-width: 500px;
        padding: 39px 15px;
      }

      .box-row {
        @media screen and (max-width: 767px) {
          width: 100%;
        }
      }
      padding: 39px 62px;
      @media screen and (min-width: 768px) and (max-width: 1023px) {
        padding: 39px 25px;
      }
      background-color: white;
      .text {
        font-style: normal;
        font-weight: 400;
        font-size: 18px;
        line-height: 24px;
        color: #979797;
      }
      .box {
        background: #fafafa;
        border: 0.5px solid #cccccc;
        box-sizing: border-box;
        border-radius: 4px;
        width: 47%;

        @media screen and (max-width: 767px) {
          width: 100%;
        }
      }
      .bottomBox {
        @media screen and (min-width: 768px) and (max-width: 1199px) {
          margin-top: 20px !important;
        }
      }
      button {
        background: var(--color-primary);
        box-shadow: 0px 2px 4px rgba(50, 50, 71, 0.06),
          0px 2px 2px rgba(50, 50, 71, 0.06);
        border-radius: 4px;
        display: flex;
        width: 100%;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        padding: 15px 30px;
        transition: 0.3s ease;
        &:hover {
          opacity: 0.8;
          transition: 0.3s ease;
        }
      }
    }
  }
`;
