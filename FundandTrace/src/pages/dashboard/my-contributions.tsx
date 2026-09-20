import React, { useCallback, useEffect, useState } from "react";
import DashboardLayout from "./DashboardLayout";
import styled from "styled-components";
import Link from "next/link";
import axios from "axios";
import Spinner from "../../components/composed/spinner/Spinner";
import { useSelector } from "react-redux";
import { logout, selectAuthStateState } from "../../../store/slices/authSlice";
import CampaignCard from "../../components/CampaignCard/CampaignCard";
import {
  setSigningIn,
  setSignUpFailed,
} from "../../../store/slices/signUpSlice";
import {
  addCommaToNumber,
  grabErrorMessage,
  grabErrorStatus,
} from "../../components/helperFunctions/helperFunctions";
import { toast } from "../../../store/slices/ToastSlice";
import { useAppDispatch } from "./../../../store/hooks";
import type { Campaign } from "../../types/campaign";

interface Contribution {
  amount: number;
  createdAt: string | Date;
  refund?: {
    status?: string;
  };
  campaignId?: Campaign;
}

function ContributionCard({ campaign }: { campaign: Contribution }) {
  const progressString = (
    (Number(campaign?.campaignId?.funding?.amountRaised) /
      Number(campaign?.campaignId?.funding?.amountExpected)) *
    100
  ).toString();

  return (
    <Link href={`contribution/${campaign?.campaignId?._id}`} passHref>
      <Card
        className="w-100  d-flex bg-white flex-column flex-md-row align-items-center justify-content-between mb-5"
        style={{ cursor: "pointer" }}
      >
        <div className="left d-flex align-items-center py-3 pl-3 pl-md-4">
          <img
            src={campaign?.campaignId?.basicInformation?.campaignImage}
            width={99}
            height={125}
            style={{ objectFit: "cover" }}
            className="mr-4"
            alt="campaignImage"
          />
          <div className="left-progress mr-md-3">
            <h2 className="mb-2 mb-md-3 text-truncate">
              {campaign?.campaignId?.basicInformation?.campaignTitle}
            </h2>
            <div className="d-flex align-items-center mb-2 mb-md-3">
              <img
                src="/images/icons/profile.svg"
                width={16}
                height={16}
                alt="profile"
              />
              <p
                className="ml-3 mb-0"
                style={{ fontWeight: 400, fontSize: 12 }}
              >
                {campaign?.campaignId?.organizer}
              </p>
            </div>
            <div className="d-flex align-items-baseline">
              <h3 className="text-heading mr-2 mb-0" style={{ fontSize: 14 }}>
                {campaign?.campaignId?.funding?.currency == "USD"
                  ? "$"
                  : campaign?.campaignId?.funding?.currency == "GBP"
                  ? "£"
                  : "₦"}
                {addCommaToNumber(campaign?.campaignId?.funding?.amountRaised)}
              </h3>
              <p
                className="mb-0"
                style={{
                  fontWeight: "400",
                  color: "rgba(0,0,0,0.6)",
                  fontSize: 13,
                }}
              >
                raised of{" "}
                {campaign?.campaignId?.funding?.currency == "USD"
                  ? "$"
                  : campaign?.campaignId?.funding?.currency == "GBP"
                  ? "£"
                  : "₦"}
                {addCommaToNumber(
                  campaign?.campaignId?.funding?.amountExpected
                )}
              </p>
            </div>
            <div className={["progress mb-2"].join(" ")}>
              <div
                className={["progress-bar "].join(" ")}
                role="progressbar"
                style={{ width: progressString + "%" }}
                aria-valuenow={Number(progressString)}
                aria-valuemin={0}
                aria-valuemax={100}
              ></div>
            </div>
          </div>
        </div>
        <div className="right d-none d-md-flex align-items-center">
          <div className="mr-4 text-right">
            <p className="mb-3">
              {campaign?.refund?.status === "succeeded"
                ? "Refunded"
                : "Donated"}
            </p>
            <h2 className="mb-3">
              {campaign?.campaignId?.funding?.currency == "USD"
                ? "$"
                : campaign?.campaignId?.funding?.currency == "GBP"
                ? "£"
                : "₦"}
              {addCommaToNumber(campaign?.amount)}
            </h2>
            <p className="mb-0">
              {new Date(campaign?.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="right-arrow d-flex align-items-center justify-content-center">
            <img
              src="/images/icons/slidefrontgray.svg"
              width={8}
              height={13}
              alt="slideIcon"
            />
          </div>
        </div>
        <div
          className="right-mobile d-flex d-md-none w-100 px-3 py-2 align-items-center justify-content-between"
          style={{ background: "#fafafa" }}
        >
          <div className="text-left">
            <p className="mb-3">
              {campaign?.refund?.status === "succeeded"
                ? "Refunded"
                : "Donated"}
            </p>
            <h2 className="mb-3">
              {campaign?.campaignId?.funding?.currency == "USD"
                ? "$"
                : campaign?.campaignId?.funding?.currency == "GBP"
                ? "£"
                : "₦"}
              {addCommaToNumber(campaign?.amount)}
            </h2>
            <p className="mb-0">
              {new Date(campaign?.createdAt).toLocaleDateString()}
            </p>
          </div>
          <img
            src="/images/icons/slidefrontgray.svg"
            width={8}
            height={13}
            alt="slideIcon"
          />
        </div>
      </Card>
    </Link>
  );
}

const Card = styled.div`
  border-radius: 4px;
  box-shadow: 0 22px 20px -10px rgba(255, 255, 255, 0.07),
    0 4px 20px 0px rgba(0, 0, 0, 0.06), 0 7px 8px -5px rgba(255, 255, 255, 0.2);
  .left {
    @media screen and (max-width: 767px) {
      width: 100%;
    }
    .left-progress {
      h2 {
        word-break: break-all;
        font-style: normal;
        font-weight: 500;
        font-size: 14px;
        line-height: 24px;
        /* identical to box height, or 171% */

        color: #807373;
      }
      width: 255px;
      @media screen and (max-width: 767px) {
        width: calc(100% - 99px - 20px);
        padding-right: 15px;
      }
    }
  }
  .right {
    p {
      font-style: normal;
      font-weight: normal;
      font-size: 12px;
      line-height: 18px;
      /* identical to box height, or 150% */

      color: #a3a3a3;
    }
    h2 {
      font-style: normal;
      font-weight: bold;
      font-size: 18px;
      line-height: 18px;
      /* identical to box height, or 100% */

      color: #000000;
    }
    .right-arrow {
      background: #fafafa;
      border-radius: 0px 4px 4px 0px;
      width: 68px;
      height: 165px;
    }
  }
  .right-mobile {
    p {
      font-style: normal;
      font-weight: normal;
      font-size: 12px;
      line-height: 18px;
      /* identical to box height, or 150% */

      color: #a3a3a3;
    }
    h2 {
      font-style: normal;
      font-weight: bold;
      font-size: 18px;
      line-height: 18px;
      /* identical to box height, or 100% */

      color: #000000;
    }
  }
`;

export default function MyContributions() {
  const [campaigns, setCampaigns] = useState<Contribution[]>([]);
  const { profile } = useSelector(selectAuthStateState);
  const [loading, setLoading] = useState(false);
  const [NGN, setNGN] = useState(0);
  const [USD, setUSD] = useState(0);
  const [GBP, setGBP] = useState(0);
  const dispatch = useAppDispatch();

  const getContributions = useCallback(async () => {
    try {
      setLoading(true);
      const campaigns = await axios.get<{ contributions: Contribution[] }>(
        process.env.NEXT_PUBLIC_API_URL +
          "/api/auth/contributions/" +
          profile.email,
        { withCredentials: true }
      );
      campaigns && setCampaigns(campaigns.data.contributions);
      const USD = await campaigns.data.contributions
        .filter(
          (contribution) =>
            contribution?.campaignId?.funding?.currency === "USD" &&
            contribution?.refund?.status !== "succeeded"
        )
        .reduce((acc, cur) => {
          return acc + cur?.amount;
        }, 0);

      setUSD(USD);
      const GBP = await campaigns.data.contributions
        .filter(
          (contribution) =>
            contribution?.campaignId?.funding?.currency === "GBP" &&
            contribution?.refund?.status !== "succeeded"
        )
        .reduce((acc, cur) => {
          return acc + cur?.amount;
        }, 0);

      setGBP(GBP);

      const NGN = await campaigns.data.contributions
        .filter(
          (contribution) =>
            contribution?.campaignId?.funding?.currency === "NGN" &&
            contribution?.refund?.status !== "succeeded"
        )
        .reduce((acc, cur) => {
          return acc + cur?.amount;
        }, 0);

      setNGN(NGN);
      campaigns && setLoading(false);
    } catch (error) {
      dispatch(toast(true, grabErrorMessage(error), "error"));
      if (grabErrorStatus(error) == 403) {
        dispatch(logout());
      }
    }
  }, [profile, dispatch]);

  useEffect(() => {
    getContributions();
  }, [getContributions]);

  return (
    <DashboardLayout active={2} page="My contributions">
      <div className="custom-container">
        <Section className="my-5 d-flex flex-column align-items-center justify-content-center mx-auto">
          <h2 className="mb-3">My Contributions</h2>
          {USD > 0 && (
            <h3 className="text-medium">TOTAL: USD {addCommaToNumber(USD)}</h3>
          )}
          {GBP > 0 && (
            <h3 className="text-medium">TOTAL: GBP {addCommaToNumber(GBP)}</h3>
          )}
          {NGN > 0 && (
            <h3 className="text-medium">TOTAL: NGN {addCommaToNumber(NGN)}</h3>
          )}
          {loading ? (
            <Spinner type="Oval" width={50} height={50} color={" var(--color-primary)"} />
          ) : campaigns.length ? (
            <div className="mt-4 card-wrapper">
              {campaigns.reverse().map((campaign, i) => (
                <ContributionCard key={i} campaign={campaign} />
              ))}
            </div>
          ) : (
            <div className="d-flex flex-column align-items-center justify-content-center">
              <h2 className="text-heading text-center">
                You have not made any donations yet!
              </h2>

              <img
                src="/images/noDonations.png"
                alt="noDonations"
                className="image"
              />
            </div>
          )}
        </Section>
      </div>
    </DashboardLayout>
  );
}

const Section = styled.section`
  .card-wrapper {
    @media screen and (max-width: 767px) {
      width: 100%;
    }
  }
  h2 {
    font-style: normal;
    font-weight: bold;
    font-size: 18px;
    line-height: 24px;
    /* identical to box height, or 133% */

    color: #514949;
  }
  width: 100%;
  max-width: 866px;
  @media screen and (max-width: 767px) {
    max-width: 100%;
  }
  .image {
    width: 100%;
    max-width: 500px;
  }
`;
