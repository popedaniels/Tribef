import Link from "next/link";
import React from "react";
import styled from "styled-components";

export default function AdminFundingRequestDetailsCard({
  fundingRequest,
  campaign,
  index,
}) {
  return (
    <Link href={`/admin/fundingRequest/${fundingRequest?._id}`} passHref>
      <Wrapper
        className="d-flex"
        style={{
          cursor: "pointer",
          background: index % 2 == 0 ? "#f9f9f9" : "white",
        }}
      >
        <div className="check mr-2" style={{ width: 20 }}>
          <input type="checkbox" name="campaign" id="campaign" />
        </div>
        <div className="image mx-3" style={{ width: 110 }}>
          <img
            src={campaign?.basicInformation?.campaignImage}
            alt="campaignImage"
            width="100%"
          />
        </div>
        <div
          className="id mx-3"
          style={{ maxWidth: 150, width: 150, wordWrap: "break-word" }}
        >
          <p className="mb-0">{fundingRequest?.campaignId}</p>
        </div>
        <div className="title mx-3" style={{ width: 150 }}>
          <p className="mb-0">{campaign?.basicInformation?.campaignTitle}</p>
        </div>
        <div className="category mx-3" style={{ width: 150 }}>
          <p className="mb-0 text-capitalize">{fundingRequest?.fundingType}</p>
        </div>
        <div className="organizer mx-3" style={{ width: 150 }}>
          <p className="mb-0">{campaign?.organizer}</p>
        </div>
        <div className="ending mx-3" style={{ width: 110 }}>
          <p className="mb-0">{fundingRequest?.status}</p>
        </div>
        <div className="raised mx-3" style={{ width: 150 }}>
          <p className="mb-0">
            {fundingRequest?.currency == "USD"
              ? "$"
              : fundingRequest?.currency == "GBP"
              ? "£"
              : "₦"}
            {fundingRequest?.amount}
          </p>
        </div>
      </Wrapper>
    </Link>
  );
}

const Wrapper = styled.article`
  width: 100%;
  padding: 22px 25px;
  border-top: 0.5px solid #cccccc;
  div {
    box-sizing: border-box;
  }
  p {
    color: #998a8a;
    font-size: 14px;
  }
`;
