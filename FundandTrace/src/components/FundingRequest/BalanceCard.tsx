import React from "react";
import { addCommaToNumber } from "../../components/helperFunctions/helperFunctions";
import type { FundingCampaign } from "../../types/fundingRequest";

interface Props {
  campaign: FundingCampaign | null;
}

export const BalanceCard: React.FC<Props> = ({ campaign }) => (
  <div className="debitCard px-md-3 px-3 py-md-4 py-4 d-flex flex-md-row flex-column align-items-center justify-content-between">
    <div className="mr-md-3 mb-md-0 mb-4">
      <p className="mb-3 text-xs">NET BALANCE</p>
      <h2 className="mb-4 text-bigger">
        {Math.round(Number(campaign?.funding?.availableBalance))}{" "}
        <span style={{ fontWeight: 300, fontSize: 16 }}>{campaign?.funding?.currency}</span>
      </h2>
      <div className="d-flex align-items-center">
        <div className="d-flex align-items-start mr-2">
          <img src="/images/icons/donationUp.svg" width={12} height={12} alt="upIcon" />
          <div className="ml-3">
            <p className="mb-2 text-donations">
              {campaign?.funding?.currency == "USD" ? "$" : campaign?.funding?.currency == "GBP" ? "£" : "₦"}
              {Math.round(Number(campaign?.funding?.amountRaised))}
            </p>
            <p className="mb-0 text-blur">donations</p>
          </div>
        </div>
        <div className="d-flex align-items-start">
          <img src="/images/icons/donationDown.svg" width={12} height={12} alt="downIcon" />
          <div className="ml-3">
            <p className="mb-2 text-donations">
              {campaign?.funding?.currency == "USD" ? "$" : campaign?.funding?.currency == "GBP" ? "£" : "₦"}
              {addCommaToNumber(Number(campaign?.funding?.amountRaised) - Number(campaign?.funding?.availableBalance))}
            </p>
            <p className="mb-0 text-blur">expenses paid</p>
          </div>
        </div>
      </div>
    </div>
    <img src="/images/balance.png" alt="creditCard" width={220} height={140} />
  </div>
);

export const IdCard: React.FC<{ idImage?: string }> = ({ idImage }) => (
  <div className="idCard">
    <div className="d-flex align-items-center justify-content-between mb-3">
      <p className="mb-0 text-small">Your ID</p>
      <p className="text-blue mb-0">Change</p>
    </div>
    <img src={idImage} alt="" />
  </div>
);
