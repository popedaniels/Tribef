import axios from "axios";
import Link from "next/link";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import styled from "styled-components";
import { toast } from "../../../store/slices/ToastSlice";
import Spinner from "../composed/spinner/Spinner";

export default function HoldingPageFooter() {
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(
        process.env.NEXT_PUBLIC_API_URL + "/api/waitlist/" + email
      );
      res && dispatch(toast(true, res?.data?.message, "success"));
      res && setLoading(false);
      res && setEmail("");
    } catch (error) {
      dispatch(toast(true, error?.response?.data?.error, "error"));
      setLoading(false);
    }
  };

  return (
    <Wrapper>
      <section className="d-flex flex-column align-items-center justify-content-center mx-auto w-100">
        <Article className="footer-top d-flex flex-column flex-md-row align-items-md-center justify-content-md-between w-100">
          <div className="inputDiv w-100">
            <h2>
              What are you waiting for?
              <br /> Don’t miss our launch!
            </h2>
            <p className="text-white">
              Providing the donation process with end-to-end transparency.
            </p>
            <Div className="input d-flex align-items-center">
              <form
                onSubmit={handleSubmit}
                className="d-flex flex-column flex-lg-row"
              >
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={email}
                  required
                  placeholder="Your email address.."
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button className="text-white">
                  {loading ? (
                    <Spinner
                      type="TailSpin"
                      width={20}
                      height={20}
                      color={"white"}
                    />
                  ) : (
                    <p className="mb-0 text-white">Join Us</p>
                  )}
                </button>
              </form>
            </Div>
          </div>
          <div className="rocket-image">
            <img
              src="https://res.cloudinary.com/wisdomosara/image/upload/v1627290931/footerRocket_z4eyre.png"
              alt="footerImage"
              width="100%"
            />
          </div>
        </Article>
        <div className="footer-bottom d-flex flex-column justify-content-center align-items-center flex-md-row justify-content-md-between align-items-md-start w-100">
          <div className="d-flex flex-column justify-content-center justify-content-md-start align-items-center align-items-md-start">
            <img
              src="/images/icons/footerLogoBig.svg"
              alt="logo"
              className="d-none d-md-block"
            />
            <img
              src="/images/icons/footerLogo.svg"
              alt="logo"
              className="d-md-none"
            />
            <div className="d-md-flex align-items-center mt-2 d-none">
              <img
                src="/images/icons/copyrightWhite.svg"
                alt="copyright"
                width="20px"
                className="mr-2"
              />
              <p className="text-white mb-0" style={{ fontSize: 14 }}>
                All rights reserved 2021
              </p>
            </div>
          </div>
          <div className="links d-flex justify-content-between">
            <nav className="d-flex flex-column">
              <h6 className="mb-4 text-white">Company</h6>
              <Link href="/terms" passHref>
                <a target="_blank" className="mb-3">
                  Terms
                </a>
              </Link>
              <Link href="/privacy" passHref>
                <a target="_blank" className="mb-3">
                  Privacy
                </a>
              </Link>
            </nav>
            <nav className="d-flex flex-column">
              <h6 className="mb-4 text-white">Follow Us</h6>
              <Link href="https://twitter.com/fundandtrace" passHref>
                <a target="_blank" className="mb-3">
                  Twitter
                </a>
              </Link>
              <Link href="https://linkedIn.com/company/fundandtrace" passHref>
                <a target="_blank" className="mb-3">
                  LinkedIn
                </a>
              </Link>
              <Link href="https://facebook.com/fundandtrace" passHref>
                <a target="_blank" className="mb-3">
                  Facebook
                </a>
              </Link>
              <Link href="https://instagram.com/fundandtrace" passHref>
                <a target="_blank" className="mb-3">
                  Instagram
                </a>
              </Link>
            </nav>
          </div>
          <div className="d-flex align-items-center d-md-none mx-auto mt-4">
            <img
              src="/images/icons/copyrightWhite.svg"
              alt="copyright"
              width="20px"
              className="mr-3"
            />
            <p className="text-white mb-0" style={{ fontSize: 14 }}>
              All rights reserved 2021
            </p>
          </div>
        </div>
      </section>
    </Wrapper>
  );
}

const Wrapper = styled.footer`
  background: #0a0c18;
  section {
    max-width: 1440px;
    padding: 60px 100px;
    @media screen and (max-width: 767px) {
      padding: 60px 15px;
    }
    @media screen and (min-width: 768px) and (max-width: 1232px) {
      padding: 60px 50px;
    }
    .footer-bottom {
      margin-top: 65px;
      .links {
        width: 250px;
        nav {
          a {
            text-decoration: none;
            font-style: normal;
            font-weight: normal;
            font-size: 18px;
            line-height: 20px;
            /* or 222% */

            color: #ffffff;

            opacity: 0.9;
          }
        }
        @media screen and (max-width: 767px) {
          margin-top: 30px;
        }
      }
    }
  }
`;

const Article = styled.article`
  @media screen and (max-width: 767px) {
    width: 100%;
  }
  .inputDiv {
    @media screen and (min-width: 1200px) {
      padding-right: 60px !important;
    }
    @media screen and (max-width: 767px) {
      margin-bottom: 20px;
      order: 10;
    }
    h2 {
      font-style: normal;
      font-weight: 700;
      font-size: 35px;
      line-height: 48px;
      color: white;
      margin-bottom: 24px;
      @media screen and (max-width: 767px) {
        font-size: 25px;
        text-align: center;
      }
    }
    p {
      margin-bottom: 35px;
      font-style: normal;
      font-weight: normal;
      font-size: 18px;
      line-height: 24px;
      @media screen and (max-width: 767px) {
        text-align: center;
      }
    }
  }
  .rocket-image {
    @media screen and (max-width: 767px) {
      margin-bottom: 20px;
      order: 1;
    }
  }
`;

const Div = styled.div`
  form {
    width: 100%;
    max-width: 640px;
    @media screen and (max-width: 767px) {
      max-width: 100%;
    }
    input {
      background: #ffffff;
      border: 0.5px solid #bfbfbf;
      box-sizing: border-box;
      border-radius: 4px;
      height: 54px;
      padding: 15px 22px;
      width: calc(100% - 185px - 20px);
      @media screen and (max-width: 1023px) {
        width: 100%;
      }
    }
    button {
      background: var(--color-primary);
      box-shadow: 0px 2px 4px rgba(50, 50, 71, 0.06),
        0px 2px 2px rgba(50, 50, 71, 0.06);
      border-radius: 4px;
      padding: 15px 30px;
      outline: none;
      border-style: none;
      margin-left: 20px;
      min-width: 215px;
      p {
        font-size: 16px;
      }
      @media screen and (max-width: 991px) {
        width: 100%;
        margin-left: 0;
        margin-top: 20px;
      }
    }
  }
`;
