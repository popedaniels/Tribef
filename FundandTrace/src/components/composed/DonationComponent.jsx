import React from "react";
import { getCurrency, getTimeDiff } from "../helperFunctions/helperFunctions";

export default function DonationComponent({ donation, index, campaign }) {
  return (
    <div className="mb-4 d-flex align-items-start">
      <h5 className="mb-0" style={{ width: 30 }}>
        {index + 1}
      </h5>
      <div className="d-flex flex-column ml-2">
        <div className="d-flex align-items-center " style={{ width: 240 }}>
          <img
            src="/images/icons/profile.svg"
            width={24}
            height={24}
            alt="profile"
          />
          <p className="ml-2 mb-0" style={{ fontWeight: 400 }}>
            {donation?.donorName}
          </p>
        </div>

        <div className="d-flex aligm-items-center mt-3">
          <p className="mb-0 text-small">
            {getCurrency(campaign?.funding?.currency)}
            {Math.round(donation?.amount)}
          </p>
          <p className="mb-0 ml-2 text-small">
            {" "}
            - {getTimeDiff(donation?.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
}
