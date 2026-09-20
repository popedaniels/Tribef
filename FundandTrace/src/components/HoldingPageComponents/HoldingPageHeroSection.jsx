import axios from "axios";
import React, { useState } from "react";
import { motion, useAnimation } from "framer-motion";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { toast } from "../../../store/slices/ToastSlice";
import Spinner from "../composed/spinner/Spinner";
import HoldingPageNavbar from "./NavBar";
import Navbar from "../Navbar/Navbar";
import Link from "next/link";
import { selectAuthStateState } from "../../../store/slices/authSlice";

const ImageMotion = () => {
  const controls = useAnimation();
  const [ref, inView] = useInView();

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [controls, inView]);

  return (
    <motion.img
      src="https://res.cloudinary.com/wisdomosara/image/upload/v1627290935/holdingHero.png"
      alt="HoldingHero Image"
      className="heroImage"
      ref={ref}
      animate={controls}
      initial="hidden"
      transition={{ duration: 0.6 }}
      variants={{
        visible: { opacity: 1, scale: 1 },
        hidden: { opacity: 0, scale: 0.4 },
      }}
    />
  );
};

export default function HoldingPageHeroSection({ showMainNav = false }) {
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { authenticated } = useSelector(selectAuthStateState);

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
      {!showMainNav && <HoldingPageNavbar />}
      {showMainNav && <Navbar />}
      <section
        className="d-flex flex-column flex-md-row align-items-md-center justify-content-md-between mx-auto"
        style={{ paddingTop: showMainNav ? "140px" : "" }}
      >
        <Article>
          <h1>
            1st <span>trackable and transparent</span> fundraising platform
          </h1>
          <p>Making fundraising easy and open.</p>
          {showMainNav ? (
            <Link
              href={`${authenticated ? "/StartACampaign" : "/SignUp"}`}
              passHref
            >
              <button>Start a campaign</button>
            </Link>
          ) : (
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
          )}
        </Article>
        <Article>
          <ImageMotion />
        </Article>
      </section>
    </Wrapper>
  );
}

const Wrapper = styled.section`
  background: #f9f9f9;
  section {
    padding: 30px 100px 70px 100px;
    max-width: 1440px;
    @media screen and (max-width: 767px) {
      padding: 30px 15px;
    }
    @media screen and (min-width: 768px) and (max-width: 1232px) {
      padding: 30px 50px 70px 50px;
    }
  }
`;

const Article = styled.article`
  button {
    background: var(--color-primary);
    box-shadow: 0px 2px 4px rgba(50, 50, 71, 0.06),
      0px 2px 2px rgba(50, 50, 71, 0.06);
    border-radius: 4px;
    padding: 15px 30px;
    outline: none;
    border-style: none;
    color: white;
    min-width: 185px;
    @media screen and (max-width: 767px) {
      width: 100%;
      margin-left: 0;
      margin-top: 20px;
    }
    @media screen and (min-width: 768px) and (max-width: 1023px) {
      width: 100%;
      max-width: 200px;
      margin-left: 0;
      margin-top: 20px;
    }
  }
  @media screen and (max-width: 767px) {
    width: 100%;
  }
  h1 {
    font-style: normal;
    font-weight: 700;
    font-size: 35px;
    line-height: 48px;
    span {
      font-size: 35px;
      color: var(--color-primary);
      @media screen and (max-width: 767px) {
        font-size: 30px;
      }
    }
    color: #272424;
    margin-bottom: 24px;
    @media screen and (max-width: 767px) {
      font-size: 30px;
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

  .heroImage {
    margin-left: 40px;
    width: 450px;
    @media screen and (max-width: 767px) {
      width: 100%;
      margin-left: 0;
      margin-top: 50px;
    }
    @media screen and (min-width: 768px) and (max-width: 1023px) {
      width: 299px;
    }
  }
`;

const Div = styled.div`
  form {
    width: 100%;
    max-width: 600px;
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
      min-width: 185px;

      p {
        font-size: 16px;
      }
      @media screen and (max-width: 767px) {
        width: 100%;
        margin-left: 0;
        margin-top: 20px;
      }
      @media screen and (min-width: 768px) and (max-width: 1023px) {
        width: 100%;
        max-width: 200px;
        margin-left: 0;
        margin-top: 20px;
      }
    }
  }
`;
