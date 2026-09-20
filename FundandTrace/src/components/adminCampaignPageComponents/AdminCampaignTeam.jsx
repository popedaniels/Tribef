import React from "react";
import styled from "styled-components";

export default function AdminCampaignTeam({ campaign }) {
  return (
    <Wrapper className="mx-auto">
      <h2>Primary Contact</h2>
      <article className="d-flex justify-content-between">
        <div>
          <h3 className="mb-3">First Name</h3>
          <p className="mb-5">{campaign?.primaryContact?.firstName}</p>
          <h3 className="mb-3">Date of Birth</h3>
          <p className="mb-5">{campaign?.primaryContact?.dateOfBirth}</p>
          <h3 className="mb-3">Country</h3>
          <p className="mb-5">{campaign?.primaryContact?.country}</p>
        </div>
        <div>
          <h3 className="mb-3">Last Name</h3>
          <p className="mb-5">{campaign?.primaryContact?.lastName}</p>
          <h3 className="mb-3">Phone Number</h3>
          <p className="mb-5">{campaign?.primaryContact?.phoneNumber}</p>
          <h3 className="mb-3">Street Address</h3>
          <p className="mb-5">{campaign?.primaryContact?.streetAddress}</p>
        </div>
        <div>
          <h3 className="mb-3">Identification</h3>
          <img
            src={campaign?.primaryContact?.idImage}
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
