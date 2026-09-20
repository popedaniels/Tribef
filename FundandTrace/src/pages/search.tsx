import React, { useCallback, useEffect } from "react";
import Navbar from "../components/Navbar/Navbar";
import styled from "styled-components";
import { useState } from "react";
import CampaignCard from "../components/CampaignCard/CampaignCard";
import axios from "axios";
import Spinner from "../components/composed/spinner/Spinner";
import Layout from "../components/Layout";
import { Campaign } from "../types/campaign";

const Categories = [
  "All",
  "Medical",
  "Education",
  "Emergency",
  "Nonprofit",
  "Memorial",
  "Environment",
  "More",
];

const moreCategories = ["Business", "Bills"];

export default function Search() {
  const [active, setActive] = useState("All");
  const activeStyle = {
    background: "#F0F1FE",
    borderRadius: 4,
    color: "var(--color-primary)",
    fontWeight: "bold",
  };
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [searchInput, setSearchInput] = useState("");
  const [categories, setCategories] = useState(Categories);
  const [showSortBy, setShowSortBy] = useState(false);
  const sortBy = ["Trending", "Newest", "Highest"];
  const [sort, setSortBy] = useState(sortBy[0]);
  const [showSearchForDropdown, setSearchForDropdown] = useState(false);
  const searchFors = ["Campaigns", "Location"];
  const [searchFor, setSearchFor] = useState(searchFors[0]);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);

  const getCampaigns = useCallback(async () => {
    try {
      const getCampaignQueries = () => {
        const query =
          category == "All"
            ? {
                launched: true,
                "basicInformation.campaignTitle": {
                  $regex: `${searchInput}`,
                  $options: "i",
                },
              }
            : {
                category: category == "All" ? "" : category.toLowerCase(),
                launched: true,
                "basicInformation.campaignTitle": {
                  $regex: `${searchInput}`,
                  $options: "i",
                },
              };
        const returnedQuery =
          sort == "Highest"
            ? { query, sort: { "funding.amountRaised": "desc" } }
            : sort == "Trending"
            ? { query, sort: { "funding.amountRaised": "desc" } }
            : { query, sort: { _id: "desc" } };
        return JSON.stringify(returnedQuery);
      };

      const getCampaignlocationQueries = () => {
        const query =
          category == "All"
            ? {
                launched: true,
                "basicInformation.locationCountry": {
                  $regex: `${searchInput}`,
                  $options: "i",
                },
              }
            : {
                category: category == "All" ? "" : category.toLowerCase(),
                launched: true,
                "basicInformation.locationCountry": {
                  $regex: `${searchInput}`,
                  $options: "i",
                },
              };
        const returnedQuery =
          sort == "Highest"
            ? { query, sort: { "funding.amountRaised": "desc" } }
            : sort == "Trending"
            ? { query, sort: { "funding.amountRaised": "desc" } }
            : { query, sort: { _id: "desc" } };
        return JSON.stringify(returnedQuery);
      };

      // const getUsersQueries = () => {
      //   const sort = {
      //     "funding.amountRaised": sort == "Highest" ? "desc" : sort == "asc",
      //   };
      //   const query = {};
      //   const returnedQuery = {};
      // };

      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      if (category !== "") {
        const campaigns = await axios.get(
          `${apiUrl}/api/campaigns/searchByName/${page}?addCount=true&queries=${
            searchFor == "Campaigns"
              ? getCampaignQueries()
              : getCampaignlocationQueries()
          }`,
          { timeout: 3000 }
        );

        if (campaigns?.data?.data) {
          setCampaigns(campaigns.data.data.campaigns || []);
          setCount(campaigns.data.data.count || 0);
        }
        setLoading(false);
      } else {
        const camps = await axios.get(
          `${apiUrl}/api/campaigns/searchByCategory/${category}`,
          { timeout: 3000 }
        );
        if (camps?.data?.data) {
          setCampaigns(camps.data.data.campaigns || []);
          setCount(camps.data.data.count || 0);
        }
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
      setCampaigns([]);
      setCount(0);
    }
  }, [category, page, searchFor, sort, searchInput]);

  useEffect(() => {
    getCampaigns();
  }, [category, page, searchFor, sort, searchInput, getCampaigns]);

  return (
    <Layout title="Fund&Trace | Search" showFooter>
      <Wrapper>
        <section className="hero">
          <Navbar white={true} />
          <div className="overlay d-flex align-items-center justify-content-center">
            <h2 className="mb-0 text-center">
              Search for campaigns, causes and people
            </h2>
          </div>
        </section>
        <section className="custom-container">
          <section className="search mx-auto">
            <div className="search-bar bg-white d-flex py-3 px-3 align-items-center">
              <img
                src="/images/icons/search.svg"
                width={20}
                height={20}
                className="mr-4"
               alt="Search" />
              <input
                type="search"
                name=""
                id=""
                style={{ width: "100%" }}
                placeholder="Search..."
                onChange={(e) => {
                  setTimeout(() => {
                    setSearchInput(e.target.value);
                  }, 1500);
                }}
              />
              <div className="divider mr-md-3 mr-2"></div>
              <Select
                className="d-flex align-items-center justify-content-between"
                style={{ minWidth: 120 }}
              >
                <button
                  className="d-flex align-items-center justify-content-between"
                  onClick={() => setSearchForDropdown(!showSearchForDropdown)}
                  style={{
                    border: "none",
                    minWidth: "100%",
                    borderStyle: "none",
                    boxShadow: "none",
                    outline: "none",
                    background: "white",
                    padding: 0,
                  }}
                >
                  <p
                    className="mb-0 value"
                    style={{
                      fontWeight: !searchFor ? 300 : "",
                      opacity: !searchFor ? 0.9 : 1,
                      fontSize: !searchFor ? 14 : 16,
                    }}
                  >
                    {searchFor}
                  </p>
                  <img
                    src="/images/icons/dropdown.svg"
                    width={13}
                    height={8}
                    className="pt-0 ml-2"
                   alt="" />
                </button>

                {showSearchForDropdown && (
                  <div
                    onClick={() => setSearchForDropdown(false)}
                    className="overlay"
                  ></div>
                )}
                {showSearchForDropdown && (
                  <div className="dropdown bg-white">
                    {searchFors.map((searchFor, i) => (
                      <p
                        className="options py-3 mb-0 px-2"
                        key={i}
                        onClick={(e) => {
                          setSearchFor(searchFor);
                          setSearchForDropdown(false);
                        }}
                        role="button"
                      >
                        {searchFor}
                      </p>
                    ))}
                  </div>
                )}
              </Select>
            </div>
            <div className="sort d-flex align-items-md-center justify-content-between flex-column flex-md-row">
              <p className="mb-3 mb-md-0">{campaigns?.length} results</p>
              <div className="d-flex align-items-center">
                <p className="mb-0 mr-3">Sort By</p>
                <Select
                  className="d-flex align-items-center justify-content-between px-3 py-3 border"
                  style={{ height: 40 }}
                >
                  <button
                    className="d-flex align-items-center justify-content-between"
                    onClick={() => setShowSortBy(!showSortBy)}
                    style={{
                      border: "none",
                      minWidth: "100%",
                      borderStyle: "none",
                      boxShadow: "none",
                      outline: "none",
                      background: "white",
                      padding: 0,
                    }}
                  >
                    <p
                      className="mb-0 value"
                      style={{
                        fontWeight: !sort ? 300 : "",
                        opacity: !sort ? 0.9 : 1,
                        fontSize: !sort ? 14 : 16,
                      }}
                    >
                      {sort}
                    </p>
                    <img
                      src="/images/icons/dropdown.svg"
                      width={13}
                      height={8}
                      className="pt-0 ml-2"
                     alt="" />
                  </button>

                  {showSortBy && (
                    <div
                      onClick={() => setShowSortBy(false)}
                      className="overlay"
                    ></div>
                  )}
                  {showSortBy && (
                    <div className="dropdown bg-white">
                      {sortBy.map((sort, i) => (
                        <p
                          className="options py-3 mb-0 px-2"
                          key={i}
                          onClick={(e) => {
                            setSortBy(sort);
                            setShowSortBy(false);
                          }}
                          role="button"
                        >
                          {sort}
                        </p>
                      ))}
                    </div>
                  )}
                </Select>
              </div>
            </div>
            <div className="select d-flex align-items-center">
              {categories.map((category, i) =>
                category != "More" ? (
                  <div
                    className="box px-4 py-3 mr-3 mb-2"
                    style={active == category ? activeStyle : undefined}
                    key={i}
                    onClick={() => {
                      setActive(category);
                      setCategory(category);
                    }}
                    role="button"
                  >
                    {category}
                  </div>
                ) : (
                  <div
                    className="box px-4 py-3 mr-3 mb-2"
                    style={active == category ? activeStyle : undefined}
                    key={i}
                    onClick={() => {
                      setCategories(
                        categories
                          .filter((category) => category != "More")
                          .concat(moreCategories)
                      );
                    }}
                    role="button"
                  >
                    {category}
                  </div>
                )
              )}
            </div>
          </section>
        </section>
        <section
          className="custom-container campaigns"
          style={{ marginBottom: 144 }}
        >
          {loading ? (
            <div className="d-flex align-items-center justify-content-center my-4">
              <Spinner type="Oval" width={25} height={25} color={"var(--color-primary)"} />
            </div>
          ) : campaigns?.length ? (
            <div
              className="card-container mx-auto"
              style={{ maxWidth: "1020px" }}
            >
              {campaigns.map((campaign) => (
                <CampaignCard key={campaign?._id} campaign={campaign} />
              ))}
            </div>
          ) : (
            <div className="my-4">
              <h2 className="text-center text-medium-heading mb-2">
                No Campaigns meets this search!
              </h2>
              <h6 className="text-center">Search again</h6>
            </div>
          )}
          <button
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
          </button>
        </section>
      </Wrapper>
    </Layout>
  );
}

