import React from "react";
import styled from "styled-components";

export default function AdminFundingDetails({ campaign, card }) {
  return (
    <Wrapper className="mx-auto pb-5">
      <h2>Bank Information</h2>
      <article className="d-flex justify-content-between">
        <div>
          <h3 className="mb-3">Bank Name</h3>
          <p className="mb-5">{campaign?.bankName}</p>
          <h3 className="mb-3">Account Number</h3>
          <p className="mb-5">{campaign?.accountNumber}</p>
        </div>
        <div>
          <h3 className="mb-3">Account Name</h3>
          <p className="mb-5">{campaign?.accountName}</p>
        </div>
        <div>
          <h3 className="mb-3">Identification</h3>
          <img
            src={card}
            alt="id card image"
            width="305px"
            height="225px"
            className="mt-2"
          />
        </div>
      </article>
    </Wrapper>
  );
}

const Wrapper = styled.section`
  width: 95%;
  h2 {
    font-style: normal;
    font-weight: 600;
    font-size: 18px;
    line-height: 28px;
    /* identical to box height, or 175% */

    color: #514949;
  }
  article {
    div {
      width: 30%;
      h3 {
        font-style: normal;
        font-weight: 500;
        font-size: 16px;
        line-height: 28px;
        color: #514949;
      }
    }
  }
`;
