import axios from "axios";
import Link from "next/link";
import React from "react";
import { useDispatch } from "react-redux";
import styled from "styled-components";
import { toast } from "../../../store/slices/ToastSlice";
import { addCommaToNumber } from "../helperFunctions/helperFunctions";
import { config } from "../helperFunctions/helperFunctions";

const RefundsDetailsCard = ({ donation, index, single }) => {
  const dispatch = useDispatch();
  const handleRefund = async () => {
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/refunds/stripeRefund/${donation?.campaignId?._id}/${donation._id}`,
        {},
        config()
      );
      res && dispatch(toast(true, res?.data?.message, "success"));
    } catch (error) {
      dispatch(toast(true, error?.response?.data?.error, "error"));
    }
  };

  const handleRefundBatch = async () => {
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/refunds/stripeRefundBatch/${donation?._id}`,
        {},
        config()
      );
      res && dispatch(toast(true, res?.data?.message, "success"));
    } catch (error) {
      dispatch(toast(true, error?.response?.data?.error, "error"));
    }
  };

  return (
    <Wrapper
      className="d-flex"
      style={{
        cursor: "pointer",
        background: index % 2 == 0 ? "#f9f9f9" : "white",
      }}
    >
      <div className="id mr-3" style={{ width: 150, wordWrap: "break-word" }}>
        <p className="mb-0 text-left">
          {single ? donation?.campaignId?._id : donation?._id}
        </p>
      </div>
      <div className="title mr-3" style={{ width: 150 }}>
        <p className="mb-0 text-left">
          {(single
            ? donation?.campaignId?.basicInformation?.campaignTitle
            : donation?.basicInformation?.campaignTitle
          )?.substring(0, 30)}
          {(single
            ? donation?.campaignId?.basicInformation?.campaignTitle
            : donation?.basicInformation?.campaignTitle
          )?.length > 30 && "..."}
        </p>
      </div>
      <div className="category mr-3" style={{ width: 150 }}>
        <p className="mb-0 text-left text-capitalize">
          {single ? donation?.paymentOption : "Cards"}
        </p>
      </div>
      <div className="organizer mr-3" style={{ width: 200 }}>
        <p className="mb-0 text-left">{donation?.createdAt}</p>
      </div>
      <div className="ending mr-3" style={{ width: 110 }}>
        <p className="mb-0 text-left">
          {donation?.campaignId?.funding?.currency == "USD"
            ? "$"
            : donation?.campaignId?.funding?.currency == "GBP"
            ? "£"
            : "₦"}
          {addCommaToNumber(
            single ? donation?.amount : donation?.funding?.availableBalance
          )}
        </p>
      </div>
      <div className="raised mr-3" style={{ width: 110 }}>
        <p className="mb-0 text-left">
          {single
            ? donation?.refund?.status == "succeeded"
              ? "Refunded"
              : "Donated"
            : donation?.funding?.refunded
            ? "Refunded"
            : "Funded"}
        </p>
      </div>
      <div className="" style={{ width: 200 }}>
        <button
          style={{ height: 40 }}
          onClick={single ? handleRefund : handleRefundBatch}
        >
          {single ? "Refund" : "Batch Refund"}
        </button>
      </div>
    </Wrapper>
  );
};

const Wrapper = styled.article`
  width: 100%;
  padding: 22px 25px;
  border-top: 0.5px solid #cccccc;
  p {
    color: #998a8a;
    font-size: 14px;
  }
  div {
    box-sizing: border-box;
  }
`;

export default RefundsDetailsCard;
