import React, { useEffect } from "react";
import styled from "styled-components";
import { motion, useAnimation } from "framer-motion";
import { useInView } from "react-intersection-observer";

function Image1() {
  const controls = useAnimation();
  const [ref, inView] = useInView({ threshold: 0.3 });

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [controls, inView]);

  return (
    <motion.img
      ref={ref}
      animate={controls}
      initial="hidden"
      transition={{ duration: 0.8 }}
      variants={{
        visible: { opacity: 1, y: 0 },
        hidden: { opacity: 0, y: -10 },
      }}
      src="https://res.cloudinary.com/wisdomosara/image/upload/v1622836152/zero1.png"
      alt="african"
      className="position-relative"
      style={{ top: 100, left: 0, width: "50%" }}
    />
  );
}

function Image2() {
  const controls = useAnimation();
  const [ref, inView] = useInView({ threshold: 0.3 });

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [controls, inView]);

  return (
    <motion.img
      ref={ref}
      animate={controls}
      initial="hidden"
      transition={{ duration: 0.8, delay: 0.3 }}
      variants={{
        visible: { opacity: 1, y: 0 },
        hidden: { opacity: 0, y: 10 },
      }}
      src="https://res.cloudinary.com/wisdomosara/image/upload/v1622836155/africanRight.png"
      alt="african"
      className="position-relative"
      style={{
        top: 0,
        right: 0,
        width: "42%",
        objectFit: "cover",
        borderRadius: "4px",
      }}
    />
  );
}

export default function African() {
  const controls = useAnimation();
  const [ref, inView] = useInView({ threshold: 0.3 });

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [controls, inView]);
  return (
    <Wrapper className="d-flex justify-content-center align-items-center flex-column flex-md-row custom-container">
      <div className="left" ref={ref}>
        <p className="text-blue mb-3 ">DONATE AS MUCH AS YOU WANT</p>
        <h2 className="text-heading mb-3">0% platform fees!</h2>
        <p className="text-small">
          Fund&Trace will charge zero platform fee on all fundraisers. Only
          payment gateway fee will be applicable, which directly goes to the
          service providers eg. Flutterwave.
        </p>
      </div>
      <div className="right d-flex justify-content-md-around justify-content-between">
        <Image1 />
        <Image2 />
      </div>
    </Wrapper>
  );
}

const Wrapper = styled.section`
  margin-bottom: 180px;
  @media screen and (min-width: 1280px) {
    margin-bottom: 230px;
  }
  @media screen and (max-width: 767px) {
    margin-bottom: 144px;
  }
  .right {
    width: 60%;
    @media screen and (max-width: 767px) {
      width: 100%;
      order: 1;
      margin-bottom: 100px;
    }
  }
  .left {
    max-width: 335px;
    margin-right: 48px;
    @media screen and (max-width: 767px) {
      width: 100%;
      margin-top: 40px;
      text-align: center;
      margin-right: 0;
      max-width: 100%;
      order: 10;
    }
  }
`;
