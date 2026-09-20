import React, { useState } from "react";
import styled from "styled-components";
import DeleteModal from "../composed/Modal/DefaultModal/SuspendCampaignModal";

/**
 * @param {{showDelete?: any, campaignTitle?: any, filters?: any, placeHolder?: any, setFilter?: any, filter?: any, search?: any, setSearch?: any, removeSearch?: any, deleteTitle?: any, showEmail?: any, setEmail?: any, searchButton?: any, email?: any}} props
 */
export default function CampaignSearch({
  showDelete = undefined,
  campaignTitle = "",
  filters = [],
  placeHolder = "",
  setFilter = () => {},
  filter = "",
  search = "",
  setSearch = () => {},
  removeSearch = false,
  deleteTitle = "",
  showEmail = false,
  setEmail = () => {},
  searchButton = undefined,
  email = "",
}) {
  const [showFilter, setShowFilter] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  return (
    <Wrapper className="d-flex mb-5 align-items-center justify-content-between">
      <div className="d-flex align-items-center">
        {removeSearch ? (
          <div></div>
        ) : (
          <form className="search d-flex align-items-center justify-content-between mr-4">
            <input
              type="text"
              className="w-100 h-100"
              value={search}
              placeholder={placeHolder || "Search campaigns.."}
              onChange={(e) => setSearch(e.target.value)}
            />
            <img
              src="/images/icons/search.svg"
              alt="search icon"
              width="16px"
              height="16px"
              className=""
            />
          </form>
        )}
        {showEmail && (
          <form className="search d-flex align-items-center justify-content-between mr-4">
            <input
              type="text"
              className="w-100 h-100"
              value={email}
              placeholder={"Search email of donor.."}
              onChange={(e) => setEmail(e.target.value)}
            />
            <img
              src="/images/icons/search.svg"
              alt="search icon"
              width="16px"
              height="16px"
              className=""
            />
          </form>
        )}
        {filters && (
          <div className="filter d-flex align-items-center">
            <p className="mb-0 mr-3">Filter by</p>
            <Select className="d-flex align-items-center justify-content-between">
              <button
                className="d-flex align-items-center justify-content-between"
                onClick={() => setShowFilter(!showFilter)}
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
                    fontWeight: !filter ? 300 : "",
                    opacity: !filter ? 0.9 : 1,
                    fontSize: !filter ? 14 : 16,
                  }}
                >
                  {filter}
                </p>
                <img
                  src="/images/icons/dropdown.svg"
                  width={13}
                  height={8}
                  className="pt-0 ml-2"
                  alt="dropdown"
                />
              </button>

              {showFilter && (
                <div
                  onClick={() => setShowFilter(false)}
                  className="overlay"
                ></div>
              )}
              {showFilter && (
                <div className="dropdown bg-white">
                  {filters.map((filter, i) => (
                    <p
                      className="options py-3 mb-0 px-2"
                      key={i}
                      onClick={(e) => {
                        setFilter(filter);
                        setShowFilter(false);
                      }}
                      role="button"
                    >
                      {filter}
                    </p>
                  ))}
                </div>
              )}
            </Select>
          </div>
        )}
        {searchButton && (
          <button className="btn btn-small" onClick={searchButton}>
            Search
          </button>
        )}
      </div>
      {showDelete && (
        <button
          className="deleteBtn"
          onClick={() => showDelete && showDelete()}
        >
          {deleteTitle}
        </button>
      )}
      <DeleteModal
        showModal={showDeleteModal}
        onModalClose={() => setShowDeleteModal(false)}
        campaignTitle={campaignTitle}
      />
    </Wrapper>
  );
}

const Wrapper = styled.article`
  .deleteBtn {
    background: #ffebeb;
    border: 0.5px solid #f8444f;
    box-sizing: border-box;
    border-radius: 4px;
    padding: 0px 20px;
    height: 36px;

    font-style: normal;
    font-weight: normal;
    font-size: 14px;
    line-height: 16px;
    text-align: center;

    color: #f8444f;
  }
  .search {
    background: #ffffff;
    border: 0.5px solid #b3b3b3;
    box-sizing: border-box;
    border-radius: 4px;
    width: 283px;
    height: 36px;
    padding: 5px 10px;
    input {
      border-style: none;
      outline: none;
    }
  }

  .filter {
    p {
      font-style: normal;
      font-weight: normal;
      font-size: 14px;
      line-height: 16px;

      color: #665c5c;
    }
  }
`;

const Select = styled.div`
    min-width: 160px;
    height: 36px;
  position: relative;
  background: #FFFFFF;
    padding: 2px 5px;
  .value{
    p{
      font-size: 14px
    }
  }
  
    border: 0.5px solid #B3B3B3;
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
    width: max-content;
    max-height: 300px;
    overflow-y: scroll;
    p{
      font-size: 14px
    }
    left: -2px;
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
