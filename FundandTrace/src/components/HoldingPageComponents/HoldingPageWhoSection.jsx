import React from "react";
import styled from "styled-components";

export default function HoldingPageWhoSection() {
  return (
    <Wrapper>
      <section className="d-flex flex-column align-items-center justify-content-center mx-auto">
        {/* <img
          src="https://res.cloudinary.com/wisdomosara/image/upload/v1627293791/who-min_1_wphawd.png"
          alt="video"
          width="100%"
          className="d-none d-md-block shadow"
        />
        <img
          src="https://res.cloudinary.com/wisdomosara/image/upload/v1627290947/whoMobile.png"
          alt="video"
          width="100%"
          className="d-md-none shadow"
        /> */}
        <Iframe>
          <iframe
            className="iframe"
            src={"https://www.youtube.com/embed/orkLdsVxd5s"}
          ></iframe>
        </Iframe>
      </section>
    </Wrapper>
  );
}

const Iframe = styled.div`
  min-width: 100%;
  .iframe {
    min-width: 100%;
    max-width: 100%;
    height: 600px;
    @media screen and (max-width: 767px) {
      width: 100%;
      height: 300px;
    }
  }
`;

const Wrapper = styled.section`
  section {
    max-width: 1440px;
    padding: 100px 100px;
    @media screen and (max-width: 767px) {
      padding: 100px 15px;
    }
    @media screen and (min-width: 768px) and (max-width: 1232px) {
      padding: 100px 50px;
    }
  }
`;
