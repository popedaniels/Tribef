import React, { useEffect } from "react";
import styled from "styled-components";
import { useRouter } from "next/router";
import { useState } from "react";
import Link from "next/link";
import Navbar from "../../components/Navbar/Navbar";
import { useSelector } from "react-redux";
import {
  check,
  logout,
  selectAuthStateState,
} from "../../../store/slices/authSlice";
import { startCampaignActions } from "../../../store/slices/startCampaignSlice";
import Layout from "../../components/Layout";
import { toast } from "../../../store/slices/ToastSlice";
import {
  grabErrorMessage,
  grabErrorStatus,
} from "../../components/helperFunctions/helperFunctions";
import axios from "axios";
import { useAppDispatch } from "./../../../store/hooks";

export default function StepOne() {
  const [view, setView] = useState("");
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { authenticated, profile } = useSelector(selectAuthStateState);

  useEffect(() => {
    !authenticated && router.push("/SignUp");
  }, [authenticated, router]);

  useEffect(() => {
    !profile?.verified && router.push("/SignUp/Verify");
  }, [profile, router]);

  const handleSubmit = async (
    type: "Individual" | "non-profit" | "for-profit"
  ) => {
    try {
      const { category } = router.query;
      const startCampaign = {
        campaignType: type,
        category: category,
        organizer: `${profile.firstName} ${profile.lastName}`,
        organizerId: profile._id,
      };
      const res = await axios.post(
        process.env.NEXT_PUBLIC_API_URL + "/api/startCampaign/",
        startCampaign,
        { withCredentials: true }
      );
      res && localStorage.setItem("campaignId", res.data.data._id);
      res &&
        router.push(
          `/StartACampaign/BasicInformation?type=${type}&category=${category}`
        );
    } catch (error) {
      dispatch(toast(true, grabErrorMessage(error), "error"));
      if (grabErrorStatus(error) == 403) {
        dispatch(logout());
      }
    }
  };

  useEffect(() => {
    if (profile?._id) {
      dispatch(check(profile._id));
    }
  }, [profile?._id, dispatch]);

  return (
    <Layout title="Start a campaign">
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
              <a
                className="mb-0"
                style={{ color: "var(--color-primary)", cursor: "pointer" }}
                onClick={() => {
                  dispatch(logout());
                  router.push("/");
                }}
                role="button"
              >
                Sign Out
              </a>
            </div>
          </header>
          <div className="d-block d-md-none">
            <Navbar />
          </div>
        </div>
        <main className="d-flex justify-content-center align-items-center">
          <section className="d-flex flex-column justify-content-center align-items-center">
            <h2 className="text-heading mb-5 text-center">
              Who are you raising money for?
            </h2>
            <article
              className="d-flex flex-column flex-md-row mb-5 box-row flex-wrap"
              style={{ justifyContent: "space-evenly" }}
            >
              <div className="p-4 box">
                <p className="text-blue mb-3">Individual</p>
                <p className="mb-3">
                  I’m an <b>individual</b> crowdfunding for a personal project,
                  campaign or cause
                </p>
                <div className="d-flex align-items-center mb-2">
                  <img
                    src="/images/icons/blueCheck.svg"
                    alt="check"
                    width="20px"
                    height="20px"
                    className="mr-3"
                  />
                  <p className="mb-0">3% transaction fees</p>
                </div>
                <div className="d-flex align-items-center mb-2">
                  <img
                    src="/images/icons/blueCheck.svg"
                    alt="check"
                    width="20px"
                    height="20px"
                    className="mr-3"
                  />
                  <p className="mb-0">Access to extra funding</p>
                </div>
                <div className="d-flex align-items-center mb-4">
                  <img
                    src="/images/icons/blueCheck.svg"
                    alt="check"
                    width="20px"
                    height="20px"
                    className="mr-3"
                  />
                  <p className="mb-0">Access to free support</p>
                </div>
                <button
                  className="btn mt-4"
                  onClick={() => handleSubmit("Individual")}
                >
                  <p className="mb-0 text-white">Continue</p>
                </button>
              </div>

              <div className="p-4 box mt-4 mt-md-0">
                <p className="text-blue mb-3">Non-profit</p>
                <p className="mb-3">
                  I’m a <b>non-profit</b> organization crowdfunding for a
                  campaign or cause.
                </p>
                <div className="d-flex align-items-center mb-2">
                  <img
                    src="/images/icons/blueCheck.svg"
                    alt="check"
                    width="20px"
                    height="20px"
                    className="mr-3"
                  />
                  <p className="mb-0">Zero platform fees</p>
                </div>
                <div className="d-flex align-items-center mb-2">
                  <img
                    src="/images/icons/blueCheck.svg"
                    alt="check"
                    width="20px"
                    height="20px"
                    className="mr-3"
                  />
                  <p className="mb-0">Access to extra funding</p>
                </div>
                <div className="d-flex align-items-center mb-4">
                  <img
                    src="/images/icons/blueCheck.svg"
                    alt="check"
                    width="20px"
                    height="20px"
                    className="mr-3"
                  />
                  <p className="mb-0">Access to free support</p>
                </div>
                <button
                  className="btn mt-4"
                  onClick={() => handleSubmit("non-profit")}
                >
                  <p className="mb-0 text-white">Continue</p>
                </button>
              </div>

              <div className="p-4 box mt-4 mt-lg-0 bottomBox">
                <p className="text-blue mb-3">For-profit</p>
                <p className="mb-3">
                  I’m a <b>for-profit</b> organization crowdfunding for a
                  campaign or cause.
                </p>
                <div className="d-flex align-items-center mb-2">
                  <img
                    src="/images/icons/blueCheck.svg"
                    alt="check"
                    width="20px"
                    height="20px"
                    className="mr-3"
                  />
                  <p className="mb-0">Zero platform fees</p>
                </div>
                <div className="d-flex align-items-center mb-2">
                  <img
                    src="/images/icons/blueCheck.svg"
                    alt="check"
                    width="20px"
                    height="20px"
                    className="mr-3"
                  />
                  <p className="mb-0">Access to extra funding</p>
                </div>
                <div className="d-flex align-items-center mb-4">
                  <img
                    src="/images/icons/blueCheck.svg"
                    alt="check"
                    width="20px"
                    height="20px"
                    className="mr-3"
                  />
                  <p className="mb-0">Access to free support</p>
                </div>
                <button
                  className="btn mt-4"
                  onClick={() => handleSubmit("for-profit")}
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
      padding: 50px 50px 50px 50px;
    }

    section {
      box-shadow: -2px 4px 48px rgba(50, 50, 71, 0.05),
        2px 10px 24px rgba(50, 50, 71, 0.05);
      border-radius: 4px;
      width: 1100px;
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
        width: 30%;
        @media screen and (min-width: 768px) and (max-width: 1199px) {
          width: 46%;
        }
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
