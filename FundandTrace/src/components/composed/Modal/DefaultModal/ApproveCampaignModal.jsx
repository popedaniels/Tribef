import React from "react";
import DefaultModal from "./DefaultModal";
import styled from "styled-components";
import { useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import Spinner from "../../spinner/Spinner";
import { config } from "../../../helperFunctions/helperFunctions";
import { getApiBaseUrl } from "../../../../utils/api";

export default function ApproveCampaignModal({
  onModalClose,
  showModal,
  fundingRequest,
  reload,
  organizer = undefined,
}) {
  const [step, setStep] = useState("0");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const first = fundingRequest?.firstApproval?.adminId ? fundingRequest.firstApproval : null;

  const handleApprove = async () => {
    setLoading(true);

    try {
      const res = await axios.patch(
        `${getApiBaseUrl()}/api/admin/fundingRequest/approve/${fundingRequest?._id}`,
        { campaignId: fundingRequest?.campaign?._id },
        config()
      );
      setLoading(false);
      setError("");
      // 202 = first of two approvals recorded; no money has moved yet.
      setMessage(res.status === 202 ? res.data?.data || "First approval recorded. A second admin must approve." : "Funding Request has been approved");
      setStep("1");
    } catch (err) {
      setLoading(false);
      setError(err?.response?.data?.error || "Approval failed. Nothing was paid. Please try again.");
    }
  };

  return (
    <DefaultModal
      onModalClose={onModalClose}
      showModal={showModal}
      onBlur={onModalClose}
    >
      <Wrapper className="d-flex flex-column p-4">
        {step == "0" ? (
          <>
            {" "}
            <h2 className="text-medium-heading mb-3">
              Approve Funding Request
            </h2>
            <p className="text-small mb-5">
              Are you sure you want to disburse{" "}
              <b>{`${fundingRequest?.amount} ${fundingRequest?.currency}`}</b>{" "}
              to {`${fundingRequest?.campaign?.organizer}`} for the{" "}
              {`“${fundingRequest?.campaign?.basicInformation?.campaignTitle}"`}{" "}
              campaign?
            </p>
            {first && (
              <p className="text-small mb-4" style={{ background: "#fff7ed", padding: "8px 12px", borderRadius: 8 }}>
                First approval by <b>{first.adminName || "another admin"}</b>
                {first.at ? ` on ${new Date(first.at).toLocaleString("en-GB")}` : ""}. Your approval releases the payout.
              </p>
            )}
            {error && (
              <p className="text-small mb-4" role="alert" style={{ color: "#b91c1c" }}>
                {error}
              </p>
            )}
            <div className="d-flex ml-auto">
              <button className="btn cancelBtn" onClick={onModalClose}>
                Cancel
              </button>
              <button className="btn approveBtn ml-4" onClick={handleApprove}>
                {loading ? (
                  <Spinner
                    type="TailSpin"
                    width={20}
                    height={20}
                    color={"white"}
                  />
                ) : (
                  <p className="mb-0 text-white">Approve</p>
                )}
              </button>
            </div>
          </>
        ) : (
          <div className="d-flex flex-column justify-content-center align-items-center">
            <h2 className="text-center text-medium-heading my-5" role="status">
              {message || "Funding Request has been approved"}
            </h2>
            <button
              className="text-white btn"
              style={{
                background: "var(--color-primary)",
                borderRadius: "4px",
                width: 124,
                height: 36,
                outline: "none",
              }}
              onClick={() => {
                reload();
                onModalClose();
              }}
            >
              Continue
            </button>
          </div>
        )}
      </Wrapper>
    </DefaultModal>
  );
}

const Wrapper = styled.section`
  width: 619px;
  @media screen and (max-width: 767px) {
    width: 90vw;
    padding: 50px 20px;
  }
  padding: 50px 0;
  h2 {
    width: 300px;
    @media screen and (max-width: 767px) {
      width: 100%;
    }
  }
  p {
    font-style: normal;
    font-weight: 400;
    font-size: 16px;
    line-height: 27px;
    /* identical to box height, or 169% */

    color: black;
  }

  .approveBtn {
    background: var(--color-primary);
    border-radius: 4px;
    font-style: normal;
    font-weight: 500;
    font-size: 14px;
    outline: none;
    border: none;
    line-height: 143%;
    text-align: center;
    width: 124px;
    height: 36px;
    color: #ffffff;
  }

  .cancelBtn {
    background: #f0f1fe;
    border: 0.5px solid var(--color-primary);
    box-sizing: border-box;
    border-radius: 4px;
    font-style: normal;
    font-weight: normal;
    font-size: 14px;
    line-height: 16px;
    text-align: center;
    outline: none;
    width: 124px;
    height: 36px;
    color: var(--color-primary);
  }
`;
