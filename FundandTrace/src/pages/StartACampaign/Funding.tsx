import React, { useEffect } from "react";
import { useRouter } from "next/router";
import StartLayout from "./StartLayout";
import { useState } from "react";
import styled from "styled-components";
import { useSelector } from "react-redux";

import {
  loadStartCampaign,
  selectStartCampaignState,
  startCampaignActions,
} from "../../../store/slices/startCampaignSlice";
import axios from "axios";
import { logout, selectAuthStateState } from "../../../store/slices/authSlice";
import { toast } from "../../../store/slices/ToastSlice";
import { useAppDispatch } from "./../../../store/hooks";
import {
  grabErrorMessage,
  grabErrorStatus,
} from "../../components/helperFunctions/helperFunctions";

export default function Funding() {
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const dispatch = useAppDispatch();
  const { startCampaign } = useSelector(selectStartCampaignState);
  const [campaignId, setCampaignId] = useState("");
  const { authenticated } = useSelector(selectAuthStateState);

  useEffect(() => {
    !authenticated && router.push("/SignUp");
  }, [authenticated, router]);

  useEffect(() => {
    const storedCampaignId = localStorage.getItem("campaignId") || "";
    setCampaignId(storedCampaignId);
    dispatch(loadStartCampaign(storedCampaignId));
  }, [dispatch]);

  const handleSubmit = async () => {
    try {
      const res = await axios.post(
        process.env.NEXT_PUBLIC_API_URL + "/api/startCampaign/funding",
        { funding: startCampaign?.funding, id: campaignId },
        { withCredentials: true }
      );

      res && router.push("/StartACampaign/Settings");
    } catch (error) {
      dispatch(toast(true, grabErrorMessage(error), "error"));
      if (grabErrorStatus(error) == 403) {
        dispatch(logout());
      }
    }
  };
  return (
    <StartLayout active={4} page={"FUNDING"}>
      <div className="mb-5">
        <h2 className="text-heading mb-4">Funding</h2>
        <p className="mb-4">
          Please note that after campaign has ended, you would have to make a{" "}
          <span style={{ color: "black", textDecoration: "underline" }}>
            One-Off
          </span>{" "}
          or{" "}
          <span style={{ color: "black", textDecoration: "underline" }}>
            Monthly
          </span>{" "}
          funding request(s) and provide proof of funding for transparency to
          donors. This is our core at Fund&Trace.
        </p>
      </div>
      <div className="mb-5">
        <h2 className="text-medium mb-4">Campaign Goal Amount</h2>
        <p className="mb-4">
          How much money would you like to raise for this campaign?
        </p>
        <div className="d-flex money">
          <div
            className="d-flex align-items-center justify-content-center"
            style={{
              height: "50px",
              padding: "5px 15px",
              background: "#fafafa",
            }}
          >
            {startCampaign?.funding?.currency == "USD"
              ? "$"
              : startCampaign?.funding?.currency == "GBP"
              ? "£"
              : "₦"}
          </div>
          <input
            type="number"
            className="money-input"
            min="100"
            value={
              startCampaign?.funding?.amountExpected.toString().includes("-")
                ? ""
                : startCampaign?.funding?.amountExpected
            }
            onChange={(e) =>
              dispatch(
                startCampaignActions.setFunding({
                  amountExpected: e.target.value,
                })
              )
            }
            style={{ borderStyle: "none", outline: "none" }}
          />
          <div style={{ position: "relative" }}>
            <div
              onClick={() => setShowDropdown(!showDropdown)}
              className="d-flex align-items-center justify-content-center"
              style={{
                height: "50px",
                padding: "5px 15px",
                background: "#F2F2F2",
                border: "0.5px solid #C4C4C4",
                borderRadius: "0px 4px 4px 0px",
              }}
              role="button"
            >
              <p className="mb-0 mr-2">{startCampaign?.funding?.currency}</p>
              <img
                src="/images/icons/dropdown.svg"
                width={13}
                height={8}
                className="pt-0"
                alt="dropdown"
              />
            </div>
            <div
              style={{
                position: "absolute",
                top: "110%",
                display: showDropdown ? "block" : "none",
                width: "100%",
                zIndex: 5,
              }}
            >
              <ul className="currency-drop">
                <li
                  onClick={(e) => {
                    dispatch(
                      startCampaignActions.setFunding({
                        currency: (e.currentTarget as HTMLElement).innerText,
                      })
                    );
                    setShowDropdown(!showDropdown);
                  }}
                  role="button"
                >
                  USD
                </li>
                <li
                  onClick={(e) => {
                    dispatch(
                      startCampaignActions.setFunding({
                        currency: (e.currentTarget as HTMLElement).innerText,
                      })
                    );
                    setShowDropdown(!showDropdown);
                  }}
                  role="button"
                >
                  GBP
                </li>
                <li
                  onClick={(e) => {
                    dispatch(
                      startCampaignActions.setFunding({
                        currency: (e.currentTarget as HTMLElement).innerText,
                      })
                    );
                    setShowDropdown(!showDropdown);
                  }}
                  role="button"
                >
                  NGN
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-5">
        <div
          style={{
            borderBottom: "0.5px solid #B3B3B3",
          }}
        >
          <h2 className="text-medium mb-4">Bank Information</h2>
          <p className="mb-4">Fill out your bank account information.</p>
        </div>

        <Div className="d-flex mb-md-5 justify-content-between mt-4 flex-column flex-md-row">
          <div className="d-flex flex-column detailsRow">
            <h2 className="text-medium mb-4">Bank Name</h2>
            <input
              type="text"
              value={startCampaign?.funding?.bankName}
              onChange={(e) =>
                dispatch(
                  startCampaignActions.setFunding({
                    bankName: e.target.value,
                  })
                )
              }
            />
          </div>
          <div className="d-flex flex-column detailsRow">
            <h2 className="text-medium mb-4">Account Name</h2>
            <input
              type="text"
              value={startCampaign?.funding?.accountName}
              onChange={(e) =>
                dispatch(
                  startCampaignActions.setFunding({
                    accountName: e.target.value,
                  })
                )
              }
            />
          </div>
        </Div>

        <Div className="d-flex mb-md-5 justify-content-between mt-4 flex-column flex-md-row">
          <div className="d-flex flex-column detailsRow">
            <h2 className="text-medium mb-4">Account Number</h2>

            <input
              type="text"
              value={startCampaign?.funding?.accountNumber}
              onChange={(e) =>
                dispatch(
                  startCampaignActions.setFunding({
                    accountNumber: e.target.value,
                  })
                )
              }
            />
          </div>
          <div className="d-flex flex-column detailsRow">
            <h2 className="text-medium mb-4">Sort Code</h2>
            <input
              type="text"
              value={startCampaign?.funding?.sortCode}
              onChange={(e) =>
                dispatch(
                  startCampaignActions.setFunding({
                    sortCode: e.target.value,
                  })
                )
              }
            />
          </div>
        </Div>
      </div>

      <button className="btn text-white mobileBtn-full" onClick={handleSubmit}>
        Save and Continue
      </button>
    </StartLayout>
  );
}

const Div = styled.div`
  .detailsRow {
    width: 47%;
    @media screen and (max-width: 767px) {
      width: 100%;
      margin-bottom: 35px;
    }
  }
`;
