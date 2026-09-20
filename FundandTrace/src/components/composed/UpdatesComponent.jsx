import React from "react";
import styled from "styled-components";

export default function UpdateComponent({ update }) {
  return (
    <Wrapper className="mb-4">
      <div
        className="d-flex align-items-baseline pb-1 mb-2 heading"
        style={{
          width: "max-content",
        }}
      >
        <h2 className="text-heading-medium mb-0 mr-2">
          {new Date(update?.datePosted).toDateString()},{" "}
          <span className="mb-0"> posted by {update?.addedBy}(Organizer)</span>
        </h2>
      </div>

      <p>{update?.story}</p>
      {/* <img src="/images/larry.jpg" alt="update Image" /> */}
    </Wrapper>
  );
}

const Wrapper = styled.div`
  padding: 0 !important;
  width: 100%;
  .heading {
    width: max-content;
    max-width: 100%;
    h2 {
      font-size: 17px;
      word-break: break-word;
    }
    span {
      font-weight: 400;
      font-size: 15px;
    }
  }
  p {
    font-size: 16px;
    font-weight: 400;
    color: black;
  }

  img {
    width: 250px;
    height: 200px;
    object-fit: cover;
    margin-bottom: 20px;
  }
`;
