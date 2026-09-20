import styled from "styled-components";
import AdminLayout from "./AdminLayout";
import Layout from "../../components/Layout";
import CampaignSearch from "../../components/adminCampaignPageComponents/campaignSearch";
import { useCallback, useState } from "react";
import axios from "axios";
import { useEffect } from "react";
import Spinner from "../../components/composed/spinner/Spinner";
import { config } from "../../components/helperFunctions/helperFunctions";
import AdminFundingRequestsDetailsHeader from "../../components/adminCampaignPageComponents/AdminFundingRequestDetailsHeader";
import AdminFundingRequestDetailsCard from "../../components/adminCampaignPageComponents/AdminFundingRequestDetailsCard";
import Pagination from "../../components/composed/Pagination";

import { toast } from "../../../store/slices/ToastSlice";
import { useAppDispatch } from "./../../../store/hooks";
import type { Campaign } from "../../types/campaign";

const titles = ["All", "Pending", "Approved", "Declined"];

const filters = [
  "Newest",
  "Oldest",
  "Amount Requested: High",
  "Amount Requested: Low",
];

interface FundingRequestRow {
  campaign?: Campaign;
  fundingRequest?: Record<string, unknown>;
}

export default function AdminFundingRequestPage() {
  const [fundingRequests, setFundingRequests] = useState<FundingRequestRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState(1);
  const [status, setStatus] = useState("All");
  const [filter, setFilter] = useState("Newest");
  const [count, setCount] = useState(1);
  const [search, setSearch] = useState("");
  const dispatch = useAppDispatch();

  const getQuery = () => {
    const queries = { status: status };
    const sort = [
      {
        amount: filter.includes("High")
          ? "desc"
          : filter.includes("Low")
          ? "asc"
          : "",
      },
      { _id: filter == "Newest" ? "desc" : "asc" },
    ];
    const returnedQuery = {
      sort: sort[0].amount ? { ...sort[0] } : { ...sort[1] },
      queries:
        search && status == "All"
          ? { campaignId: search }
          : !search && status == "All"
          ? {}
          : queries,
    };

    return JSON.stringify(returnedQuery);
  };

  const getAllFundingRequests = useCallback(async () => {
    setLoading(true);

    try {
      const res = await axios.get(
        `${
          process.env.NEXT_PUBLIC_API_URL
        }/api/admin/fundingRequests/${query}?queries=${getQuery()}`,
        config()
      );

      res && setFundingRequests(res?.data?.data?.fundingRequests);
      res && setCount(res?.data?.data?.count);
      res && setLoading(false);
    } catch (error) {
      setLoading(false);
      dispatch(toast(true, error?.response?.data?.error, "error"));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, filter, status, search]);

  useEffect(() => {
    getAllFundingRequests();
  }, [query, filter, status, search, getAllFundingRequests]);

  return (
    <Layout title="Fund&Trace | Admin">
      <AdminLayout active="Funding Requests">
        <Wrapper className="mx-auto">
          <section>
            <CampaignSearch
              placeHolder="Search by campaign Id"
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
          <article className="d-flex align-items-center mx-auto status mb-4">
            {titles.map((title, i) => (
              <div
                className="px-4 py-3"
                key={i}
                role="button"
                style={{
                  background: status == title ? "#F0F1FE" : "transparent",
                  color: status == title ? "var(--color-primary)" : "",
                  fontWeight: status == title ? 500 : 400,
                }}
                onClick={() => setStatus(title)}
              >
                {title}
              </div>
            ))}
          </article>
          <section className="bordered-wrapper">
            <section className="mx-auto">
              <AdminFundingRequestsDetailsHeader />
              {loading ? (
                <div className="my-5 mx-auto" style={{ width: "max-content" }}>
                  <Spinner
                    type="TailSpin"
                    width={30}
                    height={30}
                    color={"var(--color-primary)"}
                  />
                </div>
              ) : fundingRequests.length ? (
                fundingRequests.map((fundingRequest, i) => (
                  <AdminFundingRequestDetailsCard
                    key={i}
                    campaign={fundingRequest?.campaign}
                    fundingRequest={fundingRequest?.fundingRequest}
                    index={i + 1}
                  />
                ))
              ) : (
                <h2
                  className="text-center text-medium-heading my-5"
                  style={{ fontSize: 18 }}
                >
                  No {status == "All" ? "" : status.toLowerCase()} funding
                  requests
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
  .status {
    background: #ffffff;
    width: max-content;
    border: 0.5px solid #a0a2af;
    box-sizing: border-box;
    border-radius: 4px;
    padding: 0.5px;
    div {
      border-radius: 4px;
      font-style: normal;
      font-weight: normal;
      font-size: 16px;
      line-height: 19px;
      /* identical to box height */

      color: #a0a2af;
    }
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
      width: 100%;
      min-width: 1160px;
      min-height: 200px;
      background: white;
    }
  }
`;