const Select = styled.div`
  min-width: 160px;
  height: 36px;
  position: relative;
  background: #FFFFFF;
  
  .value{
    p{
      font-size: 14px
    }
  }
  
  box-sizing: border-box;
  border-radius: 4px;
  .options{
    @media screen and (max-width: 767px) {
      border-top: 1px solid #E5E5E5
    }
    background: transparent;
    &:hover {
      background: #E5E5E5;
    }
  }
  .dropdown{
    position: absolute;
    top: 110%;
    box-shadow: -2px 4px 48px rgba(50, 50, 71, 0.05),
    2px 10px 24px rgba(50, 50, 71, 0.05);
    z-index: 10000000000;
    cursor: pointer;
    width: 100%;
    max-height: 300px;
    overflow-y: scroll;
    p{
      font-size: 14px
    }
    right: 0px;
    @media screen and (max-width: 767px) {
      position: fixed;
      top: 50%;
      left: 50%;
      width: 90%;
      border-radius: 4px;
      max-width: 430px;
      max-height: 400px;
      transform: translate(-50%, -50%)
    }
  }
  .overlay{
    width: 100vw;
    height:100vh;
    position:fixed;
    z-index 1000000;
    left: 0;
    top: 0;
    @media screen and (max-width: 767px) {
      background: rgba(0,0,0,0.5)
    }
  }
`;

