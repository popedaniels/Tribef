import React, { useCallback, useEffect, useState } from "react";
import DashboardLayout from "./DashboardLayout";
import styled from "styled-components";
import Link from "next/link";
import { useSelector } from "react-redux";
import { selectAuthStateState } from "../../../store/slices/authSlice";
import axios from "axios";
import Spinner from "../../components/composed/spinner/Spinner";
import { addCommaToNumber } from "../../components/helperFunctions/helperFunctions";
import type { Campaign } from "../../types/campaign";

export default function Account() {
  const { profile } = useSelector(selectAuthStateState);
  const [campaignCount, setCampaignCount] = useState(0);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [totalDonations, setTotalDonations] = useState(0);
  const [loading, setLoading] = useState(true);
  const [NGN, setNGN] = useState(0);
  const [USD, setUSD] = useState(0);
  const [GBP, setGBP] = useState(0);

  const getCount = useCallback(async () => {
    try {
      const campaigns = await axios.get(
        process.env.NEXT_PUBLIC_API_URL + "/api/campaigns/" + profile?._id
      );

      campaigns && setCampaigns(campaigns?.data?.data?.active);
      campaigns && setCampaignCount(campaigns?.data?.data?.active?.length);
    } catch (error) {
    }
  }, [profile?._id]);

  const getDonations = useCallback(async () => {
    try {
      const donations = await axios.get(
        process.env.NEXT_PUBLIC_API_URL +
          "/api/donations/allDonations/" +
          profile?.email
      );
      donations && setTotalDonations(donations?.data?.data?.length);
    } catch (error) {
    }
  }, [profile?.email]);

  const getRaised = useCallback(async () => {
    try {
      const USD = await campaigns
        .filter((contribution) => contribution?.funding?.currency == "USD")
        .reduce((acc, cur) => {
          return acc + cur?.funding?.amountRaised;
        }, 0);

      setUSD(USD);
      const GBP = await campaigns
        .filter((contribution) => contribution?.funding?.currency == "GBP")
        .reduce((acc, cur) => {
          return acc + cur?.funding?.amountRaised;
        }, 0);

      setGBP(GBP);

      const NGN = await campaigns
        .filter((contribution) => contribution?.funding?.currency == "NGN")
        .reduce((acc, cur) => {
          return acc + cur?.funding?.amountRaised;
        }, 0);

      setNGN(NGN);
      setLoading(false);
    } catch (error) {
    }
  }, [campaigns]);

  useEffect(() => {
    getCount();
    getDonations();
  }, [getCount, getDonations]);

  useEffect(() => {
    getRaised();
  }, [getRaised]);

  return (
    <>
      <DashboardLayout active={3} page="Accounts">
        <section
          style={{
            background: "url(/images/accountBackground.png)",
            backgroundSize: "cover",
            height: 225,
            width: "100%",
          }}
        ></section>
        <Accounts className="accounts custom pt-md-5 pb-md-5 pb-4 d-flex flex-column flex-md-row align-items-center bg-white justify-content-md-between justify-content-center">
          <div className="d-flex flex-column flex-md-row align-items-center justify-content-center justify-content-md-center align-align-items-md-start">
            {profile?.profilePicture ? (
              <img
                src={profile?.profilePicture}
                width={70}
                height={70}
                className="mb-4"
                style={{
                  borderRadius: "50%",
                  objectFit: "cover",
                  marginTop: "-35px",
                }}
                alt="profilepicture"
              />
            ) : (
              <div
                className="d-flex flex-column flex-md-row align-items-center justify-content-center"
                style={{
                  background: "#D8DAFA",
                  height: 70,
                  width: 70,
                  borderRadius: "50%",
                  marginTop: "-35px",
                }}
              >
                {`${profile?.firstName?.charAt(0)} ${profile?.lastName?.charAt(
                  0
                )}`}
              </div>
            )}
            <div className="ml-md-4 text-center text-md-left">
              <h2 className="text-medium mb-3">{`${profile?.firstName} ${profile?.lastName}`}</h2>
              <p className="text-small mb-3">{profile?.email}</p>
              <p className="text-small mb-3">{`${profile?.country}, ${profile?.city}`}</p>
              <p className="text-small mb-0">
                +{profile?.code}
                {profile?.phone}
              </p>
            </div>
          </div>
          <Link href="edit-profile" passHref>
            <a style={{ textDecoration: "none" }}>
              <button className="btn text-white">Edit Profile</button>
            </a>
          </Link>
        </Accounts>
        <div className="d-flex align-items-baseline justify-content-center">
          {loading ? (
            <div>
              <Spinner type="Oval" width={50} height={50} color={" var(--color-primary)"} />
            </div>
          ) : (
            <Article className="d-flex flex-md-row flex-column flex-wrap px-4 justify-content-center">
              <div className="campaign bg-white d-flex flex-column px-3">
                <div
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: "50%",
                    background: "#F1E7FA",
                  }}
                  className="d-flex align-items-center justify-content-center"
                >
                  <img
                    src="/images/accountCampaignIcon.svg"
                    alt="icon"
                    width="19px"
                  />
                </div>
                <h3 className="my-3">{campaignCount}</h3>
                <p>Campaigns</p>
              </div>
              <div className="campaign bg-white d-flex flex-column px-3">
                <div
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: "50%",
                    background: "#F1E7FA",
                  }}
                  className="d-flex align-items-center justify-content-center"
                >
                  <img
                    src="/images/accountDonationIcon.svg"
                    alt="icon"
                    width="22px"
                  />
                </div>
                <h3 className="my-3">{totalDonations}</h3>
                <p>Donations</p>
              </div>
              <div className="campaign big bg-white d-flex flex-column px-3">
                <div
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: "50%",
                    background: "#F1E7FA",
                  }}
                  className="d-flex align-items-center justify-content-center"
                >
                  <img
                    src="/images/accountRaisedIcon.svg"
                    alt="icon"
                    width="22px"
                  />
                </div>
                <div className="my-3">
                  {!USD && !GBP && !NGN && (
                    <h3 className="text-medium mb-0">0</h3>
                  )}
                  {USD > 0 && (
                    <h3 className="text-medium mb-0">
                      ${addCommaToNumber(USD)}
                    </h3>
                  )}
                  {GBP > 0 && (
                    <h3 className="text-medium mb-0">
                      £{addCommaToNumber(GBP)}
                    </h3>
                  )}
                  {NGN > 0 && (
                    <h3 className="text-medium mb-0">
                      ₦{addCommaToNumber(NGN)}
                    </h3>
                  )}
                </div>
                <p>Amount raised</p>
              </div>
            </Article>
          )}
        </div>
      </DashboardLayout>
    </>
  );
}

