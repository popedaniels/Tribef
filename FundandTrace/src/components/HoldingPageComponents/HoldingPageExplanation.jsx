import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import React from "react";
import styled from "styled-components";

const slides = [
  "View fundandtrace.com campaigns",
  "Donate to the campaign you care about",
  "Campaign reaches its target",
  "Track how your donation is utilized",
];

const images = [
  "https://res.cloudinary.com/wisdomosara/image/upload/v1627290921/explain1_mzhd6o.png",
  "https://res.cloudinary.com/wisdomosara/image/upload/v1627290932/explain2_xatoea.png",
  "https://res.cloudinary.com/wisdomosara/image/upload/v1627290933/explain3.png",
  "https://res.cloudinary.com/wisdomosara/image/upload/v1627290928/explain4_bidgz5.png",
];

export default function HoldingPageExplanation() {
  return (
    <Wrapper>
      <section className="mx-auto" id="How">
        <div
          className="py-2 px-3 mx-auto mb-4"
          style={{
            background: "#F0F1FE",
            borderRadius: "4px",
            width: "max-content",
          }}
        >
          <p className="text-blue mb-0">FUND&TRACE IN 4 EASY STEPS</p>
        </div>
        <div className="d-none d-md-block w-100">
          <Carousel
            showThumbs={false}
            autoPlay
            infiniteLoop
            showStatus={false}
            renderArrowPrev={(onClickHandler, hasPrev, label) =>
              hasPrev && (
                <button
                  className="prevBtn"
                  type="button"
                  onClick={onClickHandler}
                  title={label}
                >
                  <img
                    src="/images/icons/back.svg"
                    width="20px"
                    height="15px"
                    alt="backbutton"
                  />
                </button>
              )
            }
            renderArrowNext={(onClickHandler, hasNext, label) =>
              hasNext && (
                <button
                  className="nextBtn"
                  type="button"
                  onClick={onClickHandler}
                  title={label}
                >
                  <img
                    src="/images/icons/back.svg"
                    width="20px"
                    height="15px"
                    alt="frontbutton"
                    style={{ transform: "rotate(180deg)" }}
                  />
                </button>
              )
            }
          >
            {slides.map((num, i) => (
              <div
                className="mx-auto d-flex flex-column align-items-center slideshow"
                key={i}
              >
                <div className="d-flex align-items-center mb-4">
                  <div
                    className="d-flex align-items-center justify-content-center bg-dark mr-3"
                    style={{ borderRadius: "50%", width: 40, height: 40 }}
                  >
                    <p className="mb-0 text-white" style={{ fontWeight: 600 }}>
                      {i + 1}
                    </p>
                  </div>
                  <p
                    className="mb-0"
                    style={{ fontWeight: 500, color: "black" }}
                  >
                    {num}
                  </p>
                </div>
                <img
                  src={`${images[i]}`}
                  alt="fundandtrace explanation"
                  width="100%"
                  style={{ height: "100%" }}
                />
              </div>
            ))}
          </Carousel>
        </div>
        <div className="d-md-none w-100">
          <img
            src="https://res.cloudinary.com/wisdomosara/image/upload/v1627290923/explainMobile1_i3zsgc.png"
            alt="fundandtrace explanation"
            width="100%"
          />
          <img
            src="https://res.cloudinary.com/wisdomosara/image/upload/v1627290927/explainMobile2_opdtog.png"
            alt="fundandtrace explanation"
            width="100%"
          />
          <img
            src="https://res.cloudinary.com/wisdomosara/image/upload/v1627290935/explainMobile3.png"
            alt="fundandtrace explanation"
            width="100%"
          />
          <img
            src="/images/mobile.png"
            alt="fundandtrace explanation"
            width="100%"
          />
        </div>
      </section>
    </Wrapper>
  );
}

const Wrapper = styled.section`
  background: #f9f9f9;
  section {
    max-width: 1440px;
    padding: 100px 100px 90px 100px;
    @media screen and (max-width: 767px) {
      padding: 50px 15px;
    }
    @media screen and (min-width: 768px) and (max-width: 1232px) {
      padding: 100px 50px 90px 50px;
    }
    .slideshow {
      @media screen and (min-width: 768px) and (max-width: 1149px) {
        width: calc(100% - 100px);
      }
      width: 950px;
    }
    .carousel-slider {
      padding-bottom: 50px;
      .prevBtn {
        position: absolute;
        z-index: 1000;
        border: none;
        background: transparent;
        outline: none;
        top: 50%;
        opacity: 1;
        left: 20px;
      }
      .nextBtn {
        z-index: 1000;
        border: none;
        background: transparent;
        position: absolute;
        outline: none;
        top: 50%;
        opacity: 1;
        right: 20px;
      }
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
  }
`;
