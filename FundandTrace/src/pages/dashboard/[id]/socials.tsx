import axios from "axios";
import type { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import styled from "styled-components";
import type { Campaign } from "../../../types/campaign";
import CampaignDashboardLayout from "./campaignDashboardLayout";

interface SocialsProps {
  campaign: Campaign | null;
  campaignId: GetServerSidePropsContext["query"]["id"];
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const campaignId = context.query.id;
  try {
    const campaigndata = await axios.get(
    process.env.NEXT_PUBLIC_API_URL + "/api/campaigns/campaign/" + campaignId
  );
    const campaign = campaigndata?.data?.data;

    return {
      props: { campaign, campaignId },
    };
  } catch {
    return { props: { campaign: null, campaignId } };
  }
};

export default function Socials({ campaign, campaignId }: SocialsProps) {
  return (
    <CampaignDashboardLayout
      active={3}
      campaignId={campaignId}
      title={campaign?.basicInformation?.campaignTitle}
      page="Socials"
    >
      <div className="bg-white mb-3">
        <nav className="custom mx-auto" style={{ maxWidth: 1140 }}>
          <p className="text-blue mb-0">
            {campaign?.basicInformation?.campaignTitle} / SOCIALS
          </p>

          <button className="btn text-white d-none d-md-block">
            Boost your Campaign!
          </button>
        </nav>
      </div>
      {/* <button className="btn text-white d-md-none d-block mx-auto my-4">
        Boost your Campaign!
      </button> */}
      <Wrapper
        className="d-flex flex-column flex-md-row mx-auto custom justify-content-between"
        style={{ maxWidth: 1140 }}
      >
        <div className="left">
          <p className="text-small">Post Your Campaign</p>
          <div className="d-flex align-items-center mb-5">
            <a
              target="_blank"
              rel="noopener noreferrer"
              href={`https://www.facebook.com/sharer/sharer.php?u=https://fundandtrace.com/campaign/${
                campaign?._id
              }?title=${campaign?.basicInformation?.campaignTitle
                ?.split(" ")
                .join("")}`}
            >
              <div className="d-flex flex-column align-items-center mr-4">
                <img
                  src="/images/icons/facebook2.svg"
                  width={20}
                  height={32}
                  alt="socialMedia Icons"
                />
              </div>
            </a>
            <a
              target="_blank"
              rel="noopener noreferrer"
              href={`https://twitter.com/intent/tweet?text=Please Donate to this cause - https://fundandtrace.com/campaign/${
                campaign?._id
              }?title=${campaign?.basicInformation?.campaignTitle
                ?.split(" ")
                .join("")}`}
            >
              <div className="d-flex flex-column align-items-center mr-4">
                <img
                  src="/images/icons/twitter2.svg"
                  width={20}
                  height={32}
                  alt="socialMedia Icons"
                />
              </div>
            </a>
            <a
              target="_blank"
              rel="noopener noreferrer"
              href={`https://api.whatsapp.com/send?text=Please Donate to this cause - https://fundandtrace.com/campaign/${
                campaign?._id
              }?title=${campaign?.basicInformation?.campaignTitle
                ?.split(" ")
                .join("")}`}
            >
              <div className="d-flex flex-column align-items-center mr-4">
                <img
                  src="/images/icons/whatsapp.svg"
                  width={20}
                  height={32}
                  alt="socialMedia Icons"
                />
              </div>
            </a>
          </div>
          <div className="mb-4">
            <h2 className="text-medium-heading mb-3">
              Share Your Campaign URL
            </h2>
            <p className="mb-3">Share this link to your friends!</p>
          </div>
          <div className="d-flex shareDiv mb-5">
            <div className="d-flex align-items-center justify-content-center shareBtn">
              <img src="/images/icons/exportblack.svg" alt="" />
            </div>
            <input
              type="text"
              className="w-100"
              value={`https:fundandtrace.com/campaign/${campaignId}`}
              disabled
            />
          </div>
          {/* <div className="bg-white" style={{ borderRadius: 10 }}>
            <img src="/images/graph2.png" width="100%" alt="" />
          </div> */}
        </div>
        <div className="right bg-white">
          <div className="right-stats">
            <div className="d-flex justify-content-between mb-5">
              <div>
                <h6 className="mb-3">Views</h6>
                <p className="text-small mb-0">
                  Times people saw this campaign
                </p>
              </div>
              <div className="d-flex justify-content-end">
                <h2 className="text-medium-heading">3000</h2>
              </div>
            </div>
            <div className="d-flex justify-content-between mb-5">
              <div>
                <h6 className="mb-3">Share</h6>
                <p className="text-small mb-0">
                  Times your campaign was shared
                </p>
              </div>
              <div className="d-flex justify-content-end">
                <h2 className="text-medium-heading">1000</h2>
              </div>
            </div>
            <div className="d-flex justify-content-between">
              <div>
                <h6 className="mb-3">Impressions</h6>
                <p className="text-small mb-0">
                  Times people engaged your campaign
                </p>
              </div>
              <div className="d-flex justify-content-end">
                <h2 className="text-medium-heading mb-0">4000</h2>
              </div>
            </div>
          </div>
          {/* <div className="right-posts d-md-block d-none">
            <h6 className="mb-4">Recent Posts</h6>
            <div>
              <img
                src="/images/icons/facebook2.svg"
                width="24px"
                height="24px"
                alt="facebookIcon"
              />
              <div className="d-flex justify-content-between mb-4 mt-3">
                <div className="d-flex align-items-center ">
                  <img
                    src="https://res.cloudinary.com/wisdomosara/image/upload/v1622836169/family.png"
                    className="profilepic"
                    alt="profilePic"
                  />
                  <div>
                    <h6>Daniel Momoh</h6>
                    <p className="mb-0 text-small">13 hours ago</p>
                  </div>
                </div>
                <div className="d-flex justify-content-end">
                  <img
                    src="/images/icons/exportblue.svg"
                    width="24px"
                    height="24px"
                    alt="exporticon"
                  />
                </div>
              </div>
              <p className="text-small">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Non
                tempor, et euismod lorem enim. Pellentesque arcu odio eu
                ultricies congue adipiscing congue. Sit cursus viverra sed
                imperdiet augue volutpat nibh. Amet egestas in...
              </p>
            </div>
            <div className="mt-4">
              <img
                src="/images/icons/twitter2.svg"
                width="24px"
                height="24px"
                alt="twitter Icon"
              />
              <div className="d-flex justify-content-between mb-4 mt-3">
                <div className="d-flex align-items-center ">
                  <img
                    src="https://res.cloudinary.com/wisdomosara/image/upload/v1622836169/family.png"
                    className="profilepic"
                    alt="profilePic"
                  />
                  <div>
                    <h6>Daniel Momoh</h6>
                    <p className="mb-0 text-small">13 hours ago</p>
                  </div>
                </div>
                <div className="d-flex justify-content-end">
                  <img
                    src="/images/icons/exportblue.svg"
                    width="24px"
                    height="24px"
                    alt="export Icon"
                  />
                </div>
              </div>
              <p className="text-small">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Non
                tempor, et euismod lorem enim. Pellentesque arcu odio eu
                ultricies congue adipiscing congue. Sit cursus viverra sed
                imperdiet augue volutpat nibh. Amet egestas in...
              </p>
            </div>
          </div> */}
        </div>
        {/* <div className="right-posts d-md-none d-block">
          <h6 className="mb-4">Recent Posts</h6>
          <div>
            <img
              src="/images/icons/facebook2.svg"
              width="24px"
              height="24px"
              alt="facebook Icon"
            />
            <div className="d-flex justify-content-between mb-4 mt-3">
              <div className="d-flex align-items-center ">
                <img
                  src="https://res.cloudinary.com/wisdomosara/image/upload/v1622836169/family.png"
                  className="profilepic"
                  alt="profile pic"
                />
                <div>
                  <h6>Daniel Momoh</h6>
                  <p className="mb-0 text-small">13 hours ago</p>
                </div>
              </div>
              <div className="d-flex justify-content-end">
                <img
                  src="/images/icons/exportblue.svg"
                  width="24px"
                  height="24px"
                  alt="export ICon"
                />
              </div>
            </div>
            <p className="text-small">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Non
              tempor, et euismod lorem enim. Pellentesque arcu odio eu ultricies
              congue adipiscing congue. Sit cursus viverra sed imperdiet augue
              volutpat nibh. Amet egestas in...
            </p>
          </div>
          <div className="mt-4">
            <img
              src="/images/icons/twitter2.svg"
              width="24px"
              height="24px"
              alt="twitter Icon"
            />
            <div className="d-flex justify-content-between mb-4 mt-3">
              <div className="d-flex align-items-center ">
                <img
                  src="https://res.cloudinary.com/wisdomosara/image/upload/v1622836169/family.png"
                  className="profilepic"
                  alt="profile pIc"
                />
                <div>
                  <h6>Daniel Momoh</h6>
                  <p className="mb-0 text-small">13 hours ago</p>
                </div>
              </div>
              <div className="d-flex justify-content-end">
                <img
                  src="/images/icons/exportblue.svg"
                  width="24px"
                  height="24px"
                  alt="export Icon"
                />
              </div>
            </div>
            <p className="text-small">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Non
              tempor, et euismod lorem enim. Pellentesque arcu odio eu ultricies
              congue adipiscing congue. Sit cursus viverra sed imperdiet augue
              volutpat nibh. Amet egestas in...
            </p>
          </div>
        </div> */}
      </Wrapper>
    </CampaignDashboardLayout>
  );
}

const Wrapper = styled.div`
  @media screen and (max-width: 767px) {
    margin-right: 15px !important;
    margin-left: 15px !important;
  }
  .left {
    @media screen and (max-width: 767px) {
      order: 10;
      width: 100%;
      margin-right: 0px;
      padding: 50px 0px;
    }
    width: 45%;
    padding: 30px 0px;
    @media screen and (min-width: 1024px) and (max-width: 1100px) {
      padding: 30px 0px;
    }
    .shareDiv {
      border: 1px solid #c4c4c4;
      border-radius: 4px;
      .shareBtn {
        background: #f0f0f0;
        box-sizing: border-box;
        width: 64px;
        height: 50px;
        img {
          width: 24px;
          height: 24px;
        }
      }
      input {
        border-style: none;
        padding: 10px 20px;
        color: #b3b3b3;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        line-height: 24px;
        /* identical to box height, or 171% */

        opacity: 0.9;
        &:disabled {
          background: white !important;
        }
      }
    }
  }
  .right {
    width: 45%;
    box-shadow: -2px 4px 48px rgba(50, 50, 71, 0.05),
      2px 10px 24px rgba(50, 50, 71, 0.05);
    @media screen and (max-width: 767px) {
      order: 1;
      width: 100%;
      padding: 30px 15px;
    }
    padding: 30px;
    .right-stats {
      // border-bottom: 0.5px solid #b3b3b3;
    }
    .right-posts {
      padding: 35px 0;
      .profilepic {
        width: 50px;
        height: 50px;
        object-fit: cover;
        margin-right: 20px;
      }
    }
  }
  .right-posts {
    @media screen and (max-width: 767px) {
      order: 12;
    }
    padding: 35px 0;
    .profilepic {
      width: 50px;
      height: 50px;
      object-fit: cover;
      margin-right: 20px;
    }
  }
`;
