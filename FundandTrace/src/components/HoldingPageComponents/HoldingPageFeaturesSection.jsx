import { motion, useAnimation } from "framer-motion";
import React from "react";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import styled from "styled-components";

const features = [
  {
    title: "Simple setup",
    text: "You can create a campaign in just a couple of minutes.",
  },
  {
    title: "Secure payments",
    text: "You always have secure payments on Fund&Trace when you donate.",
  },
  {
    title: "Accountable platform",
    text: "Receive accurate live updates on campaigns.",
  },
  {
    title: "Track disbursements ",
    text: "Access the latest information on how your donation is spent.",
  },
  {
    title: "Social Reach",
    text: "Spread the word through your social platforms.",
  },
  {
    title: "24/7 Consultation",
    text: "Helpful customer support available to answer your queries.",
  },
];

const ImageMobile = () => {
  const controls = useAnimation();
  const [ref, inView] = useInView();

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [controls, inView]);

  return (
    <motion.img
      src="https://res.cloudinary.com/wisdomosara/image/upload/v1627290933/featuresMobile.png"
      alt="video"
      width="100%"
      className="d-md-none featureImage"
      ref={ref}
      animate={controls}
      initial="hidden"
      transition={{ duration: 0.3 }}
      variants={{
        visible: { opacity: 1, scale: 1 },
        hidden: { opacity: 0, scale: 0 },
      }}
    />
  );
};

export default function HoldingPageFeatureSection({ removeImage }) {
  const controls = useAnimation();
  const [ref, inView] = useInView();

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [controls, inView]);

  return (
    <Wrapper>
      <section className="d-flex flex-column align-items-center justify-content-center mx-auto">
        {!removeImage && (
          <>
            <motion.img
              src="https://res.cloudinary.com/wisdomosara/image/upload/v1627290938/features.png"
              alt="video"
              width="100%"
              className="d-none d-md-block featureImage"
              ref={ref}
              animate={controls}
              initial="hidden"
              transition={{ duration: 0.6 }}
              variants={{
                visible: { opacity: 1, scale: 1 },
                hidden: { opacity: 0, scale: 0.5 },
              }}
            />
            <ImageMobile />
          </>
        )}
        <div
          id="Why"
          className="mx-auto d-flex flex-column align-items-center justify-content-center"
          style={{ paddingTop: removeImage ? "80px" : "50px" }}
        >
          <h5 className="text-blue mb-5">CHOOSE FUND&TRACE TODAY</h5>
          <h2 className="mb-4">
            Fund&Trace offers a more <span>transparent and secure</span> way to
            donate to campaigns you care about.
          </h2>
          <p className="mb-5">
            Donate to any fundraising campaign and receive reports on how the
            funds are disbursed.
          </p>
          <article className="featureGrid">
            {features.map((item, i) => (
              <div key={item.title} className="grid-items">
                <img
                  src={`/images/choose${i + 1}.svg`}
                  alt="featureIcons"
                  width="50px"
                  height="50px"
                  className="mb-3"
                />
                <h4 className="mb-3">{item.title}</h4>
                <p className="mb-0">{item.text}</p>
              </div>
            ))}
          </article>
        </div>
      </section>
    </Wrapper>
  );
}

const Wrapper = styled.section`
  background: #f9f9f9;
  section {
    max-width: 1440px;
    padding: 0 100px;
    @media screen and (max-width: 767px) {
      padding: 0 15px;
    }
    @media screen and (min-width: 768px) and (max-width: 1232px) {
      padding: 0 50px;
    }
    .featureImage {
      margin: 80px 0 50px 0;
    }
    .featureGrid {
      margin-bottom: 100px;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 2.5rem;
      @media screen and (max-width: 767px) {
        grid-template-columns: repeat(1, minmax(0, 1fr));
        gap: 2.5rem;
      }
      @media screen and (min-width: 768px) and (max-width: 1023px) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 2.5rem;
      }
      .grid-items {
        padding: 30px;
        background: #ffffff;
        box-shadow: 0px 2px 6px rgba(229, 229, 229, 0.2);
        border-radius: 4px;
        p {
          width: 100%;
          text-align: left;
          font-style: normal;
          font-weight: normal;
          font-size: 16px;
          line-height: 24px;

          opacity: 0.9;
        }
        h4 {
          font-style: normal;
          font-weight: bold;
          font-size: 18px;
          line-height: 28px;

          color: #272424;
        }
      }
    }
    h2 {
      font-style: normal;
      font-weight: bold;
      font-size: 32px;
      line-height: 42px;
      color: #272424;
      max-width: 800px;
      text-align: center;
      span {
        font-size: 32px;
        color: var(--color-primary);
      }
    }
    p {
      width: 586px;
      text-align: center;
      font-style: normal;
      font-weight: normal;
      font-size: 16px;
      line-height: 24px;

      opacity: 0.9;
      @media screen and (max-width: 767px) {
        width: 100%;
      }
    }
  }
`;
