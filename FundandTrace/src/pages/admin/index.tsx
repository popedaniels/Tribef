import React, { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import styled from "styled-components";
import AdminLayout from "./AdminLayout";
import Layout from "../../components/Layout";
import axios from "axios";
import { config } from "../../components/helperFunctions/helperFunctions";
import Preloader from "../../components/composed/Preloader/Preloader";
import daysjs from "dayjs";

const AdminOverviewCharts = dynamic(
  () => import("../../components/adminCampaignPageComponents/AdminOverviewCharts"),
  { ssr: false, loading: () => <p className="text-center my-5">Loading charts…</p> }
);

interface OverviewDetails {
  campaignCount?: number;
  usersCount?: number;
  campaignOrganizersCount?: number;
  donationsCount?: number;
  countries?: number;
  amountRaised?: number;
  amountDisbursed?: number;
}

interface OverviewStat {
  title: string;
  numbers?: number;
  color: string;
}

interface ChartPoint {
  name: string;
  donations: number;
  color: string;
}

interface ChartDatum {
  category: string;
  donations: number;
}

export default function OverviewPage() {
  const [overviewDetails, setOverviewDetails] =
    useState<OverviewDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingCharts, setLoadingCharts] = useState(true);
  const [displayOverview, setDisplayOverview] = useState<OverviewStat[]>([]);
  const [chartDetails, setChartDetails] = useState<ChartPoint[]>([]);
  const [filter, setFilter] = useState(6);

  const getOverviewDetails = async () => {
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/overview`,
        config()
      );

      const details = res?.data?.data;
      details && setOverviewDetails(details);
      setDisplayOverview([
        {
          title: "Campaigns",
          numbers: details?.campaignCount,
          color: "#F1E7FA",
        },
        {
          title: "Users",
          numbers: details?.usersCount,
          color: "#FFEDED",
        },
        {
          title: "Campaign Organizers",
          numbers: details?.campaignOrganizersCount,
          color: "#F0F1FE",
        },
        {
          title: "Donations",
          numbers: details?.donationsCount,
          color: "#FFF7E5",
        },
        {
          title: "Countries",
          numbers: details?.countries,
          color: "#E8EAEB",
        },
      ]);

      res && setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const getStartDate = () => {
    switch (filter) {
      case 30:
        var start = daysjs().subtract(1, "day").format("YYYY-MM-DD");

        var end = daysjs().format("YYYY-MM-DD");

        return JSON.stringify({ startDate: start, endDate: end });
        break;
      case 14:
        var start = daysjs().subtract(2, "weeks").format("YYYY-MM-DD");

        var end = daysjs().format("YYYY-MM-DD");

        return JSON.stringify({ startDate: start, endDate: end });
        break;
      case 7:
        var start = daysjs().subtract(1, "week").format("YYYY-MM-DD");

        var end = daysjs().format("YYYY-MM-DD");

        return JSON.stringify({ startDate: start, endDate: end });
        break;
      case 1:
        var start = daysjs().subtract(1, "month").format("YYYY-MM-DD");

        var end = daysjs().format("YYYY-MM-DD");

        return JSON.stringify({ startDate: start, endDate: end });
        break;
      case 3:
        var start = daysjs().subtract(3, "month").format("YYYY-MM-DD");

        var end = daysjs().format("YYYY-MM-DD");

        return JSON.stringify({ startDate: start, endDate: end });
        break;
      case 6:
        var start = daysjs().subtract(6, "month").format("YYYY-MM-DD");

        var end = daysjs().format("YYYY-MM-DD");

        return JSON.stringify({ startDate: start, endDate: end });
        break;

      case 12:
        var start = daysjs().subtract(12, "month").format("YYYY-MM-DD");

        var end = daysjs().format("YYYY-MM-DD");

        return JSON.stringify({ startDate: start, endDate: end });
        break;
    }
  };

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  const getChartDetails = useCallback(async () => {
    setLoadingCharts(true);
    try {
      const res = await axios.get(
        `${
          process.env.NEXT_PUBLIC_API_URL
        }/api/admin/charts?dateFilter=${getStartDate()}`,
        config()
      );

      const data = res?.data?.data.map((data: ChartDatum, i: number) => {
        return {
          name: `${data?.category[0].toUpperCase()}${data?.category?.substring(
            1
          )}`,
          donations: data?.donations,
          color: COLORS[i],
        };
      });
      setChartDetails(data);
      setLoadingCharts(false);
    } catch (error) {
      setLoadingCharts(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  useEffect(() => {
    getChartDetails();
  }, [filter, getChartDetails]);

  useEffect(() => {
    getOverviewDetails();
  }, []);

  return (
    <Layout url="https://fundandtrace.com" ogImage="/og-image.jpg" title="Fund&Trace | Admin">
      <AdminLayout active="Overview">
        {loading ? (
          <Preloader />
        ) : (
          <Wrapper className="mx-auto d-flex flex-column align-items-center justify-content-center">
            <article className="mx-auto d-flex align-items-center mb-3">
              {displayOverview.map((overview, i) => (
                <div
                  className="smallOverviewBox d-flex flex-column align-items-center justify-content-center"
                  key={i}
                >
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
                </div>
              ))}
            </article>
            <article className="mx-auto d-flex align-items-center mb-3">
              <div className="bigOverviewBox mx-2 d-flex flex-column align-items-center justify-content-center">
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "#E7FAF1",
                  }}
                  className="d-flex align-items-center justify-content-center"
                >
                  <img
                    src="/images/icons/overview6.svg"
                    alt="icon"
                    width="20px"
                  />
                </div>
                <h3 className="my-2">£{overviewDetails?.amountRaised}</h3>
                <p className="mb-0">Amount Raised</p>
              </div>
              <div className="bigOverviewBox mx-2 d-flex flex-column align-items-center justify-content-center">
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "#E8F4FD",
                  }}
                  className="d-flex align-items-center justify-content-center"
                >
                  <img
                    src="/images/icons/overview7.svg"
                    alt="icon"
                    width="20px"
                  />
                </div>
                <h3 className="my-2">£{overviewDetails?.amountDisbursed}</h3>
                <p className="mb-0">Amount Disbursed</p>
              </div>
            </article>
            <AdminOverviewCharts
              chartDetails={chartDetails}
              loading={loadingCharts}
              filter={filter}
              setFilter={(fil: number) => setFilter(fil)}
            />
          </Wrapper>
        )}
      </AdminLayout>
    </Layout>
  );
}

const Wrapper = styled.section`
  max-width: 1440px;
  margin-top: 50px;
  article {
    h3 {
      font-style: normal;
      font-weight: bold;
      font-size: 18px;
      line-height: 24px;

      color: #514949;
    }
    p {
      font-style: normal;
      font-weight: normal;
      font-size: 12px;
      line-height: 16px;

      color: #b3b3b3;
    }
    .smallOverviewBox {
      background: #ffffff;
      box-shadow: 0px 12px 48px rgba(50, 50, 71, 0.08);
      border-radius: 4px;
      width: 176px;
      height: 141px;
      margin-right: 24px;
    }
    .smallOverviewBox:last-child {
      margin-right: 0;
    }
    .bigOverviewBox {
      background: #ffffff;
      box-shadow: 0px 12px 48px rgba(50, 50, 71, 0.08);
      border-radius: 4px;
      width: 476px;
      height: 141px;
    }
  }
`;
