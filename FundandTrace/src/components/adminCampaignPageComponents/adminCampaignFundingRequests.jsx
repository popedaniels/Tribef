import React from "react";
import styled from "styled-components";
import PaymentHistoryCard from "../PaymentHistoryCard/PaymentHistoryCard";

export default function AdminCampaignFundingRequest({
  fundingRequests,
  campaignDetail,
  campaign,
  reload,
}) {
  return (
    <Wrapper className="mx-auto">
      {fundingRequests?.length ? (
        fundingRequests.map((fundingRequest, i) => (
          <PaymentHistoryCard
            fundingRequest={{ ...fundingRequest, campaign: campaign }}
            campaignDetail={campaignDetail}
            key={i}
            last={i == fundingRequests.length - 1 && "last"}
            admin
            reload={reload}
          />
        ))
      ) : (
        <div>
          <h2 className="text-heading text-center"> No Funding Request Yet!</h2>
        </div>
      )}
    </Wrapper>
  );
}

const Wrapper = styled.section`
  max-width: 670px;
`;
