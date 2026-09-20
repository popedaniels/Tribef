import React, { useEffect, useState } from "react";
import styled from "styled-components";

import { useRouter } from "next/router";
import Link from "next/link";
import Navbar from "../../components/Navbar/Navbar";
import { useSelector } from "react-redux";
import { selectStartCampaignState } from "../../../store/slices/startCampaignSlice";
import { logout, selectAuthStateState } from "../../../store/slices/authSlice";
import axios from "axios";
import { toast } from "../../../store/slices/ToastSlice";
import Layout from "../../components/Layout";
import LogoutModal from "../../components/composed/Modal/DefaultModal/LogoutModal";
import { useAppDispatch } from "./../../../store/hooks";
import {
  grabErrorMessage,
  grabErrorStatus,
} from "../../components/helperFunctions/helperFunctions";

type StartLayoutProps = {
  children: React.ReactNode;
  active?: number;
  page?: string;
  handle?: (() => void | Promise<void>) | null;
  errorBasic?: boolean;
  errorContent?: boolean;
  errorTeam?: boolean;
  errorFunding?: boolean;
};

export default function StartLayout({
  children,
  active = 1,
  page = "Campaign",
  handle = null,
  errorBasic = false,
  errorContent = false,
  errorTeam = false,
  errorFunding = false,
}: StartLayoutProps) {
  const router = useRouter();
  const { startCampaign } = useSelector(selectStartCampaignState);
  const { profile, authenticated } = useSelector(selectAuthStateState);
  const dispatch = useAppDispatch();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    !profile?.verified && router.push("/SignUp/Verify");
  }, [profile, router]);

  useEffect(() => {
    !authenticated && router.push("/SignUp");
  }, [authenticated, router]);

  const saveCampaign = async () => {
    try {
      const res = await axios.post(
        process.env.NEXT_PUBLIC_API_URL + "/api/startCampaign/saveCampaign",
        { saveCampaign: startCampaign, id: startCampaign?._id },
        { withCredentials: true }
      );

      res && dispatch(toast(true, "Campaign Saved to drafts!", "success"));
    } catch (error) {
      dispatch(toast(true, grabErrorMessage(error), "error"));
      if (grabErrorStatus(error) == 403) {
        dispatch(logout());
      }
    }
  };

  const getWidth = () => {
    switch (active) {
      case 1:
        return 5;
        break;
      case 2:
        return 25;
        break;
      case 3:
        return 47;
        break;
      case 4:
        return 68;
        break;
      case 5:
        return 92;
        break;
      case 6:
        return 100;
        break;

      default:
        return 0;
        break;
    }
  };

  return (
    <Layout title={page}>
      <Wrapper className="d-flex">
        <aside className="py-4">
          <div className="px-4 mb-4">
            <div className="border-bottom border-secondary d-flex justify-content-between align-items-center">
              <p className="mb-0">
                {startCampaign?.basicInformation?.campaignTitle}
              </p>
            </div>
          </div>
          <div className="d-flex flex-column mb-5">
            <Link href={`/StartACampaign/BasicInformation`} passHref>
              <a
                className={`navlink d-flex align-items-center pl-4 ${
                  active == 1 ? "active" : ""
                } ${errorBasic ? "bg-danger" : ""}`}
              >
                <h3 className="mb-0">1. Basic Information</h3>
              </a>
            </Link>
            <Link href={`/StartACampaign/Content`} passHref>
              <a
                className={`navlink d-flex align-items-center pl-4 ${
                  active == 2 ? "active" : ""
                } ${errorContent ? "bg-danger" : ""}`}
              >
                <h3 className="mb-0">2. Content</h3>
              </a>
            </Link>
            <Link href={`/StartACampaign/Team`} passHref>
              <a
                className={`navlink d-flex align-items-center pl-4 ${
                  active == 3 ? "active" : ""
                } ${errorTeam ? "bg-danger" : ""}`}
              >
                <h3 className="mb-0">3. Contact</h3>
              </a>
            </Link>
            <Link href={`/StartACampaign/Funding`} passHref>
              <a
                className={`navlink d-flex align-items-center pl-4 ${
                  active == 4 ? "active" : ""
                } ${errorFunding ? "bg-danger" : ""}`}
              >
                <h3 className="mb-0">4. Funding</h3>
              </a>
            </Link>
            <Link href={`/StartACampaign/Settings`} passHref>
              <a
                className={`navlink d-flex align-items-center pl-4 ${
                  active == 5 ? "active" : ""
                }`}
              >
                <h3 className="mb-0">5. Settings</h3>
              </a>
            </Link>
            <Link href={`/StartACampaign/Prelaunch`} passHref>
              <a
                className={`navlink d-flex align-items-center pl-4 ${
                  active == 6 ? "active" : ""
                }`}
              >
                <h3 className="mb-0">6. Pre-Launch page</h3>
              </a>
            </Link>
          </div>
          <Link href="/StartACampaign" passHref>
            <a>
              <div className="d-flex align-items-center mb-4 px-3">
                <img
                  src="/images/icons/add.svg"
                  width="20px"
                  height="20px"
                  alt="addicon"
                  style={{ opacity: 0.3 }}
                />
                <p className="mb-0 ml-3">Add another campaign</p>
              </div>
            </a>
          </Link>
          <Link href="/help" passHref>
            <a>
              <div className="d-flex align-items-center px-3">
                <img
                  src="/images/icons/questionmark.svg"
                  width="20px"
                  height="20px"
                  alt="questionicon"
                  style={{ opacity: 0.3 }}
                />
                <p className="mb-0 ml-3">Need some help?</p>
              </div>
            </a>
          </Link>
        </aside>
        <main>
          <div
            className="bg-white"
            style={{ boxShadow: "0px 3px 2px 0px rgba(0,0,0,0.06)" }}
          >
            <nav
              className="custom d-none d-md-flex mx-auto"
              style={{ maxWidth: 1140 }}
            >
              <div className="d-flex align-items-center">
                <Link href="/search" passHref>
                  <a
                    style={{ textDecoration: "none", color: "#212529" }}
                    className="mr-5"
                  >
                    <div className="d-flex align-items-center justify-content-center">
                      <img
                        src="/images/icons/search.svg"
                        width={20}
                        height={20}
                       alt="Search" />
                      <p className="ml-2 mb-0">Search</p>
                    </div>
                  </a>
                </Link>
                <div className="d-flex align-items-center">
                  <div
                    className="d-flex align-items-center justify-content-center explore"
                    style={{ cursor: "pointer" }}
                  >
                    <p className="mr-2 mb-0">Explore</p>
                    <img
                      src="/images/icons/dropdown.svg"
                      width={13}
                      height={8}
                     alt="" />
                    <div className="exploreDropdown">
                      <ul>
                        <li>
                          <p className="text-blue">Categories</p>
                        </li>
                        <Link href="/category/medical" passHref>
                          <li>Medical</li>
                        </Link>
                        <Link href="/category/emergency" passHref>
                          <li>Emergency</li>
                        </Link>
                        <Link href="/category/nonprofit" passHref>
                          <li>Non-Profit</li>
                        </Link>
                        <Link href="/category/monthlybills" passHref>
                          <li>Monthly Bills</li>
                        </Link>
                      </ul>
                      <Link href="/Categories" passHref>
                        <p
                          className="text-blue text-center w-full mb-0"
                          style={{ padding: "19px 0 19px 0" }}
                        >
                          See all
                        </p>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
              <Link href="/" passHref>
                <a>
                  <img
                    src="/images/logo.png"
                    alt="fundandtraceLogo"
                    width={76}
                    height={58}
                    className="my-5"
                  />
                </a>
              </Link>
              <div className="d-flex align-items-center">
                <div
                  className="d-flex align-items-center justify-content-center account"
                  style={{ cursor: "pointer" }}
                >
                  {profile?.profilePicture ? (
                    <img
                      src={profile?.profilePicture}
                      width={40}
                      style={{ borderRadius: "50%", objectFit: "cover" }}
                      height={40}
                     alt="Profile picture" />
                  ) : (
                    authenticated && (
                      <div
                        className="d-flex align-items-center justify-content-center"
                        style={{
                          width: 40,
                          height: 40,
                          background: "#F0F0F0",
                          borderRadius: "50%",
                          color: "#A3A3A3",
                          fontSize: 12,
                        }}
                      >
                        {`${profile?.firstName?.charAt(
                          0
                        )} ${profile?.lastName?.charAt(0)}`}
                      </div>
                    )
                  )}
                  <p className="ml-3 mb-0 mr-3">{`${profile?.firstName} ${profile?.lastName}`}</p>

                  <img
                    src="/images/icons/dropdown.svg"
                    width={13}
                    height={8}
                    className="pt-0"
                   alt="" />
                  <div className="accountDropdown">
                    <ul>
                      <Link href="/dashboard" passHref>
                        <li>My Campaigns</li>
                      </Link>
                      <Link href="/dashboard/account" passHref>
                        <li>My Account</li>
                      </Link>
                      <Link href="/dashboard/my-contributions" passHref>
                        <li>My Contributions</li>
                      </Link>
                      <Link href="/dashboard/settings" passHref>
                        <li>Settings</li>
                      </Link>
                      <li onClick={() => setShowModal(true)} role="button">
                        Log Out
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </nav>
          </div>
          <div
            className="bg-white"
            style={{ position: "sticky", top: 0, zIndex: 1000 }}
          >
            <nav
              className="custom mx-auto"
              style={{ background: "white", maxWidth: 1140 }}
            >
              <p className="text-blue mb-0">
                {startCampaign?.basicInformation?.campaignTitle} / {page}
              </p>
              {active != 6 ? (
                <div className="d-flex align-items-center">
                  <button
                    className="btn text-white"
                    onClick={handle ? handle : saveCampaign}
                  >
                    {active != 5 ? "Save campaign" : "Review & Launch!"}
                  </button>
                </div>
              ) : null}
            </nav>
          </div>
          <div className="d-flex flex-column d-md-none">
            <div className="position-relative" style={{ height: "100%" }}>
              <Navbar />
            </div>
            <div
              className="d-flex align-items-center justify-content-between bg-white mb-4"
              style={{
                height: 80,
                width: "100%",
                padding: "0 15px",
                marginTop: "72px",
              }}
            >
              <button
                className="btn text-white ml-auto"
                style={{ padding: active != 6 ? "12px 15px" : undefined }}
                onClick={handle ? handle : saveCampaign}
              >
                {active == 5
                  ? "Review & Launch"
                  : active == 6
                  ? "Launch"
                  : "Save campaign"}
              </button>
            </div>
          </div>
          <div className="mt-4 mobile" style={{ padding: "0 15px" }}>
            <div className="progress mb-3">
              <Progress
                width={getWidth()}
                className="progress-bar "
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
              ></Progress>
            </div>
            <div
              className="d-flex justify-content-between w-100 align-items-center progressHolder"
              style={{ marginTop: "-23px" }}
            >
              <Link href="BasicInformation" passHref>
                <a>
                  <div className="mobileProgress">
                    <div
                      className="smallCircle"
                      style={{
                        background: active >= 1 ? "var(--color-primary)" : "#D7D7D9",
                      }}
                    ></div>
                    <p
                      className=""
                      style={{ color: active >= 1 ? "var(--color-primary)" : "#979797" }}
                    >
                      1.
                    </p>
                    <p
                      className=""
                      style={{
                        color: errorBasic
                          ? "red"
                          : active >= 1
                          ? "var(--color-primary)"
                          : "#979797",
                      }}
                    >
                      Basic
                    </p>
                  </div>
                </a>
              </Link>
              <Link href="Content" passHref>
                <a>
                  <div className="mobileProgress">
                    <div
                      className="smallCircle"
                      style={{
                        background: active >= 2 ? "var(--color-primary)" : "#D7D7D9",
                      }}
                    ></div>
                    <p
                      className=""
                      style={{ color: active >= 2 ? "var(--color-primary)" : "#979797" }}
                    >
                      2.
                    </p>
                    <p
                      className=""
                      style={{
                        color: errorContent
                          ? "red"
                          : active >= 2
                          ? "var(--color-primary)"
                          : "#979797",
                      }}
                    >
                      Content
                    </p>
                  </div>
                </a>
              </Link>
              <Link href="Team" passHref>
                <a>
                  <div className="mobileProgress">
                    <div
                      className="smallCircle"
                      style={{
                        background: active >= 3 ? "var(--color-primary)" : "#D7D7D9",
                      }}
                    ></div>
                    <p style={{ color: active >= 3 ? "var(--color-primary)" : "#979797" }}>
                      3.
                    </p>
                    <p
                      style={{
                        color: errorTeam
                          ? "red"
                          : active >= 3
                          ? "var(--color-primary)"
                          : "#979797",
                      }}
                    >
                      Team
                    </p>
                  </div>
                </a>
              </Link>
              <Link href="Funding" passHref>
                <a>
                  <div className="mobileProgress">
                    <div
                      className="smallCircle"
                      style={{
                        background: active >= 4 ? "var(--color-primary)" : "#D7D7D9",
                      }}
                    ></div>
                    <p style={{ color: active >= 4 ? "var(--color-primary)" : "#979797" }}>
                      4.
                    </p>
                    <p
                      style={{
                        color: errorFunding
                          ? "red"
                          : active >= 4
                          ? "var(--color-primary)"
                          : "#979797",
                      }}
                    >
                      Funding
                    </p>
                  </div>
                </a>
              </Link>
              <Link href="Settings" passHref>
                <a>
                  <div className="mobileProgress">
                    <div
                      className="smallCircle"
                      style={{
                        background: active >= 5 ? "var(--color-primary)" : "#D7D7D9",
                      }}
                    ></div>
                    <p style={{ color: active >= 5 ? "var(--color-primary)" : "#979797" }}>
                      5.
                    </p>
                    <p style={{ color: active >= 5 ? "var(--color-primary)" : "#979797" }}>
                      Settings
                    </p>
                  </div>
                </a>
              </Link>
            </div>
          </div>
          {active == 6 ? (
            <section className="mt-20 mx-auto" style={{ maxWidth: 1140 }}>
              <div className="my-4 d-block d-md-none">
                <p className="text-blue text-center">
                  {startCampaign?.basicInformation?.campaignTitle} / {page}
                </p>
              </div>
              {children}
            </section>
          ) : (
            <article
              className="mt-20 custom mx-auto"
              style={{ maxWidth: 1140 }}
            >
              <div className="my-4 d-block d-md-none">
                <p className="text-blue text-center">
                  {startCampaign?.basicInformation?.campaignTitle} / {page}
                </p>
              </div>
              {children}
            </article>
          )}
        </main>
        {showModal && (
          <LogoutModal
            onModalClose={() => setShowModal(false)}
            showModal={showModal}
          />
        )}
      </Wrapper>
    </Layout>
  );
}

