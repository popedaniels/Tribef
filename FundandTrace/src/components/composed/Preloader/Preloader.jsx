import React from "react";
import styled from "styled-components";

export default function Preloader({ comingSoon = false, isVisible = true }) {
  if (!isVisible) {
    return null;
  }

  return (
    <Wrapper
      style={{ width: "100vw", height: "100vh", background: "white" }}
      className="d-flex flex-column justify-content-center align-items-center"
    >
      <img src="/images/logo.png" width={102} height={77} alt="Fund&Trace" />
      {comingSoon && (
        <h4 className="text-center mt-4">We are cooking something</h4>
      )}
    </Wrapper>
  );
}

const Wrapper = styled.section`
  position: fixed;
  z-index: 100000000;
  top: 0;
  img {
    animation: pulse infinite 1s cubic-bezier(0.4, 0, 0.6, 1);
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
`;
