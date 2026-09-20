import axios from "axios";
import React, { useCallback, useEffect, useState } from "react";

import styled from "styled-components";
import { toast } from "../../../store/slices/ToastSlice";
import AdminUsersDetailCard from "../../components/adminCampaignPageComponents/AdminUsersDetailCard";
import AdminUsersHeader from "../../components/adminCampaignPageComponents/AminUsersHeader";
import CampaignSearch from "../../components/adminCampaignPageComponents/campaignSearch";
import Pagination from "../../components/composed/Pagination";
import Spinner from "../../components/composed/spinner/Spinner";
import { config } from "../../components/helperFunctions/helperFunctions";
import Layout from "../../components/Layout";
import AdminLayout from "./AdminLayout";
import { useAppDispatch } from "./../../../store/hooks";

const filters = ["Name: A to Z", "Name: Z to A", "Country"];

interface AdminUserRow {
  user?: Record<string, unknown>;
  count?: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("Name: A to Z");
  const [query, setQuery] = useState(1);
  const [count, setCount] = useState(1);
  const [search, setSearch] = useState("");

  const getQuery = () => {
    const nameQuery = { firstName: filter.includes("A to Z") ? 1 : -1 };
    const countryQuery = { country: 1, firstName: 1 };
    const returnedQuery =
      filter == "Country"
        ? JSON.stringify(countryQuery)
        : JSON.stringify(nameQuery);
    return returnedQuery;
  };

  const getSearchQuery = () => {
    const nameQuery = { firstName: { $regex: search, $options: "i" } };
    const countryQuery = {
      country: { $regex: `^${search}`, $options: "i" },
    };
    const returnedFilter =
      filter == "Country"
        ? JSON.stringify(countryQuery)
        : JSON.stringify(nameQuery);
    return returnedFilter;
  };

  const searchUser = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${
          process.env.NEXT_PUBLIC_API_URL
        }/api/admin/users/search/${query}?search=${getSearchQuery()}`,
        config()
      );
      res && setUsers(res?.data?.data?.users);
      res && setCount(res?.data?.data?.count);
      res && setLoading(false);
    } catch (error) {
      dispatch(toast(true, error?.response?.error));
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, search, filter]);

  useEffect(() => {
    search && searchUser();
  }, [search, searchUser]);

  const getAllUsers = useCallback(async () => {
    setLoading(true);

    try {
      const res = await axios.get(
        `${
          process.env.NEXT_PUBLIC_API_URL
        }/api/admin/users/${query}?queries=${getQuery()}`,
        config()
      );
      res && setUsers(res?.data?.data?.users);
      res && setCount(res?.data?.data?.count);
      res && setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, filter]);

  useEffect(() => {
    !search && getAllUsers();
  }, [query, filter, search, getAllUsers]);

  return (
    <Layout url="https://fundandtrace.com" ogImage="/og-image.jpg" title="Fund&Trace | Admin">
      <AdminLayout active="Users">
        <Wrapper className="mx-auto">
          <section>
            <CampaignSearch
              placeHolder={
                filter == "Country" ? "Search by country" : "Search by name"
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
          <section className="bordered-wrapper mx-auto">
            <section className="mx-auto">
              <AdminUsersHeader />
              {loading ? (
                <div className="my-5 mx-auto" style={{ width: "max-content" }}>
                  <Spinner
                    type="TailSpin"
                    width={30}
                    height={30}
                    color={"var(--color-primary)"}
                  />
                </div>
              ) : users?.length ? (
                users.map((user, i) => (
                  <AdminUsersDetailCard
                    key={i}
                    user={user?.user}
                    count={user?.count}
                    index={i + 1}
                  />
                ))
              ) : (
                <h2 className="text-center my-5" style={{ fontSize: 18 }}>
                  No User
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

const Wrapper = styled.main`
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
      width: 100%;
      min-width: 1160px;

      min-height: 300px;
      background: white;
    }
  }
`;