const Accounts = styled.section`
  overflow-wrap: anywhere;
  width: calc(100% - 100px);
  max-width: 815px;
  margin-left: auto;
  margin-right: auto;
  margin-top: -70px;
  background: #ffffff;
  box-shadow: 0px 2px 12px rgba(50, 50, 71, 0.08);
  border-radius: 4px;
  margin-bottom: 50px;
  @media screen and (max-width: 767px) {
    width: calc(100% - 30px);
  }

  a {
    @media screen and (max-width: 767px) {
      width: 100%;
    }
    button {
      @media screen and (max-width: 767px) {
        width: 100%;
        margin-top: 20px;
      }
    }
  }
`;

const Article = styled.article`
  @media screen and (max-width: 767px) {
    width: 100%;
  }
  p {
    font-style: normal;
    font-weight: 400 !important;
    text-align: center;
    font-size: 16px;
    line-height: 16px;
    margin-bottom: 45px;
    color: #b3b3b3;
  }
  h3 {
    font-style: normal;
    font-weight: bold;
    font-size: 24px;
    line-height: 28px;
    text-align: center;

    color: black;
  }
  .campaign {
    padding-top: 37px;
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-left: 15px;
    margin-right: 15px;
    margin-bottom: 30px;
    background: #ffffff;
    box-shadow: 0px 2px 12px rgba(50, 50, 71, 0.08);
    border-radius: 4px;
    @media screen and (max-width: 767px) {
      width: 100%;
      margin-left: 0;
      margin-right: 0;
    }
    border: none;
    box-sizing: border-box;
    width: 214px;
  }
  .big {
    background: #ffffff;
    border: none;
    @media screen and (max-width: 767px) {
      width: 100%;
    }
  }
`;
