import React, { useState } from "react";
import { motion, useAnimation } from "framer-motion";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

import styled from "styled-components";

import Navbar from "../Navbar/Navbar";

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

export default function WorkingHero() {
  return (
    <Wrapper>
      <Navbar />
      <section
        className="d-flex flex-column flex-md-row align-items-md-center justify-content-md-between mx-auto"
        style={{ paddingTop: "140px" }}
      >
        <Article>
          <p style={{ fontSize: 14 }} className="text-blue">
            HOW FUND&TRACE WORKS
          </p>
          <h1 className="text-heading">
            Fundraise, donate, track a campaign you donated to!
          </h1>
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

    @media screen and (max-width: 1023px) {
      width: 100%;
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
    font-size: 32px;
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
