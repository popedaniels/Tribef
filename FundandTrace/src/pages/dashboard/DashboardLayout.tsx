import React, { useState } from "react";
import styled from "styled-components";
import { useRouter } from "next/router";
import Link from "next/link";
import { useRef } from "react";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { selectAuthStateState } from "../../../store/slices/authSlice";
import LogoutModal from "../../components/composed/Modal/DefaultModal/LogoutModal";
import MobileCampaignMenu from "../../components/composed/mobileCampaignMenu/MobileCampaignMenu";
import Layout from "../../components/Layout";

interface DashboardLayoutProps {
  children: React.ReactNode;
  active?: number;
  hideMobileNav?: boolean;
  page?: string;
}

export default function DashboardLayout({
  children,
  active = 0,
  hideMobileNav = false,
  page = "Dashboard",
}: DashboardLayoutProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const ref = useRef(null);
  const [showFixed, setShowFixed] = useState(false);
  const { profile, authenticated } = useSelector(selectAuthStateState);

  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    !authenticated && router.push("/");
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
  };

  return (
    <Layout url="https://fundandtrace.com" ogImage="/og-image.jpg" title={`Dashboard | ${page}`} description="Fund&Trace Dashboard">
      <Wrapper className="d-flex">
        <aside>
          <div className="px-4 mb-4 mt-5">
            <div className="py-3 border-bottom border-secondary d-flex justify-content-between align-items-center">
              <p className="mb-0">{`${profile?.firstName} ${profile?.lastName}`}</p>
            </div>
          </div>
          <div className="d-flex flex-column mb-5">
            <Link href={`/dashboard`} passHref>
              <a
                className={`navlink d-flex align-items-center pl-4 ${
                  active == 1 ? "active" : ""
                }`}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5 3V19H21V21H3V3H5ZM19.94 5.94L22.06 8.06L16 14.122L13 11.122L9.06 15.062L6.94 12.94L13 6.88L16 9.88L19.94 5.94Z"
                    fill={active == 1 ? "white" : "gray"}
                  />
                </svg>

                <h3 className="mb-0 ml-4">My Campaigns</h3>
              </a>
            </Link>
            <Link href={`/dashboard/my-contributions`} passHref>
              <a
                className={`navlink d-flex align-items-center pl-4 ${
                  active == 2 ? "active" : ""
                }`}
              >
                <svg
                  width="23"
                  height="19"
                  viewBox="0 0 23 19"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4 6.99996C4.26522 6.99996 4.51957 7.10531 4.70711 7.29285C4.89464 7.48039 5 7.73474 5 7.99996C6.57114 7.99764 8.09698 8.52622 9.33 9.49996H11.5C12.832 9.49996 14.03 10.079 14.853 10.999L18 11C18.9453 10.9997 19.8712 11.2674 20.6705 11.772C21.4698 12.2766 22.1097 12.9975 22.516 13.851C20.151 16.972 16.322 19 12 19C9.21 19 6.85 18.397 4.94 17.342C4.87004 17.535 4.74224 17.7018 4.57402 17.8196C4.40579 17.9373 4.20534 18.0003 4 18H1C0.734784 18 0.48043 17.8946 0.292893 17.7071C0.105357 17.5195 0 17.2652 0 17V7.99996C0 7.73474 0.105357 7.48039 0.292893 7.29285C0.48043 7.10531 0.734784 6.99996 1 6.99996H4ZM5.001 9.99996L5 15.021L5.045 15.054C6.84 16.314 9.178 17 12 17C15.004 17 17.799 15.844 19.835 13.87L19.968 13.737L19.848 13.637C19.3758 13.2671 18.8034 13.0476 18.205 13.007L18 13L15.888 12.999C15.961 13.321 16 13.656 16 14V15H7V13L13.79 12.999L13.756 12.921C13.5644 12.5205 13.2696 12.1783 12.9019 11.9294C12.5343 11.6806 12.107 11.5341 11.664 11.505L11.5 11.5H8.57C8.10531 11.0247 7.55027 10.6471 6.93752 10.3895C6.32477 10.1319 5.66669 9.99948 5.002 9.99996H5.001ZM3 8.99996H2V16H3V8.99996ZM12.646 1.57496L13 1.92996L13.354 1.57596C13.5858 1.34217 13.8615 1.15648 14.1653 1.02954C14.469 0.902593 14.7949 0.836898 15.1241 0.836224C15.4533 0.83555 15.7795 0.89991 16.0837 1.02561C16.388 1.15131 16.6645 1.33587 16.8973 1.5687C17.13 1.80153 17.3145 2.07805 17.4401 2.38237C17.5657 2.68669 17.63 3.01282 17.6292 3.34204C17.6285 3.67127 17.5627 3.9971 17.4356 4.30083C17.3086 4.60456 17.1228 4.88021 16.889 5.11196L13 8.99996L9.11 5.10996C8.87622 4.87815 8.69053 4.60244 8.56358 4.29868C8.43664 3.99491 8.37094 3.66906 8.37027 3.33983C8.36959 3.01061 8.43396 2.68449 8.55965 2.38021C8.68535 2.07592 8.86992 1.79946 9.10275 1.5667C9.33558 1.33394 9.61209 1.14945 9.91641 1.02384C10.2207 0.898224 10.5469 0.833956 10.8761 0.834724C11.2053 0.835491 11.5311 0.901278 11.8349 1.02831C12.1386 1.15534 12.4143 1.34111 12.646 1.57496ZM10.526 2.98996C10.4431 3.07238 10.3917 3.18123 10.3808 3.2976C10.3698 3.41397 10.4 3.53051 10.466 3.62696L10.524 3.69596L13 6.16996L15.476 3.69596C15.5588 3.61322 15.61 3.50405 15.6206 3.38746C15.6312 3.27088 15.6006 3.15427 15.534 3.05796L15.476 2.98796C15.3931 2.90528 15.2839 2.85429 15.1673 2.84388C15.0507 2.83346 14.9342 2.86428 14.838 2.93096L14.768 2.98896L12.999 4.75696L11.232 2.98696L11.164 2.93096C11.0677 2.8644 10.9511 2.83376 10.8345 2.84436C10.7179 2.85496 10.6087 2.90613 10.526 2.98896V2.98996Z"
                    fill={active == 2 ? "white" : "gray"}
                  />
                </svg>

                <h3 className="mb-0 ml-4">My Contributions</h3>
              </a>
            </Link>
            <Link href={`/dashboard/account`} passHref>
              <a
                className={`navlink d-flex align-items-center pl-4 ${
                  active == 3 ? "active" : ""
                }`}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M20 22H18V20C18 19.2044 17.6839 18.4413 17.1213 17.8787C16.5587 17.3161 15.7956 17 15 17H9C8.20435 17 7.44129 17.3161 6.87868 17.8787C6.31607 18.4413 6 19.2044 6 20V22H4V20C4 18.6739 4.52678 17.4021 5.46447 16.4645C6.40215 15.5268 7.67392 15 9 15H15C16.3261 15 17.5979 15.5268 18.5355 16.4645C19.4732 17.4021 20 18.6739 20 20V22ZM12 13C11.2121 13 10.4319 12.8448 9.7039 12.5433C8.97595 12.2417 8.31451 11.7998 7.75736 11.2426C7.20021 10.6855 6.75825 10.0241 6.45672 9.2961C6.15519 8.56815 6 7.78793 6 7C6 6.21207 6.15519 5.43185 6.45672 4.7039C6.75825 3.97595 7.20021 3.31451 7.75736 2.75736C8.31451 2.20021 8.97595 1.75825 9.7039 1.45672C10.4319 1.15519 11.2121 1 12 1C13.5913 1 15.1174 1.63214 16.2426 2.75736C17.3679 3.88258 18 5.4087 18 7C18 8.5913 17.3679 10.1174 16.2426 11.2426C15.1174 12.3679 13.5913 13 12 13ZM12 11C13.0609 11 14.0783 10.5786 14.8284 9.82843C15.5786 9.07828 16 8.06087 16 7C16 5.93913 15.5786 4.92172 14.8284 4.17157C14.0783 3.42143 13.0609 3 12 3C10.9391 3 9.92172 3.42143 9.17157 4.17157C8.42143 4.92172 8 5.93913 8 7C8 8.06087 8.42143 9.07828 9.17157 9.82843C9.92172 10.5786 10.9391 11 12 11Z"
                    fill={active == 3 ? "white" : "gray"}
                  />
                </svg>

                <h3 className="mb-0 ml-4">Account</h3>
              </a>
            </Link>
            <Link href={`/dashboard/settings`} passHref>
              <a
                className={`navlink d-flex align-items-center pl-4 ${
                  active == 4 ? "active" : ""
                }`}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3.33933 16.9999C2.9166 16.2689 2.58799 15.4874 2.36133 14.6739C2.85464 14.423 3.26892 14.0406 3.55836 13.5688C3.84779 13.0971 4.00109 12.5545 4.0013 12.0011C4.00151 11.4476 3.84861 10.9049 3.55953 10.4329C3.27045 9.961 2.85645 9.57821 2.36333 9.32694C2.81536 7.69243 3.67606 6.1999 4.86433 4.98994C5.32842 5.29167 5.86695 5.45911 6.42031 5.47373C6.97367 5.48834 7.52028 5.34958 7.99966 5.07278C8.47904 4.79598 8.87248 4.39194 9.13646 3.90539C9.40043 3.41883 9.52463 2.86872 9.49533 2.31594C11.1374 1.89157 12.8606 1.89226 14.5023 2.31795C14.4733 2.87071 14.5977 3.42073 14.8619 3.90715C15.1261 4.39357 15.5197 4.79742 15.9992 5.07401C16.4786 5.35059 17.0253 5.48913 17.5786 5.4743C18.1319 5.45946 18.6704 5.29183 19.1343 4.98994C19.7133 5.57994 20.2273 6.25095 20.6593 6.99995C21.0923 7.74895 21.4163 8.52995 21.6373 9.32595C21.144 9.57685 20.7297 9.95932 20.4403 10.4311C20.1509 10.9028 19.9976 11.4454 19.9974 11.9988C19.9971 12.5523 20.15 13.095 20.4391 13.5669C20.7282 14.0389 21.1422 14.4217 21.6353 14.6729C21.1833 16.3075 20.3226 17.8 19.1343 19.0099C18.6702 18.7082 18.1317 18.5408 17.5784 18.5262C17.025 18.5115 16.4784 18.6503 15.999 18.9271C15.5196 19.2039 15.1262 19.6079 14.8622 20.0945C14.5982 20.5811 14.474 21.1312 14.5033 21.6839C12.8612 22.1083 11.1381 22.1076 9.49633 21.6819C9.52537 21.1292 9.40093 20.5792 9.13675 20.0927C8.87257 19.6063 8.47897 19.2025 7.9995 18.9259C7.52003 18.6493 6.97338 18.5108 6.42005 18.5256C5.86673 18.5404 5.32829 18.7081 4.86433 19.0099C4.27332 18.4069 3.76092 17.7315 3.33933 16.9999ZM8.99933 17.1959C10.065 17.8106 10.8662 18.797 11.2493 19.9659C11.7483 20.0129 12.2493 20.0139 12.7483 19.9669C13.1317 18.7978 13.9333 17.8114 14.9993 17.1969C16.0645 16.5806 17.3199 16.3794 18.5243 16.6319C18.8143 16.2239 19.0643 15.7889 19.2723 15.3339C18.4518 14.4174 17.9984 13.2302 17.9993 11.9999C17.9993 10.7399 18.4693 9.56295 19.2723 8.66595C19.0629 8.21109 18.8118 7.77658 18.5223 7.36795C17.3186 7.62025 16.0641 7.41942 14.9993 6.80395C13.9337 6.18932 13.1325 5.20293 12.7493 4.03394C12.2503 3.98694 11.7493 3.98594 11.2503 4.03294C10.8669 5.20209 10.0653 6.1885 8.99933 6.80295C7.93411 7.41926 6.67881 7.62046 5.47433 7.36795C5.18489 7.77623 4.93446 8.21081 4.72633 8.66595C5.5469 9.5825 6.00021 10.7697 5.99933 11.9999C5.99933 13.2599 5.52933 14.4369 4.72633 15.3339C4.9358 15.7888 5.18687 16.2233 5.47633 16.6319C6.68005 16.3796 7.93454 16.5805 8.99933 17.1959ZM11.9993 14.9999C11.2037 14.9999 10.4406 14.6839 9.87801 14.1213C9.3154 13.5587 8.99933 12.7956 8.99933 11.9999C8.99933 11.2043 9.3154 10.4412 9.87801 9.87862C10.4406 9.31602 11.2037 8.99995 11.9993 8.99995C12.795 8.99995 13.558 9.31602 14.1206 9.87862C14.6833 10.4412 14.9993 11.2043 14.9993 11.9999C14.9993 12.7956 14.6833 13.5587 14.1206 14.1213C13.558 14.6839 12.795 14.9999 11.9993 14.9999ZM11.9993 12.9999C12.2645 12.9999 12.5189 12.8946 12.7064 12.7071C12.894 12.5195 12.9993 12.2652 12.9993 11.9999C12.9993 11.7347 12.894 11.4804 12.7064 11.2928C12.5189 11.1053 12.2645 10.9999 11.9993 10.9999C11.7341 10.9999 11.4798 11.1053 11.2922 11.2928C11.1047 11.4804 10.9993 11.7347 10.9993 11.9999C10.9993 12.2652 11.1047 12.5195 11.2922 12.7071C11.4798 12.8946 11.7341 12.9999 11.9993 12.9999Z"
                    fill={active == 4 ? "white" : "gray"}
                  />
                </svg>

                <h3 className="mb-0 ml-4">Settings</h3>
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
                  alt="addIcon"
                  style={{ opacity: 0.3 }}
                />
                <p className="mb-0 ml-3">Start a campaign</p>
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
                  alt="questionMarkIcon"
                  style={{ opacity: 0.3 }}
                />
                <p className="mb-0 ml-3">Need some help?</p>
              </div>
            </a>
          </Link>
        </aside>
        <main style={{ minWidth: "calc(100% - 300px)" }}>
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
                alt="menuIcon"
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
            style={{
              position: "sticky",
              top: 0,
              zIndex: 10,
              boxShadow: "0px 3px 2px 0px rgba(0,0,0,0.06)",
            }}
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
        {showModal && (
          <LogoutModal
            onModalClose={() => setShowModal(false)}
            showModal={showModal}
          />
        )}
        {showMenu && (
          <MobileCampaignMenu
            setShowDelete={() => setShowModal(true)}
            onClose={() => setShowMenu(false)}
          />
        )}
      </Wrapper>
    </Layout>
  );
}

