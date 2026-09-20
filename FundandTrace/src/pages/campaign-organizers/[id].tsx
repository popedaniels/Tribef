import axios from "axios";
import React, { useState } from "react";
import dynamic from "next/dynamic";
import styled from "styled-components";
import CampaignCard from "../../components/CampaignCard/CampaignCard";
import Layout from "../../components/Layout";
import Navbar from "../../components/Navbar/Navbar";
import Spinner from "../../components/composed/spinner/Spinner";
import { Campaign } from "../../types/campaign";
import type { GetServerSidePropsContext } from "next";

const OrganizerPieChart = dynamic(() => import("../../components/OrganizerPieChart"), {
  ssr: false,
  loading: () => <p className="text-center my-5">Loading chart…</p>,
});

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

interface OrganizerUser {
  firstName?: string;
  lastName?: string;
  city?: string;
  country?: string;
  profilePicture?: string;
}

interface ChartDetail {
  category?: string;
  donations?: number;
}

interface OrganizerDetails {
  campaigns?: Campaign[];
  user?: OrganizerUser | null;
  amountRaised?: number;
  donations?: number;
  amountDisbursed?: number;
  chartDetails?: ChartDetail[];
}

interface OverviewStat {
  title: string;
  numbers: number | string;
  color: string;
}

interface ChartDatum {
  name: string;
  donations: number;
  color: string;
}

interface CampaignOrganizerPageProps {
  campaigns: Campaign[];
  user: OrganizerUser | null;
  displayOverview: OverviewStat[];
  chartDetails: ChartDatum[];
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const data = await axios.get(
      `${apiUrl}/api/auth/campaignOrganizer/${context.query.id}`,
      { timeout: 3000 }
    );

    const details: OrganizerDetails = data?.data?.data || {};
    const campaigns = details?.campaigns || [];
    const user = details?.user || null;
    const displayOverview = [
      {
        title: "Campaigns",
        numbers: details?.campaigns?.length || 0,
        color: "#F1E7FA",
      },
      {
        title: "Amount Raised",
        numbers: `£${details?.amountRaised || 0}`,
        color: "#FFEDED",
      },
      {
        title: "Donations",
        numbers: details?.donations || 0,
        color: "#F0F1FE",
      },
      {
        title: "Amount Disbursed",
        numbers: `£${details?.amountDisbursed || 0}`,
        color: "#FFF7E5",
      },
    ];

    const chartDetails = (details?.chartDetails || []).map((detail, i) => {
      return {
        name: detail?.category || "General",
        donations: detail?.donations || 0,
        color: COLORS[i % COLORS.length],
      };
    });

    return {
      props: {
        campaigns,
        user,
        displayOverview,
        chartDetails,
      },
    };
  } catch (error) {
    return {
      props: {
        campaigns: [],
        user: { firstName: "Verified", lastName: "Organizer", city: "Global", country: "Community" },
        displayOverview: [
          { title: "Campaigns", numbers: 0, color: "#F1E7FA" },
          { title: "Amount Raised", numbers: "£0", color: "#FFEDED" },
          { title: "Donations", numbers: 0, color: "#F0F1FE" },
          { title: "Amount Disbursed", numbers: "£0", color: "#FFF7E5" },
        ],
        chartDetails: [],
      },
    };
  }
}

