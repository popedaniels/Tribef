import React, { useEffect } from "react";
import styled from "styled-components";
import { motion, useAnimation } from "framer-motion";
import { useInView } from "react-intersection-observer";

function Image1() {
  const controls = useAnimation();
  const [ref, inView] = useInView({ threshold: 0.2 });

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
        visible: { opacity: 1, x: 0 },
        hidden: { opacity: 0, x: 10 },
      }}
      src="https://res.cloudinary.com/wisdomosara/image/upload/v1622836157/africanLeft.png"
      alt="african"
      className="position-absolute"
      data-wow-duration="1s"
      style={{ top: 0, left: 0, width: "60%" }}
    />
  );
}

function Image2() {
  const controls = useAnimation();
  const [ref, inView] = useInView({ threshold: 0.2 });

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
      transition={{ duration: 0.8, delay: 0.2 }}
      variants={{
        visible: { opacity: 1, y: 0 },
        hidden: { opacity: 0, y: 10 },
      }}
      src="https://res.cloudinary.com/wisdomosara/image/upload/v1622836149/africanBottom.png"
      alt="african"
      className="position-absolute"
      data-wow-duration="0.5s"
      data-wow-delay="0.6s"
      style={{ top: 150, left: "30%", width: "50%" }}
    />
  );
}

function Image3() {
  const controls = useAnimation();
  const [ref, inView] = useInView({ threshold: 0.2 });

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
        visible: { opacity: 1, x: 0 },
        hidden: { opacity: 0, x: -10 },
      }}
      src="https://res.cloudinary.com/wisdomosara/image/upload/v1622836155/africanRight.png"
      alt="african"
      className="position-absolute"
      data-wow-duration="1s"
      data-wow-delay="0.4s"
      style={{ top: 40, right: 0, width: "36%", zIndex: 100 }}
    />
  );
}

export default function African() {
  const controls = useAnimation();
  const [ref, inView] = useInView({ threshold: 0.2 });

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [controls, inView]);

  return (
    <Wrapper className="d-flex justify-content-between align-items-center flex-column flex-md-row custom-container">
      <div className="left position-relative d-none d-md-block">
        <Image1 />
        <Image2 />
        <Image3 />
      </div>
      <div className="left d-md-none w-100">
        <img
          src="https://res.cloudinary.com/wisdomosara/image/upload/v1622836157/africanLeft.png"
          alt="african"
          width="100%"
        />
      </div>
      <div className="right" ref={ref}>
        <p className="text-blue mb-3">GLOBAL</p>
        <h2 className="text-heading mb-2" style={{ lineHeight: "24px" }}>
          The Underserved
        </h2>

        <p className="text-small">
          The problem that is mostly faced within underserved communities such
          as Africa, Eastern Europe, Asia and in the Americas, is the lack of
          accountability and transparency in fundraising. We want to enable
          trust by ensuring transparency in these regions.
        </p>
      </div>
    </Wrapper>
  );
}

const Wrapper = styled.section`
  margin-bottom: 120px;
  margin-top: 100px;
  @media screen and (max-width: 767px) {
    margin-top: 80px;
    margin-bottom: 80px;
  }
  @media screen and (min-width: 1280px) {
    margin-bottom: 140px;
  }
  @media screen and (min-width: 1320px) {
    margin-bottom: 150px;
  }
  .left {
    min-height: 390px;
    @media screen and (max-width: 419px) {
      min-height: 300px;
    }

    @media screen and (min-width: 420px) and (max-width: 500px) {
      min-height: 350px;
    }
    @media screen and (min-width: 501px) and (max-width: 767px) {
      min-height: 390px;
    }
    @media screen and (min-width: 768px) and (max-width: 900px) {
      min-height: 300px;
    }
    @media screen and (min-width: 901px) and (max-width: 1023px) {
      min-height: 350px;
    }
    @media screen and (min-width: 1024px) and (max-width: 1100px) {
      min-height: 350px;
    }
    @media screen and (min-width: 1100px) and (max-width: 1200px) {
      min-height: 380px;
    }
    @media screen and (min-width: 1200px) and (max-width: 1300px) {
      min-height: 380px;
    }

    width: 48%;
    @media screen and (max-width: 767px) {
      width: 100%;
    }
  }
  .right {
    width: 48%;
    @media screen and (max-width: 767px) {
      width: 100%;
      margin-top: 60px;
      text-align: center;
    }
  }
`;
