import Link from "next/link";
import React, { useEffect, useState } from "react";
import styled from "styled-components";

export default function HoldingPageNavbar({ showNav }) {
  const [open, setOpen] = useState(false);

  return (
    <Wrapper
      className={`bg-transparent`}
      style={{
        position: showNav ? "sticky" : "static",
        top: 0,
        background: showNav ? "white" : "transaprent",
        boxShadow: showNav
          ? "0 0.125rem 0.1875rem -0.125rem rgba(0,0,0,.2)"
          : "none",
        paddingTop: showNav ? "" : "15px",
      }}
    >
      <nav className="mx-auto d-flex align-items-center justify-content-between">
        <a href="#">
          <img src="/images/logo.png" width={74} height={58} alt="logo" />
        </a>

        <ul className="d-md-flex align-items-center mb-0 pl-0 d-none">
          <li>
            <a href="#Donors">For Donors</a>
          </li>
          <li>
            <a href="#Fundraisers">For Fundraisers</a>
          </li>
          <li>
            <a href="#Why">Why Fund&Trace?</a>
          </li>
        </ul>
        <img
          src="/images/icons/menu.svg"
          alt="menu image"
          className="d-md-none"
          role="button"
          onClick={() => setOpen(!open)}
        />

        <div
          className={`d-md-none position-fixed ${open ? "open" : "close"}`}
          style={{ top: 0, width: "100%" }}
          onClick={() => setOpen(false)}
        >
          <ul
            className="d-flex flex-column align-items-center bg-white justify-content-center mb-0 pl-0"
            onClick={(e) => e.stopPropagation()}
          >
            <li
              style={{ float: "right", fontSize: 30, lineHeight: "30px" }}
              className="ml-auto"
              role="button"
              onClick={() => setOpen(false)}
            >
              x
            </li>
            <li onClick={() => setOpen(false)}>
              <a href="#Donors">For Donors</a>
            </li>
            <li onClick={() => setOpen(false)}>
              <a href="#Fundraisers">For Fundraisers</a>
            </li>
            <li onClick={() => setOpen(false)}>
              <a href="#Why">Why Fund&Trace</a>
            </li>
          </ul>
        </div>
      </nav>
    </Wrapper>
  );
}

const Wrapper = styled.header`
  width: 99.8vw;
  z-index: 100000;
  nav {
    max-width: 1440px;
    padding: 8px 100px;
    @media screen and (max-width: 767px) {
      padding: 8px 15px;
    }
    @media screen and (min-width: 768px) and (max-width: 1279px) {
      padding: 8px 50px;
    }
    .open {
      right: 0;
      transition: 0.5s ease;
      ul {
        padding: 25px 15px 20px 15px;
        box-shadow: 0px 2px 4px rgba(50, 50, 71, 0.06),
          0px 2px 2px rgba(50, 50, 71, 0.06);
      }
      height: 100vh;
    }
    .close {
      transition: 0.5s ease;
      right: -100%;

      height: 100vh;
      ul {
        padding: 25px 15px 20px 15px;
        box-shadow: 0px 2px 4px rgba(50, 50, 71, 0.06),
          0px 2px 2px rgba(50, 50, 71, 0.06);
      }
    }
    ul {
      list-style: none;
      li {
        margin-left: 31px;
        @media screen and (max-width: 767px) {
          margin-left: 0;
          margin-bottom: 20px;
        }
        a {
          text-decoration: none;
          font-style: normal;
          font-weight: normal;
          font-size: 16px;
          line-height: 24px;
          color: #272424;
          @media screen and (max-width: 767px) {
            color: black;
          }
          opacity: 0.9;
        }
      }
    }
  }
`;