const Wrapper = styled.section`
  .hero {
    background: linear-gradient(135deg, var(--color-text-heading) 0%, #2b3360 100%);
    height: 329px;
    @media screen and (max-width: 767px) {
      height: 480px;
    }
    position: relative;
    width: 100%;
    .overlay {
      position: absolute;
      height: 100%;
      @media screen and (max-width: 767px) {
        padding: 25px;
      }
      width: 100%;
      background: rgba(0, 0, 0, 0.6);
      top: 0;
      h2 {
        font-style: normal;
        font-weight: bold;
        font-size: 32px;
        line-height: 48px;
        /* identical to box height, or 150% */

        color: #ffffff;
      }
    }
  }
  .search {
    margin-top: -35px;
    width: 100%;
    max-width: 1020px;
    @media screen and (max-width: 1023px) {
      width: 100%;
    }
    margin-bottom: 60px;
    position: relative;
    .search-bar {
      height: 70px;
      margin-bottom: 60px;
      background: #ffffff;
      box-shadow: 0px 6px 12px -6px rgba(24, 39, 75, 0.06),
        0px 6px 24px -4px rgba(24, 39, 75, 0.06);
      border-radius: 4px;
      width: 100%;
      input {
        width: 100%;
        border: none;
        outline: none;
        height: 80%;
      }
      .divider {
        width: 1px;
        height: 100%;
        background: #b3b3b3;
      }
    }
    .sort {
      margin-bottom: 40px;

      & > p {
        font-style: normal;
        font-weight: normal;
        font-size: 16px;
        line-height: 24px;
        /* identical to box height, or 150% */

        color: #a3a3a3;
      }
    }
    .select {
      width: 100%;
      overflow-x: auto;
      ::-webkit-scrollbar {
        height: 4px;
        width: 4px;
        background: rgba(0, 0, 0, 0.15);
      }
      ::-webkit-scrollbar-thumb:horizontal {
        background: var(--color-primary);
        border-radius: 4px;
      }
      div {
        min-width: max-content;
        cursor: pointer;
        &:nth-child {
          margin-right: 0 !important;
        }
      }
    }
    .campaigns {
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
    }
  }
`;