export default function CampaignOrganizerPage({
  campaigns,
  user,
  displayOverview,
  chartDetails,
}: CampaignOrganizerPageProps) {
  const [loading] = useState(false);
  const [view, setView] = useState("overview");

  return (
    <Layout showFooter>
      <Wrapper className="mb-5">
        <div className="bg-white" style={{ height: 77 }}>
          <Navbar />
        </div>
        <section className="py-5" style={{ background: "#F9F9F9" }}>
          <article className="custom-container d-flex justify-content-center">
            {user?.profilePicture ? (
              <img
                src={user?.profilePicture}
                alt="organizer photo"
                width="70px"
                height="70px"
                style={{
                  borderRadius: "50%",
                  minWidth: 70,
                  objectFit: "cover",
                }}
                className="mr-3"
              />
            ) : (
              <div
                className="d-flex align-items-center justify-content-center mr-3"
                style={{
                  minWidth: 58,
                  height: 58,
                  background: "#F0F0F0",
                  borderRadius: "50%",
                  color: "#A3A3A3",
                  fontSize: 12,
                }}
              >
                {`${user?.firstName?.charAt(0)} ${user?.lastName?.charAt(0)}`}
              </div>
            )}
            <div>
              <h2 className="text-medium">{`${user?.firstName} ${user?.lastName}`}</h2>
              <div className="d-flex align-items-center">
                <img
                  src="/images/icons/location.svg"
                  alt="location icon"
                  width="14px"
                  height="17px"
                  className="mr-2"
                />
                <p className="mb-0">{`${user?.city}, ${user?.country}`}</p>
              </div>
            </div>
          </article>
        </section>
        <section className="w-100 d-flex justify-content-center mt-4 mb-5">
          <div
            className="py-2 px-2"
            style={{
              fontSize: 18,
              fontWeight: 400,
              borderBottom: view == "overview" ? "4px solid var(--color-primary)" : "",
            }}
            role="button"
            onClick={() => setView("overview")}
          >
            Overview
          </div>
          <div
            className="py-2 px-2 ml-3"
            style={{
              fontSize: 18,
              fontWeight: 400,
              borderBottom: view == "campaigns" ? "4px solid var(--color-primary)" : "",
            }}
            role="button"
            onClick={() => setView("campaigns")}
          >
            Campaigns
          </div>
        </section>
        {view == "overview" ? (
          <OverviewSection className="custom-container d-flex flex-column flex-lg-row justify-content-between mx-auto">
            <article className="overview-grid">
              {displayOverview.map((overview, i) => (
                <OverviewBox key={i} className="d-flex flex-column align-items-center justify-content-center py-3">
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: overview.color,
                    }}
                    className="d-flex align-items-center justify-content-center"
                  >
                    <img
                      src={`/images/icons/overview${i + 1}.svg`}
                      alt="icon"
                      width="16px"
                    />
                  </div>

                  <h3 className="my-2">{overview.numbers}</h3>
                  <p className="mb-0">{overview.title}</p>
                </OverviewBox>
              ))}
            </article>
            <article className="chart">
              <div
                className="bg-white"
                style={{
                  width: "100%",
                  height: "450px",
                  paddingTop: 10,
                  boxShadow: "0px 12px 48px rgba(50, 50, 71, 0.08)",
                }}
              >
                <OrganizerPieChart chartDetails={chartDetails} />
              </div>
            </article>
          </OverviewSection>
        ) : (
          <CampaignsSection
            className="custom-container campaigns"
            style={{ marginBottom: 144 }}
          >
            {loading ? (
              <div className="d-flex align-items-center justify-content-center my-4">
                <Spinner type="Oval" width={25} height={25} color={"var(--color-primary)"} />
              </div>
            ) : campaigns?.length ? (
              <div className="card-container">
                {campaigns.map((campaign) => (
                  <CampaignCard key={campaign?._id} campaign={campaign} />
                ))}
              </div>
            ) : (
              <div>
                <h2 className="text-center text-medium-heading my-4">
                  No Campaigns Yet!
                </h2>
              </div>
            )}
            {/* <button
              className="d-block d-md-none btn card-btn mt-4"
              style={{
                padding: "15px 30px",
                background: "var(--color-primary)",
                width: "100%",
                boxShadow:
                  "0px 2px 4px rgba(50, 50, 71, 0.06), 0px 2px 2px rgba(50, 50, 71, 0.06)",
                borderRadius: 4,
                color: "white",
              }}
            >
              See More
            </button> */}
          </CampaignsSection>
        )}
      </Wrapper>
    </Layout>
  );
}

const Wrapper = styled.main``;

const OverviewSection = styled.section`
  .overview-grid {
    width: 48%;
    @media screen and (max-width: 991px) {
      width: 100%;
      margin-bottom: 50px;
    }
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    row-gap: 2.5rem;
    column-gap: 2.5rem;

    @media screen and (min-width: 768px) and (max-width: 982px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media screen and (max-width: 991px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      row-gap: 1.5rem;
      column-gap: 1.5rem;
    }
  }
  .chart {
    width: 46%;
    .recharts-legend-wrapper {
      top: 10px !important;
      width: max-content !important;
      @media screen and (max-width: 991px) {
        top: 85% !important;
        left: 0px;
        padding-bottom: 10px;
        width: 100% !important;
      }
      .recharts-default-legend {
        display: flex;
        flex-direction: column;
        text-align: left !important;
        @media screen and (max-width: 991px) {
          flex-direction: row;
          flex-wrap: wrap;
        }
      }
    }
    @media screen and (max-width: 991px) {
      width: 100%;
    }
  }
`;

const OverviewBox = styled.div`
  background: #ffffff;
  border: 1px solid rgba(228, 228, 228, 0.5);
  box-sizing: border-box;
  box-shadow: 0px 2px 24px rgba(50, 50, 71, 0.04);
  border-radius: 4px;
  h3 {
    font-style: normal;
    font-weight: bold;
    font-size: 24px;
    line-height: 32px;
    text-align: center;

    color: #514949;
    @media screen and (max-width: 767px) {
      font-size: 18px !important;
    }
  }
  p {
    @media screen and (max-width: 767px) {
      font-size: 14px;
    }
  }
`;

const CampaignsSection = styled.section`
  width: 100%;
  button {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 15px 30px;

    width: 100%;
    background: var(--color-primary);
    box-shadow: 0px 2px 4px rgba(50, 50, 71, 0.06),
      0px 2px 2px rgba(50, 50, 71, 0.06);
    border-radius: 4px;
    color: white !important;
  }
`;
