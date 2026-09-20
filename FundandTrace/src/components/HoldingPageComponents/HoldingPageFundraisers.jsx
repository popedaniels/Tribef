import styled from "styled-components";
import { motion, useAnimation } from "framer-motion";
import React from "react";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

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
      src="https://res.cloudinary.com/wisdomosara/image/upload/v1627290940/fundraisers.png"
      alt="HoldingHero Image"
      className="heroImage"
      ref={ref}
      animate={controls}
      initial="hidden"
      transition={{ duration: 0.6 }}
      variants={{
        visible: { opacity: 1, x: 0 },
        hidden: { opacity: 0, x: 10 },
      }}
    />
  );
};

export default function HoldingPageFundraisers() {
  const controls = useAnimation();
  const [ref, inView] = useInView();

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [controls, inView]);

  return (
    <Wrapper id="Fundraisers">
      <section className="d-flex flex-column flex-lg-row mx-auto">
        <Article className="d-flex flex-column justify-content-center">
          <motion.div
            ref={ref}
            animate={controls}
            initial="hidden"
            transition={{ duration: 0.6 }}
            variants={{
              visible: { opacity: 1, x: 0 },
              hidden: { opacity: 0, x: -10 },
            }}
          >
            <h5 className="text-white mb-3">FOR FUNDRAISERS</h5>
            <h2 className="text-white">
              Fundraise for an individual, group or organization
            </h2>
            <p>
              Fund&Trace is the best place to fundraise, whether you are an
              individual, group or an organization.
            </p>
            <div className="d-flex align-items-center mb-3">
              <img
                src="/images/icons/whiteCheck.svg"
                alt="check"
                width="20px"
                height="20px"
                className="mr-3"
              />
              <p className="mb-0">
                Organize a campaign in <span className="">10 minutes.</span>
              </p>
            </div>
            <div className="d-flex align-items-center mb-3">
              <img
                src="/images/icons/whiteCheck.svg"
                alt="check"
                width="20px"
                height="20px"
                className="mr-3"
              />
              <p className="mb-0">
                Reach the world with <span className="">your story.</span>
              </p>
            </div>
            <div className="d-flex align-items-center mb-3">
              <img
                src="/images/icons/whiteCheck.svg"
                alt="check"
                width="20px"
                height="20px"
                className="mr-3"
              />
              <p className="mb-0">
                Manage your funds <span>with ease.</span>
              </p>
            </div>
          </motion.div>
        </Article>
        <Section className="d-flex flex-column align-items-center justify-content-center">
          <ImageMotion />
        </Section>
      </section>
    </Wrapper>
  );
}

const Wrapper = styled.section`
  background: linear-gradient(to right, #1f244a 40%, #0a0c18 40%);
  section {
    max-width: 1440px;
  }
`;

const Article = styled.article`
  width: 47%;
  height: auto;
  background: #1f244a;
  padding: 100px 50px 100px 100px;
  @media screen and (min-width: 768px) and (max-width: 1023px) {
    padding: 50px 50px;
    width: 100%;
    order: 10;
  }
  @media screen and (min-width: 1024px) and (max-width: 1232px) {
    padding: 100px 50px;
  }
  @media screen and (max-width: 767px) {
    width: 100%;
    padding: 50px 15px;
    order: 10;
  }

  p {
    margin-bottom: 35px;
    font-style: normal;
    font-weight: normal;
    font-size: 16px;
    line-height: 24px;
    color: rgba(255, 255, 255, 0.6);
    opacity: 0.9;
    @media screen and (max-width: 991px) {
      font-size: 16px;
      max-width: 600px;
    }
    span {
      font-size: 16px;
      color: white;
      @media screen and (max-width: 991px) {
        font-size: 16px;
      }
    }
  }
  h2 {
    font-style: normal;
    font-weight: 700;
    font-size: 35px;
    line-height: 48px;
    color: #272424;
    margin-bottom: 24px;
    @media screen and (max-width: 991px) {
      font-size: 30px;
      max-width: 600px;
    }
  }
  h5 {
    font-style: normal;
    font-weight: 500;
    font-size: 14px;
    line-height: 24px;
    /* identical to box height, or 171% */

    color: #ffffff;
  }
`;

const Section = styled.div`
  width: 53%;
  background: #0a0c18;
  padding: 50px 20px 50px 100px;
  @media screen and (min-width: 768px) and (max-width: 1023px) {
    padding: 50px 50px;
    width: 100%;
    order: 1;
  }
  @media screen and (max-width: 767px) {
    width: 100%;
    padding: 30px 15px;
    order: 1;
  }
  .heroImage {
    width: 100%;
    @media screen and (max-width: 1023px) {
      width: 100%;
      max-width: 600px;
    }
  }
`;
