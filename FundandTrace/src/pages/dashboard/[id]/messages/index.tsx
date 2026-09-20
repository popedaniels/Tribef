import React, { useEffect, useState } from "react";
import CampaignDashboardLayout from "../campaignDashboardLayout";
import styled from "styled-components";
import Link from "next/link";
import type { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import axios from "axios";
import type { Campaign } from "../../../../types/campaign";

interface MessagesProps {
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

export default function Messages({ campaign, campaignId }: MessagesProps) {
  const [view, setview] = useState("compose");

  const activeBtn = {
    background: "#F0F1FE",
    color: "var(--color-primary)",
    boxShadow: "none",
    padding: "12px 18px",
    border: "1px solid var(--color-primary)",
  };

  const inactiveBtn = {
    borderRadius: 0,
    color: " #B3B3B3",
    boxShadow: "none",
    padding: "12px 18px",
    background: "white",
  };

  return (
    <CampaignDashboardLayout
      active={2}
      campaignId={campaignId}
      title={campaign?.basicInformation?.campaignTitle}
      page="Send Email"
    >
      <div className="bg-white">
        <nav
          className="custom mx-auto"
          style={{ background: "#FAFAFA", maxWidth: 1140 }}
        >
          <p className="text-blue mb-0">
            {campaign?.basicInformation?.campaignTitle} / SEND EMAIL
          </p>

          <div className="d-lg-flex d-none align-items-center border border-black">
            <button
              className="btn"
              onClick={() => setview("compose")}
              style={view == "compose" ? activeBtn : inactiveBtn}
            >
              Compose Mail
            </button>

            <button
              className="btn"
              onClick={() => setview("sent")}
              style={view == "sent" ? activeBtn : inactiveBtn}
            >
              Sent
            </button>
          </div>
        </nav>
      </div>
      <Div
        className="mx-auto  d-lg-none d-flex align-items-center border border-black mt-4"
        style={{ minWidth: 271, width: 271 }}
      >
        <button
          className="btn btn1"
          onClick={() => setview("compose")}
          style={view == "compose" ? activeBtn : inactiveBtn}
        >
          Compose Email
        </button>

        <button
          className="btn btn2"
          onClick={() => setview("sent")}
          style={view == "sent" ? activeBtn : inactiveBtn}
        >
          Sent
        </button>
      </Div>
      <Wrapper className="mx-auto">
        <article className="custom">
          {view == "compose" ? (
            <>
              <h2 className="text-medium-heading mb-4">Compose</h2>
              <h6 className="mb-3">To:</h6>
              <input
                type="text"
                placeholder="Type email addresses here"
                className="mb-4"
              />
              <h6 className="mb-3">Subject:</h6>
              <input
                type="text"
                placeholder="Type email addresses here"
                className="mb-4"
              />
              <h6 className="mb-3">Body:</h6>
              <textarea name="mail" id="mail" className="mb-4"></textarea>
              <div className="d-md-flex d-none">
                <button className="bluebtn btn">Send Email</button>
              </div>
              <div className="d-flex d-md-none flex-column">
                <button className="bluebtn btn w-100 mb-3">Send</button>
              </div>
            </>
          ) : (
            <div>
              <h2 className="text-medium-heading mb-4">Sent Mails</h2>
              <h6>You haven't sent any mails yet!</h6>
            </div>
          )}
        </article>
      </Wrapper>
    </CampaignDashboardLayout>
  );
}

const Div = styled.div`
  .btn1 {
    width: 140px;
    min-width: 140px;
    font-size: 14px;
    max-width: 140px;
  }
  .btn2 {
    width: 131px;
    font-size: 14px;
  }
`;

const Wrapper = styled.div`
  width: 100%;
  max-width: 1140px;
  padding-right: 18% !important;
  @media screen and (max-width: 1100px) {
    width: 100%;
  }
  @media screen and (max-width: 767px) {
    width: 100%;
    padding-right: 0 !important;
  }
  input::placeholder {
    font-style: normal;
    font-weight: 300;
    font-size: 14px;
    line-height: 24px;
    /* identical to box height, or 171% */

    color: #b3b3b3;
    opacity: 0.9;
  }
  .whitebtn {
    border: 0.7px solid var(--color-primary);
    box-sizing: border-box;
    border-radius: 4px;
    color: var(--color-primary);
  }
`;
