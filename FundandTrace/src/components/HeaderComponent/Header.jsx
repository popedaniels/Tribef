import Navbar from "../Navbar/Navbar";
import styles from "./Header.module.scss";
import { useState } from "react";
import ExploreModal from "../Navbar/Explore/ExploreModal";

/**
 * @param {{height?: any, imgHeight?: any, image?: any, smallText?: any, button?: any, blueText?: any, headingText?: any, paddingBottom?: any, imgMarginBottom?: any, paddingTop?: any, noMarginBottom?: any, imgWidth?: any, category?: any}} props
 */
export default function Header({
  height = undefined,
  imgHeight = undefined,
  image = undefined,
  smallText = undefined,
  button = false,
  blueText = undefined,
  headingText = undefined,
  paddingBottom = undefined,
  imgMarginBottom = undefined,
  paddingTop = undefined,
  noMarginBottom = false,
  imgWidth = undefined,
  category = undefined,
}) {
  return (
    <div
      className={styles.container}
      style={{ marginBottom: noMarginBottom ? 0 : "" }}
    >
      <div
        className={styles.hero}
        style={{
          paddingBottom: paddingBottom,
          height: height,
        }}
      >
        <div>
          <div className="">
            <Navbar />
          </div>
          <div
            className={[styles.slide, "relative custom-container"].join(" ")}
          >
            <div
              className={[
                styles.slide_left,
                "w-50",
                `${!image ? "mx-auto pr-md-0" : ""}`,
              ].join(" ")}
              style={{
                marginBottom: !image ? "80px" : "0px",
                paddingTop: paddingTop,
              }}
            >
              {blueText && (
                <p
                  className={`text-blue text-center ${
                    image ? "text-md-left" : ""
                  }`}
                >
                  {blueText}
                </p>
              )}
              <div>
                {headingText && (
                  <h3
                    className={`text-heading text-center ${
                      image ? "text-md-left" : ""
                    }`}
                  >
                    {headingText}
                  </h3>
                )}
                {smallText && (
                  <p
                    className={[
                      styles.campaign_text,
                      `text-center ${image ? "text-md-left" : ""}`,
                    ].join(" ")}
                  >
                    {smallText}
                  </p>
                )}
              </div>
              {button && (
                <button
                  className={[
                    styles.button,
                    "d-flex align-items-center justify-content-center px-3 btn py-2 text-white rounded",
                  ].join(" ")}
                >
                  <p className="mb-0">Start a Campaign</p>
                </button>
              )}
            </div>
            {image && (
              <div
                className={styles.slide_right}
                style={{ width: !image ? 0 : "50%" }}
              >
                {image && (
                  <img
                    src={image}
                    alt="heroslide"
                    width="100%"
                    style={{
                      height: imgHeight,
                      marginBottom: imgMarginBottom,
                      width: imgWidth,
                    }}
                    className={styles.slide_img}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
