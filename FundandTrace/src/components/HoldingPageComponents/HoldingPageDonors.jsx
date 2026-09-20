import styled from "styled-components";
import { motion, useAnimation } from "framer-motion";
import React from "react";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

const ImageDiv = () => {
  const controls = useAnimation();
  const [ref, inView] = useInView();

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [controls, inView]);

  return (
    <article>
      <motion.img
        src="https://res.cloudinary.com/wisdomosara/image/upload/v1627290928/donors_a93smv.png"
        alt="HoldingHero Image"
        className="heroImage"
        ref={ref}
        animate={controls}
        initial="hidden"
        transition={{ duration: 0.6 }}
        variants={{
          visible: { opacity: 1, x: 0 },
          hidden: { opacity: 0, x: -10 },
        }}
      />
    </article>
  );
};

export default function HoldingPageDonors() {
  const controls = useAnimation();
  const [ref, inView] = useInView();

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [controls, inView]);

  return (
    <Wrapper id="Donors">
      <section className="d-flex flex-column flex-md-row align-items-md-center justify-content-md-between mx-auto">
        <ImageDiv />
        <motion.article
          ref={ref}
          animate={controls}
          initial="hidden"
          transition={{ duration: 0.6 }}
          variants={{
            visible: { opacity: 1, x: 0 },
            hidden: { opacity: 0, x: 10 },
          }}
        >
          <h5 className="text-blue mb-3">FOR DONORS</h5>
          <h2>
            <span>Transparency</span> at our core.
          </h2>
          <p>
            You can contribute to a campaign with Fund&Trace and receive a
            detailed account of your donation.
          </p>
          <div className="d-flex align-items-center mb-3">
            <img
              src="/images/icons/blueCheck.svg"
              alt="check"
              width="20px"
              height="20px"
              className="mr-3"
            />
            <p className="mb-0">
              Donate to the campaign in{" "}
              <span className="text-blue">3 minutes.</span>
            </p>
          </div>
          <div className="d-flex align-items-center mb-3">
            <img
              src="/images/icons/blueCheck.svg"
              alt="check"
              width="20px"
              height="20px"
              className="mr-3"
            />
            <p className="mb-0">
              <span className="text-blue">Track</span> how your donations are
              spent.
            </p>
          </div>
          <div className="d-flex align-items-center mb-3">
            <img
              src="/images/icons/blueCheck.svg"
              alt="check"
              width="20px"
              height="20px"
              className="mr-3"
            />
            <p className="mb-0">
              Receive{" "}
              <span className="text-blue">periodic account statements</span> of
              the campaign.
            </p>
          </div>
        </motion.article>
      </section>
    </Wrapper>
  );
}

const Wrapper = styled.section`
  section {
    padding: 100px 100px;
    max-width: 1440px;
    @media screen and (max-width: 767px) {
      padding: 50px 15px;
    }
    @media screen and (min-width: 768px) and (max-width: 1232px) {
      padding: 100px 50px;
    }
    article {
      width: 46%;
      @media screen and (max-width: 767px) {
        width: 100%;
      }

      h2 {
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
        }
      }

      .heroImage {
        margin-right: 40px;
        width: 100%;
        @media screen and (max-width: 767px) {
          width: 100%;
          margin-right: 0;
          margin-bottom: 50px;
        }
        @media screen and (min-width: 768px) and (max-width: 1023px) {
          width: 100%;
        }
      }
    }
  }
  p {
    margin-bottom: 35px;
    font-style: normal;
    font-weight: normal;
    font-size: 16px;
    line-height: 24px;
    span {
      font-size: 16px;
      @media screen and (max-width: 767px) {
        font-size: 16px;
      }
    }
  }
`;
