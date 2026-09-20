import React, { useEffect } from "react";
import styled from "styled-components";
import { motion, useAnimation } from "framer-motion";
import { useInView } from "react-intersection-observer";
import "react-responsive-carousel/lib/styles/carousel.min.css"; // requires a loader
import { Carousel } from "react-responsive-carousel";

function Image1() {
  const controls = useAnimation();
  const [ref, inView] = useInView();

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
        hidden: { opacity: 0, y: 15 },
      }}
      src="https://res.cloudinary.com/wisdomosara/image/upload/v1622844491/transparency.png"
      alt="transparency"
      className="d-none d-md-block"
      width={"100%"}
    />
  );
}

export default function Transparency() {
  const controls = useAnimation();
  const [ref, inView] = useInView({ threshold: 0.3 });

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [controls, inView]);
  return (
    <Wrapper className="custom-container d-flex flex-column justify-content-center align-items-center">
      <div className="texts">
        <p className="mb-3 text-blue text-center">TRANSPARENCY AT ITS CORE</p>
        <h2 className="text-heading mb-4 text-center">
          Know where your money goes to after donating
        </h2>
        <p className="mb-4 text-small text-center " ref={ref}>
          We believe that transparency of one’s operations results in trust and
          a deep sense of security. We want to make fundraising as transparent
          and easy as possible by sending email/audit updates on the cause(s)
          you donated to. You can also choose to opt out of the updates at your
          convenience.
        </p>
      </div>
      <Image1 />
      <div className="d-md-none">
        <Carousel
          showThumbs={false}
          showStatus={false}
          showArrows={false}
          autoPlay
          infiniteLoop
          stopOnHover
        >
          <img
            src="/images/transparencyMobile1.png"
            alt="transparency-images"
          />
          <img
            src="/images/transparencyMobile2.png"
            alt="transparency-images"
          />
          <img
            src="/images/transparencyMobile3.png"
            alt="transparency-images"
          />
        </Carousel>
      </div>
    </Wrapper>
  );
}

const Wrapper = styled.section`
  margin-bottom: 144px;
  // @media screen and (max-width: 767px) {
  //   margin-bottom: 80px;
  // }
  .texts {
    max-width: 560px;
  }
  .carousel-slider {
    padding-bottom: 30px;
    .control-dots {
      position: absolute;
      bottom: 0 !important;
      .dot {
        background: grey;
      }
      .selected {
        background: var(--color-primary);
      }
    }
  }
`;