const Wrapper = styled.div`
  min-height: 100vh;
  min-width: 100%;
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
    // overflow-y: scroll;
    background: black;
    // ::-webkit-scrollbar {
    //   height: 4px;
    //   width: 4px;
    //   background: whitesmoke;
    // }
    // ::-webkit-scrollbar-thumb:vertical {
    //   background: var(--color-primary);
    //   border-radius: 4px;
    // }
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
      input[type="date"],
      input[type="phone"] {
        background: #fafafa;
        border:none;
        box-shadow: -2px 4px 48px rgba(50, 50, 71, 0.05), 2px 10px 24px rgba(50, 50, 71, 0.05);
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
        background: #fafafa;
        border: none;
        box-shadow: -2px 4px 48px rgba(50, 50, 71, 0.05), 2px 10px 24px rgba(50, 50, 71, 0.05);
        box-sizing: border-box;
        border-radius: 4px;
        padding: 5px 15px;
      }
      .file {
       max-width: 400px;
        width: 100%;
        height: 200px;
        background: #fafafa;
        border: none;
        box-sizing: border-box;
        border-radius: 4px;
        input {
          background: transparent !important;
          border-style: none;
          box-shadow: -2px 4px 48px rgba(50, 50, 71, 0.05), 2px 10px 24px rgba(50, 50, 71, 0.05);
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
