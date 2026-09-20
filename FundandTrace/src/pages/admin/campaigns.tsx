import styled from "styled-components";
import AdminLayout from "./AdminLayout";
import Layout from "../../components/Layout";
import CampaignDetailsCard from "../../components/adminCampaignPageComponents/campaignDetailsCard";
import CampaignDetailsHeader from "../../components/adminCampaignPageComponents/campaignDetailsHeader";
import CampaignSearch from "../../components/adminCampaignPageComponents/campaignSearch";
import { useCallback, useState } from "react";
import axios from "axios";
import { useEffect } from "react";
import Spinner from "../../components/composed/spinner/Spinner";
import { config } from "../../components/helperFunctions/helperFunctions";
import Pagination from "../../components/composed/Pagination";
import type { Campaign } from "../../types/campaign";

const filters = [
  "Latest",
  "Trending",
  "Category",
  "Location",
  "Amount raised: High",
  "Amount raised: Low",
];

export default function AdminCampaignPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("Latest");
  const [query, setQuery] = useState(1);
  const [count, setCount] = useState(1);
  const [search, setSearch] = useState("");

  const getQuery = () => {
    const locationQuery = {
      "basicInformation.locationCountry": {
        $regex: `^${search}`,
        $options: "i",
      },
    };

    const categoryQuery = { category: { $regex: `${search}`, $options: "i" } };
    const sort = {
      "funding.amountRaised": "desc",
      locationCountry: "desc",
      category: "desc",
      _id: "desc",
    };
    const returnedQuery =
      filter == "Location"
        ? { query: locationQuery, sort: sort }
        : filter == "Category"
        ? { query: categoryQuery, sort: sort }
        : filter.includes("High")
        ? { query: {}, sort: { "funding.amountRaised": "desc", _id: "desc" } }
        : filter.includes("Low")
        ? {
            query: {},
            sort: { "funding.amountRaised": "asc", _id: "desc" },
          }
        : {
            query: {
              "basicInformation.campaignTitle": {
                $regex: `^${search}`,
                $options: "i",
              },
            },
            sort: { _id: "desc" },
          };
    return JSON.stringify(returnedQuery);
  };
  const getAllCampaigns = useCallback(async () => {
    setLoading(true);

    try {
      const res = await axios.get(
        `${
          process.env.NEXT_PUBLIC_API_URL
        }/api/admin/campaigns/${query}?queries=${getQuery()}`,
        config()
      );
      res && setCampaigns(res?.data?.data?.campaigns);
      res && setCount(res?.data?.data?.count);
      res && setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, filter, search]);

  useEffect(() => {
    getAllCampaigns();
  }, [query, filter, search, getAllCampaigns]);

  return (
    <Layout url="https://fundandtrace.com" ogImage="/og-image.jpg" title="Fund&Trace | Admin">
      <AdminLayout active="Campaigns">
        <Wrapper className="mx-auto">
          <section>
            <CampaignSearch
              placeHolder={
                filter == "Location"
                  ? "Search by country"
                  : filter == "Category"
                  ? "Search by categories"
                  : "Search by campaign name"
              }
              search={search}
              setSearch={(search: string) => setSearch(search)}
              filters={filters}
              filter={filter}
              setFilter={(filter: string) => {
                setSearch("");
                setFilter(filter);
              }}
            />
          </section>
          <section className="bordered-wrapper">
            <section className="mx-auto flex-column d-flex align-items-center justify-content-around">
              <CampaignDetailsHeader />
              {loading ? (
                <div className="my-5">
                  <Spinner
                    type="TailSpin"
                    width={30}
                    height={30}
                    color={"var(--color-primary)"}
                  />
                </div>
              ) : campaigns?.length ? (
                campaigns.map((campaign, i) => (
                  <CampaignDetailsCard
                    key={i}
                    campaign={campaign}
                    index={i + 1}
                  />
                ))
              ) : (
                <h2 className="text-center my-5" style={{ fontSize: 18 }}>
                  No campaign
                </h2>
              )}
            </section>
          </section>
          <Pagination
            count={count}
            query={query}
            setQuery={(query: number) => setQuery(query)}
          />
        </Wrapper>
      </AdminLayout>
    </Layout>
  );
}

const Wrapper = styled.section`
  max-width: 1440px;
  padding: 50px 100px;
  @media screen and (max-width: 1300px) {
    padding: 50px 40px;
  }
  .bordered-wrapper {
    width: 100%;
    background: white;
    max-width: 100%;
    border: 0.5px solid #cccccc;
    box-sizing: border-box;
    border-radius: 4px;
    overflow-x: auto;
    ::-webkit-scrollbar {
      height: 10px;
      pointer: cursor;
      width: 4px;
      background: whitesmoke;
    }
    ::-webkit-scrollbar-thumb:horizontal {
      background: var(--color-primary);
      pointer: cursor;
      border-radius: 4px;
    }
    section {
      min-width: 1160px;
      max-width: 1160px;
      min-height: 200px;
      background: white;
    }
  }
`;
