import React, { useState } from "react";
import styled from "styled-components";
import { useRouter } from "next/router";
import Link from "next/link";
import MobileDashboard from "../../../components/composed/MobileDashboard/MobileDashboard";
import { useRef } from "react";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { selectAuthStateState } from "../../../../store/slices/authSlice";
import Layout from "../../../components/Layout";

interface CampaignDashboardLayoutProps {
  children: React.ReactNode;
  active?: number;
  hideMobileNav?: boolean;
  title?: string;
  campaignId: string | string[] | undefined;
  page?: string;
}

export default function CampaignDashboardLayout({
  children,
  active = 0,
  hideMobileNav = false,
  title = "Campaign",
  campaignId,
  page = "Campaign",
}: CampaignDashboardLayoutProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const ref = useRef(null);
  const [showFixed, setShowFixed] = useState(false);
  const { profile, authenticated } = useSelector(selectAuthStateState);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    !authenticated && router.push("/SignUp/SignIn");
  }, [authenticated, router]);

  useEffect(() => {
    window.onscroll = function () {
      window.pageYOffset > 300 ? setShowFixed(true) : setShowFixed(false);
    };
  });

  const fixed: React.CSSProperties = {
    background: "white",
    position: "sticky",
    top: 0,
    left: 0,
    width: "100%",
    paddingTop: "10px",
    paddingBottom: "10px",
    transition: "all 0.5s ease",
    zIndex: 100000,
    boxShadow: "0px 3px 2px 0px rgba(0,0,0,0.06)",
  };

  return (
    <Layout
      title={`${title} | ${page}`}
      description="Fund&Trace campaign dashboard"
    >
      <Wrapper className="d-flex">
        <aside>
          <div className="px-4 mb-4 mt-5">
            <div className="py-3 border-bottom border-secondary d-flex justify-content-between align-items-center">
              <p className="mb-0">{title}</p>
            </div>
          </div>
          <div className="d-flex flex-column mb-5">
            <Link href={`/dashboard/${campaignId}`} passHref>
              <a
                className={`navlink d-flex align-items-center pl-4 ${
                  active == 1 ? "active" : ""
                }`}
              >
                {active == 1 ? (
                  <img
                    src="/images/icons/dashboard.svg"
                    width="20px"
                    height="20px"
                    alt="dashboardIcons"
                  />
                ) : (
                  <img
                    src="/images/icons/dashboardInactive.svg"
                    width="20px"
                    height="20px"
                    alt="dashboardIcons"
                  />
                )}
                <h3 className="mb-0 ml-4">Dashboard</h3>
              </a>
            </Link>
            <Link href={`/dashboard/${campaignId}/sendEmail`} passHref>
              <a
                className={`navlink d-flex align-items-center pl-4 ${
                  active == 2 ? "active" : ""
                }`}
              >
                {active == 2 ? (
                  <img
                    src="/images/icons/sendMailActive.svg"
                    width="20px"
                    height="20px"
                    alt="dashboardIcons"
                  />
                ) : (
                  <img
                    src="/images/icons/mail.svg"
                    width="20px"
                    height="20px"
                    alt="dashboardIcons"
                  />
                )}
                <h3 className="mb-0 ml-4">Send Email</h3>
              </a>
            </Link>
            <Link href={`/dashboard/${campaignId}/socials`} passHref>
              <a
                className={`navlink d-flex align-items-center pl-4 ${
                  active == 3 ? "active" : ""
                }`}
              >
                {active == 3 ? (
                  <img
                    src="/images/icons/socialActive.svg"
                    width="20px"
                    height="20px"
                    alt="dashboardIcons"
                  />
                ) : (
                  <img
                    src="/images/icons/dshare.svg"
                    width="20px"
                    height="20px"
                    alt="dashboardIcons"
                  />
                )}
                <h3 className="mb-0 ml-4">Socials</h3>
              </a>
            </Link>
            <Link href={`/dashboard/${campaignId}/fundingRequest`} passHref>
              <a
                className={`navlink d-flex align-items-center pl-4 ${
                  active == 4 ? "active" : ""
                }`}
              >
                {active == 4 ? (
                  <img
                    src="/images/icons/fundingRequestActive.svg"
                    width="20px"
                    height="20px"
                    alt="dashboardIcons"
                  />
                ) : (
                  <img
                    src="/images/icons/fundingRequest.svg"
                    width="20px"
                    height="20px"
                    alt="dashboardIcons"
                  />
                )}
                <h3 className="mb-0 ml-4">Funding Request</h3>
              </a>
            </Link>
          </div>
          <Link href="/StartACampaign" passHref>
            <a>
              <div className="d-flex align-items-center mb-5 px-3">
                <img
                  src="/images/icons/add.svg"
                  width="20px"
                  height="20px"
                  alt="dashboardIcons"
                  style={{ opacity: 0.3 }}
                />
                <p className="mb-0 ml-3">Add another campaign</p>
              </div>
            </a>
          </Link>
          <Link href="/help" passHref>
            <a>
              <div className="d-flex align-items-center mb-5 px-3">
                <img
                  src="/images/icons/questionmark.svg"
                  width="20px"
                  height="20px"
                  alt="dashboardIcons"
                  style={{ opacity: 0.3 }}
                />
                <p className="mb-0 ml-3">Need some help?</p>
              </div>
            </a>
          </Link>
        </aside>
        <main>
          <div
            ref={ref}
            className={`mobileNav ${
              hideMobileNav ? "d-none" : "d-flex"
            } align-items-center justify-content-between py-3 custom-container d-lg-none`}
            style={showFixed ? fixed : { transition: "all 0.5s ease" }}
          >
            <div onClick={() => setShowMenu(true)} role="button">
              <img
                src="/images/icons/mobileMenu.svg"
                width="18px"
                height="16px"
                alt="dashboardIcons"
              />
            </div>
            <Link href="/" passHref>
              <a
                onClick={showModal ? () => setShowModal(false) : undefined}
                role="button"
              >
                <img src="/images/logo.png" width={63} height={48}  alt="Fund&Trace" />
              </a>
            </Link>
            <Link href="/search" passHref>
              <img
                src="/images/icons/search.svg"
                width={20}
                height={20}
               alt="Search" />
            </Link>
          </div>
          <div
            className="bg-white"
            style={{ boxShadow: "0px 3px 2px 0px rgba(0,0,0,0.06)" }}
          >
            <nav
              className="custom d-none d-lg-flex mx-auto"
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
                    width={82}
                    height={62}
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
          {children}
        </main>

        {showMenu && (
          <MobileDashboard
            onClose={() => setShowMenu(false)}
            campaignId={campaignId}
            title={title}
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
    
    overflow-y: auto;
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
    a{
      cursor: pointer;
      text-decoration: none !important
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
    width: 100%;
    .custom {
      padding-left: 50px;
      padding-right: 50px;
      @media screen and (min-width: 1024px) and (max-width: 1100px) {
        padding-left: 25px;
        padding-right: 25px;
      }
      @media screen and (max-width: 767px) {
        padding-left: 15px;
        padding-right: 15px;
      }
    }
    button {
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      padding: 15px 30px;
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
    nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 80px;
      background: white;
      .exploreDropdown {
        position: absolute;
        width: 250px;
        display: none;
        left:0;
        z-index: 100;
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
        z-index: 100;
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
  
      .account {
        position: relative;
        display: inline-block;
      }
  
      .account:hover .accountDropdown {
        top: 100%;
        
        display: block;
        }
    }

    article {
      padding-top: 40px;
      padding-bottom: 120px;
      input[type="text"],
      input[type="number"],
      input[type="date"],
      input[type="phone"] {
        background: white;
        border: none;
        box-shadow: 0 4px 10px -10px rgba(255, 255, 255, 0.1), 0 4px 10px 0px rgba(0, 0, 0, 0.04), 0 7px 8px -5px rgba(255, 255, 255, 0.2);
        box-sizing: border-box;
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
    height: 24px;
    width: 24px;
    outline: none;
    display: inline-block;
    vertical-align: top;
    position: relative;
    margin: 0;
    margin-right: 15px;
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
      width: 24px;
      height: 24px;
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
        box-sizing: border-box;
        border-radius: 4px;
        padding: 5px 15px;
      }
      .file {
       max-width: 400px;
        width: 100%;
        height: 200px;
        background: white;
        border: none;
        box-shadow: 0 4px 10px -10px rgba(255, 255, 255, 0.1), 0 4px 10px 0px rgba(0, 0, 0, 0.04), 0 7px 8px -5px rgba(255, 255, 255, 0.2);
        box-sizing: border-box;
        box-sizing: border-box;
        border-radius: 4px;
        input {
          background: transparent !important;
          border-style: none;
          box-shadow: 0 4px 10px -10px rgba(255, 255, 255, 0.1), 0 4px 10px 0px rgba(0, 0, 0, 0.04), 0 7px 8px -5px rgba(255, 255, 255, 0.2);
        box-sizing: border-box;
          width: 100px;
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
        background-color:#697af821 !important;
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
