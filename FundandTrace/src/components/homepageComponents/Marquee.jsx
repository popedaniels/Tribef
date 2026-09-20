import React from "react";
import styled from "styled-components";
import Marquee from "react-fast-marquee";

export default function MarqueeSection() {
  return (
    <Wrapper>
      <div className="d-md-none">
        <Marquee className="d-flex align-items-center w-100" gradientWidth={50}>
          {[1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5].map(
            (marq, i) => (
              <img
                key={`${marq}-${i}`}
                src={`/images/mar${marq}.png`}
                height="50px"
                alt="marquee Element"
                className={`mr-5`}
              />
            )
          )}
        </Marquee>
      </div>
      <div className="d-none d-md-block">
        <Marquee className="d-flex align-items-center w-100" gradientWidth={50}>
          {[1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5].map(
            (marq, i) => (
              <img
                key={`${marq}-${i}`}
                src={`/images/mar${marq}.png`}
                height="80px"
                alt="marquee Element"
                className={`mr-5`}
              />
            )
          )}
        </Marquee>
      </div>
    </Wrapper>
  );
}

const Wrapper = styled.section`
  margin-bottom: 144px;
  // @media screen and (max-width: 767px) {
  //   margin-bottom: 80px;
  // }
`;
