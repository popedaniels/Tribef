import styled from "styled-components";
import AdminLayout from "./AdminLayout";
import Layout from "../../components/Layout";
import CampaignSearch from "../../components/adminCampaignPageComponents/campaignSearch";
import { useState } from "react";
import axios from "axios";
import { useEffect } from "react";
import Spinner from "../../components/composed/spinner/Spinner";
import { config } from "../../components/helperFunctions/helperFunctions";
import Pagination from "../../components/composed/Pagination";
import RefundsDetailsHeader from "../../components/adminCampaignPageComponents/RefundsDetailsHeader";
import RefundsDetailsCard from "../../components/adminCampaignPageComponents/RefundsDetailsCard";

const filters = ["By campaign", "Single Donation"];

interface DonationRow {
  [key: string]: unknown;
}

export default function AdminRefundsPage() {
  const [donations, setDonations] = useState<DonationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("By campaign");
  const [query, setQuery] = useState(1);
  const [count, setCount] = useState(1);
  const [search, setSearch] = useState("");
  const [email, setEmail] = useState("");

  const getQuery = () => {
    const emailQuery = {
      donorEmail: email,
      campaignId: search,
    };

    const campaignQuery = {
      _id: search,
    };
    // const sort = {
    //   "funding.amountRaised": "desc",
    //   locationCountry: "desc",
    //   category: "desc",
    //   _id: "desc",
    // };
    const returnedQuery =
      filter == "Single Donation"
        ? { query: emailQuery }
        : filter == "By campaign"
        ? { query: campaignQuery }
        : { query: campaignQuery };
    return JSON.stringify(returnedQuery);
  };
  const getAllDonations = async () => {
    setLoading(true);

    const url =
      filter === "Single Donation"
        ? axios.get(
            `${
              process.env.NEXT_PUBLIC_API_URL
            }/api/admin/refunds/donations/${query}?queries=${getQuery()}`,
            config()
          )
        : axios.get(
            `${
              process.env.NEXT_PUBLIC_API_URL
            }/api/admin/refunds/campaign/${query}?queries=${getQuery()}`,
            config()
          );

    try {
      const res = await url;
      res && setDonations(res?.data?.data?.donations);
      res && setCount(res?.data?.data?.count);
      res && setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (filter === "Single Donation") {
      search && email && getAllDonations();
    } else {
      search && getAllDonations();
    }
  };

  useEffect(() => {
    setDonations([]);
  }, [filter]);

  return (
    <Layout title="Fund&Trace | Admin">
      <AdminLayout active="Refunds">
        <Wrapper className="mx-auto">
          <section>
            <CampaignSearch
              placeHolder={"Search by campaign id"}
              search={search}
              setSearch={(search: string) => setSearch(search)}
              filters={filters}
              filter={filter}
              setFilter={(filter: string) => {
                setSearch("");
                setFilter(filter);
              }}
              showEmail={filter === "Single Donation"}
              setEmail={(email: string) => setEmail(email)}
              email={email}
              searchButton={() => handleSearch()}
            />
          </section>
          <section className="bordered-wrapper">
            <section className="mx-auto flex-column d-flex align-items-center justify-content-around">
              <RefundsDetailsHeader single={filter === "Single Donation"} />
              {loading ? (
                <div className="my-5">
                  <Spinner
                    type="TailSpin"
                    width={30}
                    height={30}
                    color={"var(--color-primary)"}
                  />
                </div>
              ) : donations?.length ? (
                donations.map((donation, i) => (
                  <RefundsDetailsCard
                    key={i}
                    donation={donation}
                    index={i + 1}
                    single={filter === "Single Donation"}
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
