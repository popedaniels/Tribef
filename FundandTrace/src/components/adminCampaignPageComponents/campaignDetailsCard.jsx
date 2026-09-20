import Link from "next/link";
import React from "react";
import styled from "styled-components";
import { addCommaToNumber } from "../helperFunctions/helperFunctions";

export default function CampaignDetailsCard({ campaign, index }) {
  return (
    <Link href={`/admin/campaign/${campaign?._id}`} passHref>
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
        <div className="image mx-3" style={{ width: 110, height: 100 }}>
          <img
            src={campaign?.basicInformation?.campaignImage}
            alt="campaignImage"
            width="100%"
            height="100%"
            style={{ objectFit: "cover" }}
          />
        </div>
        <div className="id mx-3" style={{ width: 110, wordWrap: "break-word" }}>
          <p className="mb-0">{campaign?._id}</p>
        </div>
        <div className="title mx-3" style={{ width: 110 }}>
          <p className="mb-0">
            {campaign?.basicInformation?.campaignTitle?.substring(0, 30)}
            {campaign?.basicInformation?.campaignTitle?.length > 30 && "..."}
          </p>
        </div>
        <div className="category mx-3" style={{ width: 110 }}>
          <p className="mb-0 text-capitalize">{campaign?.category}</p>
        </div>
        <div className="organizer mx-3" style={{ width: 110 }}>
          <p className="mb-0">{campaign?.organizer}</p>
        </div>
        <div className="ending mx-3" style={{ width: 110 }}>
          <p className="mb-0">
            {campaign?.funding?.currency == "USD"
              ? "$"
              : campaign?.funding?.currency == "GBP"
              ? "£"
              : "₦"}
            {addCommaToNumber(campaign?.funding?.availableBalance)}
          </p>
        </div>
        <div className="raised mx-3" style={{ width: 110 }}>
          <p className="mb-0">
            {campaign?.funding?.currency == "USD"
              ? "$"
              : campaign?.funding?.currency == "GBP"
              ? "£"
              : "₦"}
            {addCommaToNumber(campaign?.funding?.amountRaised)}
          </p>
        </div>
        <div className="progress mt-2" style={{ width: 110 }}>
          <div
            className="progress-bar"
            role="progressbar"
            style={{
              width: `${
                (campaign?.funding?.amountRaised /
                  campaign?.funding?.amountExpected) *
                100
              }%`,
            }}
            aria-valuemin="0"
            aria-valuemax="100"
          ></div>
        </div>
      </Wrapper>
    </Link>
  );
}

const Wrapper = styled.article`
  width: 100%;
  padding: 22px 25px;
  border-top: 0.5px solid #cccccc;
  p {
    color: #998a8a;
    font-size: 14px;
  }
  .progress {
    height: 5px !important;
    background-color: #697af821 !important;
  }
  .progressbar {
    background-color: var(--color-primary) !important;
  }
`;
