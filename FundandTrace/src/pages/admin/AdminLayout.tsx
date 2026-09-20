import Link from "next/link";
import router from "next/router";
import React from "react";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { useAppDispatch } from "./../../../store/hooks";
import {
  adminLogout,
  selectAdminAuthStateState,
} from "../../../store/slices/adminAuthStateSlice";

const navLinks = [
  {
    link: "/",
    title: "Overview",
  },
  {
    link: "/campaigns",
    title: "Campaigns",
  },
  {
    link: "/users",
    title: "Users",
  },
  {
    link: "/fundingRequests",
    title: "Funding Requests",
  },
  {
    link: "/helpdesk",
    title: "Help Desk",
  },
  {
    link: "/refunds",
    title: "Refunds",
  },
];

interface AdminLayoutProps {
  active: string;
  children: React.ReactNode;
}

export default function AdminLayout({ active, children }: AdminLayoutProps) {
  const { adminAuthenticated } = useSelector(selectAdminAuthStateState);
  const dispatch = useAppDispatch();

  useEffect(() => {
    !adminAuthenticated && router.push("/admin/auth/signIn");
  }, [adminAuthenticated]);

  return (
    <Wrapper>
      <header>
        <nav className="d-flex justify-content-between align-items-center mx-auto">
          <img
            src="/images/logo.png"
            alt="f&T logo"
            width="63px"
            height="48px"
          />
          <div
            className="links ml-5 pl-4 d-flex align-items-center"
            style={{ height: 70 }}
          >
            {navLinks.map((links, i) => (
              <div
                className="position-relative mx-2 h-100 d-flex align-items-center justify-content-center"
                key={i}
              >
                <Link href={`/admin${links.link}`} passHref>
                  <a
                    className="px-2"
                    style={{
                      color: active == links.title ? "var(--color-primary)" : "#A0A2AF",
                      fontWeight: active == links.title ? 500 : 400,
                    }}
                  >
                    {links.title}
                  </a>
                </Link>
                {active == links.title && (
                  <div
                    className="position-absolute"
                    style={{
                      bottom: 0,
                      height: 2,
                      width: "100%",
                      background: "var(--color-primary)",
                    }}
                  ></div>
                )}
              </div>
            ))}
          </div>
          <div className="notification d-flex align-items-center">
            <Link href="/admin/settings" passHref>
              <button className="">
                <img src="/images/icons/settingsIcon.svg" alt="settings Icon" />
              </button>
            </Link>
            <Link href="/admin/notifications" passHref>
              <button className="ml-2">
                <img src="/images/icons/notification.svg" alt="settings Icon" />
              </button>
            </Link>

            <button
              className="ml-2 d-flex align-items-center"
              onClick={() => dispatch(adminLogout())}
            >
              <img src="/images/icons/loginIcon.svg" alt="settings Icon" />
              <p className="ml-2 mb-0">Log out</p>
            </button>
          </div>
        </nav>
      </header>
      <main className="mx-auto">{children}</main>
    </Wrapper>
  );
}

const Wrapper = styled.section`
  background: url("/images/adminBackground.png");
  padding-bottom: 50px;
  background-size: cover;
  background-repeat: no-repeat;
  min-height: 100vh;
  width: 100vw;
  header {
    box-shadow: 0px 2px 12px rgba(0, 0, 0, 0.06);
    background: white;
    nav {
      max-width: 1440px;
      height: 70px;
      padding: 0 100px;
      @media screen and (max-width: 1300px) {
        padding: 0px 40px;
      }
      .links {
        a {
          text-decoration: none !important;
        }
      }
      .notification {
        button {
          border: none !important;
          outline: none;
          background: transparent;
          img {
            height: 21px;
            width: 22px;
          }
        }
      }
    }
  }
`;