const Wrapper = styled.div`
  min-height: 100vh;
  background: #f9f9f9;
  aside {
    @media screen and (max-width: 1023px) {
      display: none
    }
    position: -webkit-sticky;
    position: sticky;
    top: 0;
    left: 0;

    min-width: 300px;
    max-width: 300px;
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    
    overflow-y: scroll;
    background: black;
    ::-webkit-scrollbar {
      height: 4px;
      width: 4px;
      background: whitesmoke;
    }
    ::-webkit-scrollbar-thumb:vertical {
      background: var(--color-primary);
      border-radius: 4px;
    }
    
    p {
    
      font-style: normal;
      font-weight: 400;
      font-size: 16px;
      line-height: 24px;
      /* identical to box height, or 150% */

      color: #ffffff;

      opacity: 0.5;
    }
    a{
      text-decoration: none;
    }
    .navlink {
      background-color: #1c1c1c;
      width: 100%;
      height: 64px;
      text-decoration: none !important
      &:hover{
        text-decoration: none !important
      }
      h3 {
      
        font-style: normal;
        font-weight: 400;
        font-size: 16px;
        line-height: 24px;
        /* identical to box height, or 150% */
        text-decoration: none !important
      &:hover{
        text-decoration: none !important
      }

        color: #ffffff;

        opacity: 0.5;
      }
    }
    .active {
      border-right: 10px solid var(--color-primary);
      background-color: rgba(255, 255, 255, 0.16) !important;
      &:hover{
        text-decoration: none !important
      }
      h3 {
      
        font-style: normal;
        font-weight: bold;
        font-size: 16px;
        line-height: 24px;
        /* identical to box height, or 150% */
        &:hover{
          text-decoration: none !important
        }
        color: #ffffff;
        opacity: 1;
      }
    }
  }
  main {
    width: calc(100% - 300px);
    @media screen and (max-width: 1023px) {
      width: 100%
    }
    .custom {
      padding-left: 50px;
      padding-right: 50px;
      @media screen and (max-width: 767px)  {
        padding-left: 15px;
      padding-right: 15px;
      }
    }
    button {
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      padding: 12px 30px;
      background: var(--color-primary);
      box-shadow: 0px 2px 4px rgba(50, 50, 71, 0.06),
        0px 2px 2px rgba(50, 50, 71, 0.06);
      border-radius: 4px;
    
      font-style: normal;
      font-weight: normal;
      font-size: 16px;
      line-height: 24px;
      /* identical to box height, or 150% */

      color: #ffffff;
      &:hover{
        box-shadow: 0px 12px 12px rgba(50, 50, 71, 0.08), 0px 16px 24px rgba(50, 50, 71, 0.08);
      }
    }
    .mobileBtn-full{
      @media screen and (max-width: 767px) {
        width: 100% !important
      }
    }
    nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 80px;
      background: white;
      @media screen and (max-width: 767px) {
        display: none
      }
      .exploreDropdown {
        position: absolute;
        width: 250px;
        display: none;

        left:0;
        z-index: 100000;
        border-radius: 4px;
        background-color: white;
        box-shadow: 2px 2px 6px rgba(50, 50, 71, 0.06), 2px 2px 6px rgba(50, 50, 71, 0.06);
    
        ul {
            display: block;
            border-bottom: 1px solid #D7D7D9;
            width: 100%;
            list-style: none;
            padding: 25px 30px 0px 30px;
            margin: 0;
    
            li {
                margin-bottom: 20px;
                cursor: pointer;
              
                font-style: normal;
                font-weight: normal;
                font-size: 16px;
                line-height: 24px;
                /* identical to box height, or 150% */
    
    
                color: #514949;
    
                opacity: 0.9;
            }
        }
      }
    
      .explore {
        position: relative;
        display: inline-block;
      }
    
      .explore:hover .exploreDropdown {
        top: 100%;
        position: absolute;
        display: block;
      }
    
      .howDropdown {
        width: 260px;
        display: none;
        z-index: 100;
        left:0;
        position: absolute;
        background-color: white;
        border-radius: 4px;
        box-shadow: 0px 2px 4px rgba(50, 50, 71, 0.06), 0px 2px 2px rgba(50, 50, 71, 0.06);
    
        ul {
            display: block;
    
            width: 100%;
            list-style: none;
            padding: 25px 30px 0px 30px;
            margin: 0;
    
            li {
                margin-bottom: 30px;
                cursor: pointer;
              
                font-style: normal;
                font-weight: normal;
                font-size: 16px;
                line-height: 24px;
                /* identical to box height, or 150% */
    
    
                color: #514949;
    
                opacity: 0.9;
            }
        }
      }
    
      .how {
        position: relative;
        display: inline-block;
      }
    
      .how:hover .howDropdown {
        top: 100%;
        display: block;
      }
      .accountDropdown {
        width: 260px;
        display: none;
        z-index: 100000;
        position: absolute;
        right:0;
        background-color: white;
        border-radius: 4px;
        box-shadow: 0px 2px 4px rgba(50, 50, 71, 0.06), 0px 2px 2px rgba(50, 50, 71, 0.06);
    
        ul {
            display: block;
    
            width: 100%;
            list-style: none;
            padding: 25px 30px 0px 30px;
            margin: 0;
    
            li {
                margin-bottom: 20px;
                cursor: pointer;
              
                font-style: normal;
                font-weight: normal;
                font-size: 16px;
                line-height: 24px;
                /* identical to box height, or 150% */
    
    
                color: #514949;
    
                opacity: 0.9;
            }
        }
      }
  
      .account {
        position: relative;
        display: inline-block;
      }
  
      .account:hover .accountDropdown {
        top: 100%;
        display: block;
        }
    }

    .mobile{
      display: none;
      @media screen and (max-width: 1023px) {
        display: block
      }
    }


    .progressHolder{
      a{
        text-decoration: none !important
      }
    }

    .progress {
      height: 5px !important;
      background-color:#D7D7D9 !important;
    }
    .progressbar {
      background-color: var(--color-primary) !important;
    }
    
    .mobileProgress{
      display: flex;
      flex-direction: column;
      align-items:center;
      justify-content: center;
      .smallCircle{
        width: 10px;
        height: 10px;
        margin-bottom: 10px;
        border-radius: 50%
      }
    }

    article {
      width: 100%;
      padding-right: 18% !important;
      @media screen and (max-width: 1100px) {
        width: 100%
      }
      @media screen and (max-width: 767px) {
        padding-right: 15px !important
      }
      padding-top: 40px;
      padding-bottom: 120px;
      input[type="text"],
      input[type="email"],
      input[type="date"],
      input[type="number"],
      input[type="phone"] {
        background: white;
        border: none;
        box-shadow: 0 4px 10px -10px rgba(255, 255, 255, 0.1), 0 4px 10px 0px rgba(0, 0, 0, 0.04), 0 7px 8px -5px rgba(255, 255, 255, 0.2);
        box-sizing: border-box;
        border-radius: 4px;
        width: 100%;
        height: 50px;
        padding: 5px 15px;
      }
      p {
      
        font-style: normal;
        font-weight: 400;
        font-size: 16px;
        line-height: 24px;
        /* or 150% */

        color: #514949;

        opacity: 0.9;
      }
      .launchBtn-big{
        @media screen and (max-width: 767px) {
          display : none
        }
      }
      
      input[type='checkbox'],
  input[type='radio'] {
    --active: #275EFE;
    --active-inner: #fff;
    --focus: 2px var(--color-primary);
    --border: #BBC1E1;
    --border-hover: #275EFE;
    --background: #fff;
    --disabled: #F6F8FF;
    --disabled-inner: #E1E6F9;
    -webkit-appearance: none;
    -moz-appearance: none;
    height: 21px;
    outline: none;
    display: inline-block;
    vertical-align: top;
    position: relative;
    margin: 0;
    cursor: pointer;
    border: 1px solid var(--bc, var(--border));
    background: white;
    transition: background .3s, border-color .3s, box-shadow .2s;
    &:after {
      content: '';
      display: block;
      left: 0;
      top: 0;
      position: absolute;
      transition: transform var(--d-t, .3s) var(--d-t-e, ease), opacity var(--d-o, .2s);
    }
    &:checked {
      --b: white;
      --bc: white;
      --d-o: .3s;
      --d-t: .6s;
      --d-t-e: cubic-bezier(.2, .85, .32, 1.2);
      box-shadow: 0 0 0 var(--focus);
    }
    &:disabled {
      --b: var(--disabled);
      cursor: not-allowed;
      opacity: .9;
      &:checked {
        --b: var(--disabled-inner);
        --bc: var(--border);
      }
      & + label {
        cursor: not-allowed;
      }
    }
    &:hover {
      &:not(:checked) {
        &:not(:disabled) {
          --bc: var(--border-hover);
        }
      }
    }
    &:focus {
      box-shadow: 0 0 0 var(--focus);
    }
    &:not(.switch) {
      min-width: 21px;
      &:after {
        opacity: var(--o, 0);
      }
      &:checked {
        --o: 1;
      }
    }
    & + label {
      font-size: 14px;
    
        font-style: normal;
        font-weight: 400;
        font-size: 16px;
        line-height: 24px;
        /* or 150% */

        color: #514949;

        opacity: 0.9;
     
      display: inline-block;
      vertical-align: top;
      cursor: pointer;
      margin-left: 15px;
      margin-top: -2px
    }
  }
  
  
  input[type='radio'] {
    border-radius: 50%;
    
    &:after {
      width: 19px;
      height: 19px;
      border-radius: 50%;
      background: var(--color-primary);
      opacity: 0;
      transform: scale(var(--s, .7));
    }
    &:checked {
      --s: .5;
      background: var(--color-primary);
      border: 3px solid white
    }
  }
}

      textarea {
        width: 100%;
        height: 348px;
        background: white;
        border: none;
        box-shadow: 0 4px 10px -10px rgba(255, 255, 255, 0.1), 0 4px 10px 0px rgba(0, 0, 0, 0.04), 0 7px 8px -5px rgba(255, 255, 255, 0.2);
        box-sizing: border-box;
        border-radius: 4px;
        padding: 5px 15px;
      }
      .file {
        width: 400px;
        @media screen and (max-width: 767px) {
          width: 100%
        }
        height: 200px;
        background: white;
        border: none;
        box-shadow: 0 4px 10px -10px rgba(255, 255, 255, 0.1), 0 4px 10px 0px rgba(0, 0, 0, 0.04), 0 7px 8px -5px rgba(255, 255, 255, 0.2);
        box-sizing: border-box;
        border-radius: 4px;
        input {
          background: transparent !important;
          border-style: none;
          box-shadow: 0 4px 10px -10px rgba(255, 255, 255, 0.1), 0 4px 10px 0px rgba(0, 0, 0, 0.04), 0 7px 8px -5px rgba(255, 255, 255, 0.2);
          width: max-content;
        }
      }
      
      .currency-drop {
        list-style: none;
        background: white;
        padding: 0;
        min-width: 100%;
        li {
          background: white;
          padding: 10px 5px 10px 5px;
          &:hover {
            background: #fafafa;
          }
        }
      }
      height: auto;
      .progress {
        height: 5px !important;
        background-color:#697af821 ;
      }
      section{
        p{
        
            font-style: normal;
            font-weight: 400;
            font-size: 16px;
            line-height: 24px;
            /* or 150% */


            color: #514949;

            opacity: 0.9;
        }
      }
    
      .progressbar {
        background-color: var(--color-primary)!important;
      }
    }
  }
`;

const Progress = styled.div<{ width: number }>`
  width: ${(props) => props.width}%;
  @media screen and (min-width: 768px) and (max-width: 1023px) {
    width: ${(props) => {
      return props.width == 68
        ? props.width + 3.3
        : props.width == 5
        ? props.width - 2
        : props.width == 92
        ? props.width + 4
        : props.width + 1.8;
    }}%;
  }
`;
