import styled from "styled-components";
import AdminLayout from "../AdminLayout";
import Layout from "../../../components/Layout";
import CampaignSearch from "../../../components/adminCampaignPageComponents/campaignSearch";
import { useCallback, useState } from "react";
import axios from "axios";
import { useEffect } from "react";
import Spinner from "../../../components/composed/spinner/Spinner";
import { useRouter } from "next/router";
import Link from "next/link";
import AdminCampaignFundingRequest from "../../../components/adminCampaignPageComponents/adminCampaignFundingRequests";
import AdminCampaignContent from "../../../components/adminCampaignPageComponents/AdminCampaignContent";
import AdminCampaignTeam from "../../../components/adminCampaignPageComponents/AdminCampaignTeam";
import AdminFundingDetails from "../../../components/adminCampaignPageComponents/AdminFundingDetails";
import {
  addCommaToNumber,
  config,
  getDaysRemaining,
} from "../../../components/helperFunctions/helperFunctions";
import UpdateComponent from "../../../components/composed/UpdatesComponent";
import AdminSendEmailModal from "../../../components/composed/Modal/DefaultModal/AdminSendEmailModal";

import { toast } from "../../../../store/slices/ToastSlice";
import SuspendCampaignModal from "../../../components/composed/Modal/DefaultModal/SuspendCampaignModal";
import UnsuspendCampaignModal from "../../../components/composed/Modal/DefaultModal/UnsuspendCampaignModal";
import { useAppDispatch } from "./../../../../store/hooks";
import type {
  BasicInformation,
  CampaignFunding,
  CampaignTeam,
  CampaignUpdate,
} from "../../../types/campaign";

const navs = [
  "FUNDING REQUESTS",
  "UPDATES",
  "CONTENT",
  "TEAM",
  "FUNDING DETAILS",
];

interface AdminCampaignDetail {
  _id?: string;
  suspended?: boolean;
  basicInformation?: BasicInformation;
  funding: CampaignFunding;
  donations?: unknown[];
  updates?: CampaignUpdate[];
  fundingRequests?: unknown[];
  organizer?: string;
  organizerId?: string;
  organizerDetails?: { email?: string };
  team?: CampaignTeam;
}

