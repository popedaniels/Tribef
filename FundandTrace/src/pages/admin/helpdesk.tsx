import styled from "styled-components";
import AdminLayout from "./AdminLayout";
import Layout from "../../components/Layout";
import CampaignSearch from "../../components/adminCampaignPageComponents/campaignSearch";
import { FormEvent, useState } from "react";
import axios from "axios";
import { useEffect } from "react";
import Spinner from "../../components/composed/spinner/Spinner";
import { config } from "../../components/helperFunctions/helperFunctions";
import SupportCard from "../../components/adminCampaignPageComponents/SupportCard";
import dayjs from "dayjs";

import { toast } from "../../../store/slices/ToastSlice";
import { useAppDispatch } from "./../../../store/hooks";

const filters = ["Time"];

interface SupportMessage {
  _id?: string;
  fullName?: string;
  email?: string;
  submittedAt?: string | Date;
  subject?: string;
  message?: string;
}

export default function AdminCampaignPage() {
  const [supports, setSupports] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Time");
  const [query, setQuery] = useState(1);
  const [count, setCount] = useState(1);
  const [search, setSearch] = useState("");
  const [displaySupport, setDisplaySupport] = useState<SupportMessage | null>(
    null
  );
  const [reload, setReload] = useState(false);
  const dispatch = useAppDispatch();
  const [replyMessage, setReplyMessage] = useState("");

  const handleDelete = async () => {
    try {
      const res = await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/supports/support/delete/${displaySupport?._id}`,
        config()
      );
      res && dispatch(toast(true, res?.data?.data, "success"));
      res && setReload(!reload);
    } catch (error) {
      dispatch(toast(true, "Server Error", "error"));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/supports/support/reply/${displaySupport?._id}`,
        { message: replyMessage },
        config()
      );
      res && dispatch(toast(true, res?.data?.data, "success"));
      res && setReplyMessage("");
    } catch (error) {
      dispatch(toast(true, "Server Error", "error"));
    }
  };

  //   const getQuery = () => {
  //     const locationQuery = {
  //       "basicInformation.locationCountry": {
  //         $regex: `^${search}`,
  //         $options: "i",
  //       },
  //     };

  //     const categoryQuery = { category: { $regex: `${search}`, $options: "i" } };
  //     const sort = {
  //       "funding.amountRaised": "desc",
  //       locationCountry: "desc",
  //       category: "desc",
  //       _id: "desc",
  //     };
  //     const returnedQuery =
  //       filter == "Location"
  //         ? { query: locationQuery, sort: sort }
  //         : filter == "Category"
  //         ? { query: categoryQuery, sort: sort }
  //         : filter.includes("High")
  //         ? { query: {}, sort: { "funding.amountRaised": "desc", _id: "desc" } }
  //         : filter.includes("Low")
  //         ? {
  //             query: {},
  //             sort: { "funding.amountRaised": "asc", _id: "desc" },
  //           }
  //         : {
  //             query: {
  //               "basicInformation.campaignTitle": {
  //                 $regex: `^${search}`,
  //                 $options: "i",
  //               },
  //             },
  //             sort: { _id: "desc" },
  //           };
  //     return JSON.stringify(returnedQuery);
  //   };

  const getAllSupports = async () => {
    setLoading(true);

    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/supports`,
        config()
      );
      //   const res = await axios.get(
      //     `${
      //       process.env.NEXT_PUBLIC_API_URL
      //     }/api/supports/campaigns/${query}?queries=${getQuery()}`,
      //     config()
      //   );
      res && setSupports(res?.data?.data?.supports);
      res && setCount(res?.data?.data?.count);
      res && setDisplaySupport(res?.data?.data?.supports[0]);
      res && setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllSupports();
  }, [query, filter, search, reload]);

  return (
    <Layout title="Fund&Trace | Admin">
      <AdminLayout active="Help Desk">
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
            <section className="mx-auto d-flex">
              <aside className="border-right">
                {loading ? (
                  <div className="my-5 d-flex align-items-center justify-content-center">
                    <Spinner
                      type="TailSpin"
                      width={30}
                      height={30}
                      color={"var(--color-primary)"}
                    />
                  </div>
                ) : supports?.length ? (
                  supports.map((support, i) => (
                    <SupportCard
                      key={i}
                      support={support}
                      setSupport={(support: SupportMessage) =>
                        setDisplaySupport(support)
                      }
                    />
                  ))
                ) : (
                  <h2 className="text-center my-5" style={{ fontSize: 18 }}>
                    No message
                  </h2>
                )}
              </aside>
              <main className="p-4">
                {loading ? (
                  <div className="my-5 d-flex align-items-center justify-content-center">
                    <Spinner
                      type="TailSpin"
                      width={30}
                      height={30}
                      color={"var(--color-primary)"}
                    />
                  </div>
                ) : (
                  <>
                    {!displaySupport ? (
                      <div className="mx-auto pt-4" style={{ width: "60%" }}>
                        {" "}
                        <h2 className="text-medium text-center">
                          No support tickets
                        </h2>
                        <img
                          src="/images/noDonations.png"
                          alt="noDonations"
                          className="image"
                          width="100%"
                        />
                      </div>
                    ) : (
                      <>
                        <article className="d-flex justify-content-between align-items-start">
                          <div className="d-flex align-items-start">
                            <img
                              src="/images/larry.jpg"
                              alt="sender's image"
                              className="pt-1"
                              style={{ width: 40, borderRadius: "50%" }}
                            />
                            <div className="ml-3">
                              <h4 className="mb-0">
                                {displaySupport?.fullName}
                              </h4>
                              <p>{displaySupport?.email}</p>
                            </div>
                          </div>
                          <div className="d-flex align-items-center">
                            <p className="mb-0">
                              {dayjs(displaySupport?.submittedAt).format(
                                "MMM D, YYYY hh:mmA"
                              )}
                            </p>
                            <img
                              src="/images/icons/deskBack.svg"
                              width="20px"
                              alt="help desk icon"
                              className="ml-3"
                              data-toggle="tooltip"
                              data-placement="bottom"
                              title="Reply"
                              role="button"
                            />
                            <img
                              src="/images/icons/deskRead.svg"
                              width="20px"
                              alt="help desk icon"
                              className="ml-3"
                              title="Mark as read"
                              role="button"
                            />
                            <img
                              src="/images/icons/deskDelete.svg"
                              width="20px"
                              alt="help desk icon"
                              className="ml-3"
                              role="button"
                              onClick={handleDelete}
                              title="Delete"
                            />
                          </div>
                        </article>
                        <article>
                          <h4>{displaySupport?.subject}</h4>
                          <p>{displaySupport?.message}</p>
                        </article>
                        <form
                          className="input-div p-4 border"
                          onSubmit={handleSubmit}
                        >
                          <textarea
                            id="message"
                            name="message"
                            placeholder="Click here to Reply or Forward"
                            value={replyMessage}
                            onChange={(e) => setReplyMessage(e.target.value)}
                          ></textarea>
                          <div className="d-flex justify-content-between align-items-center mt-3">
                            <div className="d-flex align-items-center">
                              <img
                                src="/images/icons/deskFile.svg"
                                width="20px"
                                alt="help desk icon"
                                className="mr-3"
                                role="button"
                                title="Attachments"
                              />
                              <img
                                src="/images/icons/deskPicture.svg"
                                width="20px"
                                alt="help desk icon"
                                className="mr-3"
                                title="images"
                                role="button"
                              />
                            </div>
                            <button className="text-white btn">Send</button>
                          </div>
                        </form>
                      </>
                    )}
                  </>
                )}
              </main>
            </section>
          </section>
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
      max-width: 100%;
      min-height: 400px;
      background: white;
      aside {
        min-width: 350px;
        max-width: 350px;
      }
      main {
        width: 100%;
        .input-div {
          width: 100%;
          border-radius: 4px;
          background: #ffffff;
          box-shadow: 0px 2px 24px rgba(229, 229, 229, 0.4);
          button {
            background: var(--color-primary);
            padding: 10px 40px;
            border-radius: 4px;
          }
          textarea {
            background: white;

            border-radius: 4px;
            width: 100%;
            height: 200px;
            padding: 15px 20px;
          }
        }
        h4 {
          font-style: normal;
          font-weight: 500;
          font-size: 16px;
          line-height: 30px;
          color: #514949;
        }
        p {
          font-style: normal;
          font-weight: normal;
          font-size: 14px;
          line-height: 30px;
          color: #a3a3a3;
        }
      }
    }
  }
`;