export default function CampaignDetailsPage() {
  const [campaign, setCampaign] = useState<AdminCampaignDetail>(
    {} as AdminCampaignDetail
  );
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [view, setView] = useState(navs[0]);
  const [reload, setReload] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const dispatch = useAppDispatch();
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showUnsuspendModal, setShowUnsuspendModal] = useState(false);

  const getCampaign = useCallback(async () => {
    setLoading(true);

    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/campaign/${router.query.id}`,
        config()
      );
      res && setCampaign(res?.data?.data);
      res && setLoading(false);
    } catch (error) {
      setLoading(false);
      dispatch(toast(true, error?.response?.data?.error, "error"));
    }
  }, [router.query.id, dispatch]);

  useEffect(() => {
    router.query.id && getCampaign();
  }, [router, reload, getCampaign]);

  return (
    <Layout title="Fund&Trace | Admin">
      <AdminLayout active="Campaigns">
        <Wrapper className="mx-auto">
          <section>
            <CampaignSearch
              showDelete={() =>
                campaign?.suspended
                  ? setShowUnsuspendModal(true)
                  : setShowSuspendModal(true)
              }
              campaignTitle={campaign?.basicInformation?.campaignTitle}
              removeSearch
              deleteTitle={
                campaign?.suspended ? "Unsuspend Campaign" : "Suspend Campaign"
              }
            />
          </section>
          <section className="bordered-wrapper">
            <section className="section mx-auto flex-column d-flex align-items-center justify-content-around">
              {loading ? (
                <div className="my-5">
                  <Spinner
                    type="TailSpin"
                    width={30}
                    height={30}
                    color={"var(--color-primary)"}
                  />
                </div>
              ) : (
                <Section className="">
                  <article className="top py-4 px-4 d-flex justify-content-between align-items-start">
                    <div className="d-flex align-items-start">
                      <a role="button" onClick={() => router.back()}>
                        <img
                          src="/images/icons/back.svg"
                          alt="back button"
                          width="16px"
                          height="16px"
                        />
                      </a>

                      <div className="mx-4">
                        <img
                          src={campaign?.basicInformation?.campaignImage}
                          alt="campaignImages"
                          width="258px"
                        />
                      </div>
                      <div>
                        <h4 className="mb-3">
                          {campaign?.basicInformation?.campaignTitle}
                        </h4>
                        <div className="d-flex align-items-center mb-3">
                          <img
                            src="/images/icons/location.svg"
                            alt="location icon"
                            width="14px"
                          />
                          <p className="text-blue mb-0 ml-3">
                            {campaign?.basicInformation?.locationState},{" "}
                            {campaign?.basicInformation?.locationCountry}
                          </p>
                        </div>
                        <p className="mb-3 text-small">
                          {campaign?.basicInformation?.campaignTagline}
                        </p>
                        <div className="d-flex align-items-baseline">
                          <h3
                            className="text-heading mr-2"
                            style={{ fontSize: 16, lineHeight: "28px" }}
                          >
                            {campaign?.funding?.currency == "USD"
                              ? "$"
                              : campaign?.funding?.currency == "GBP"
                              ? "£"
                              : "₦"}
                            {addCommaToNumber(campaign?.funding?.amountRaised)}
                          </h3>
                          <p className="mb-0" style={{ fontWeight: "300" }}>
                            raised of{" "}
                            {campaign?.funding?.currency == "USD"
                              ? "$"
                              : campaign?.funding?.currency == "GBP"
                              ? "£"
                              : "₦"}
                            {addCommaToNumber(
                              campaign?.funding?.amountExpected
                            )}
                          </p>
                        </div>
                        <div
                          style={{ width: 368 }}
                          className={["progress mb-2"].join(" ")}
                        >
                          <div
                            className={["progress-bar"].join(" ")}
                            role="progressbar"
                            style={{
                              width: `${
                                (campaign?.funding?.amountRaised /
                                  campaign?.funding?.amountExpected) *
                                100
                              }%`,
                            }}
                            aria-valuenow={
                              (campaign?.funding?.amountRaised /
                                campaign?.funding?.amountExpected) *
                              100
                            }
                            aria-valuemin={0}
                            aria-valuemax={100}
                          ></div>
                        </div>
                        <div className="d-flex align-items-center">
                          <img
                            src="/images/icons/time.svg"
                            alt="time"
                            width="17.5px"
                            height="17.5px"
                            className="mr-2"
                          />
                          <p className="mb-0" style={{ color: "#807373" }}>
                            {getDaysRemaining(campaign)} days left
                          </p>
                        </div>
                        <div className="d-flex align-items-center mt-3">
                          <p
                            className="mr-3 mb-0"
                            style={{
                              fontWeight: "300",
                            }}
                          >
                            <span
                              style={{ fontWeight: "600", color: "#000000" }}
                            >
                              {campaign?.donations?.length}
                            </span>{" "}
                            donors
                          </p>
                          <p
                            className="mb-0"
                            style={{
                              fontWeight: "300",
                            }}
                          >
                            <span
                              style={{ fontWeight: "600", color: "#000000" }}
                            >
                              0
                            </span>{" "}
                            shares
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="ml-auto d-flex flex-column">
                      <button
                        className="btn sendBtn mb-3"
                        onClick={() => setShowModal(true)}
                      >
                        Send Email
                      </button>
                      <Link
                        href={`/campaign/${campaign?._id}/tracker`}
                        passHref
                      >
                        <button className="btn sendBtn">Track Campaign</button>
                      </Link>
                    </div>
                  </article>
                  <article className="bottom">
                    <div className="bottom-nav d-flex align-items-center mb-4 justify-content-center ">
                      {navs.map((nav, i) => (
                        <div
                          key={i}
                          className="mx-4 h-100 position-relative d-flex align-items-center justify-content-center"
                          onClick={() => setView(nav)}
                          role="button"
                        >
                          {nav == view && (
                            <div
                              className="w-100 position-absolute"
                              style={{
                                height: 3,
                                bottom: "-1px",
                                background: "var(--color-primary)",
                              }}
                            ></div>
                          )}
                          <h5
                            className="mb-0"
                            style={{
                              fontWeight: view == nav ? 600 : 400,
                              color: view == nav ? "var(--color-primary)" : "#B3B3B3",
                              cursor: "pointer",
                              fontSize: 16,
                            }}
                          >
                            {nav}
                          </h5>
                        </div>
                      ))}
                    </div>
                    <article className="detailsWrapper">
                      {view == "FUNDING REQUESTS" && (
                        <AdminCampaignFundingRequest
                          fundingRequests={campaign?.fundingRequests}
                          campaignDetail={{
                            campaignTitle:
                              campaign?.basicInformation?.campaignTitle,
                            organizer: campaign?.organizer,
                          }}
                          campaign={campaign}
                          reload={() => setReload(!reload)}
                        />
                      )}
                      {view == "UPDATES" && (
                        <section>
                          <div>
                            {campaign?.updates?.length ? (
                              <div>
                                {campaign?.updates?.map((update, i) => (
                                  <UpdateComponent key={i} update={update} />
                                ))}
                              </div>
                            ) : (
                              <div>
                                <h2
                                  className="text-center"
                                  style={{ fontSize: 20 }}
                                >
                                  No Update yet!
                                </h2>
                              </div>
                            )}
                          </div>
                        </section>
                      )}
                      {view == "CONTENT" && (
                        <section>
                          <AdminCampaignContent campaign={campaign} />
                        </section>
                      )}
                      {view == "TEAM" && (
                        <section>
                          <AdminCampaignTeam campaign={campaign?.team} />
                        </section>
                      )}
                      {view == "FUNDING DETAILS" && (
                        <section>
                          <AdminFundingDetails
                            campaign={campaign?.funding}
                            card={campaign?.team?.primaryContact?.idImage}
                          />
                        </section>
                      )}
                    </article>
                  </article>
                </Section>
              )}
            </section>
          </section>
        </Wrapper>
        <AdminSendEmailModal
          showModal={showModal}
          onModalClose={() => setShowModal(false)}
          userEmail={campaign?.organizerDetails?.email}
          userName={campaign?.organizer}
        />

        <SuspendCampaignModal
          showModal={showSuspendModal}
          onModalClose={() => {
            setShowSuspendModal(false);
            setReload(!reload);
          }}
          campaign={campaign}
        />
        <UnsuspendCampaignModal
          showModal={showUnsuspendModal}
          onModalClose={() => {
            setShowUnsuspendModal(false);
            setReload(!reload);
          }}
          campaign={campaign}
        />
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
    // height: 100%;
    overflow-y: hidden;
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
    .section {
      width: 100%;
      min-width: 1160px;
      min-height: 400px;
      background: white;
    }
  }
`;

const Section = styled.section`
  width: 100%;
  .top {
    .sendBtn {
      background: var(--color-primary);
      border-radius: 4px;
      color: white;
      height: 36px !important;
      font-style: normal;
      font-weight: 500;
      font-size: 14px;
      line-height: 143%;
    }
    h4 {
      font-style: normal;
      font-weight: bold;
      font-size: 18px;
      line-height: 30px;
      color: #514949;
    }
    .progress {
      height: 5px !important;
      background-color: #697af821 !important;
    }
    .progressbar {
      background-color: var(--color-primary) !important;
    }
  }
  .bottom {
    .detailsWrapper {
      width: 100%;
      padding: 0 60px;
    }
    .bottom-nav {
      background: #ffffff;
      border-top: 0.5px solid #cccccc;
      border-bottom: 0.5px solid #cccccc;
      box-sizing: border-box;
      height: 76px;
      width: 100%;
      h5 {
        font-size: 18px;
      }
    }
  }
`;
