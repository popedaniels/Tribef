import styled from "styled-components";
import AdminLayout from "../AdminLayout";
import Layout from "../../../components/Layout";
import { useCallback, useState } from "react";
import axios from "axios";
import { useEffect } from "react";
import Spinner from "../../../components/composed/spinner/Spinner";
import { useRouter } from "next/router";
import Link from "next/link";
import { config } from "../../../components/helperFunctions/helperFunctions";
import ApproveCampaignModal from "../../../components/composed/Modal/DefaultModal/ApproveCampaignModal";
import DeclineCampaignModal from "../../../components/composed/Modal/DefaultModal/DeclineCampaignModal";
import type { BasicInformation } from "../../../types/campaign";

interface FundingRequestDetail {
  _id?: string;
  organizerId?: string;
  status?: string;
  currency?: string;
  amount?: number;
  createdAt: string;
  fundingType?: string;
  purposeOfFunding?: string;
  proofOfFunding?: string;
  declineReason?: string;
  campaign?: {
    _id?: string;
    organizer?: string;
    basicInformation?: BasicInformation;
  };
}

export default function FundingRequestDetailPage() {
  const [fundingRequest, setFundingRequest] = useState<FundingRequestDetail>(
    {} as FundingRequestDetail
  );
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [approveModal, setApproveModal] = useState(false);
  const [declineModal, setDeclineModal] = useState(false);
  const [reload, setReload] = useState(false);

  const getFundingRequest = useCallback(async () => {
    setLoading(true);

    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/fundingRequest/${router.query.id}`,
        config()
      );
      res && setFundingRequest(res?.data?.data);
      res && setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  }, [router.query.id]);

  useEffect(() => {
    router.query.id && getFundingRequest();
  }, [router, reload, getFundingRequest]);

  return (
    <Layout title="Fund&Trace | Admin">
      <AdminLayout active="Funding Requests">
        <Wrapper className="mx-auto">
          <section className="bordered-wrapper">
            <section className="section mx-auto">
              {loading ? (
                <div className="my-5 d-flex justify-content-center">
                  <Spinner
                    type="TailSpin"
                    width={30}
                    height={30}
                    color={"var(--color-primary)"}
                  />
                </div>
              ) : (
                <Section className="w-100">
                  <article className="w-100 py-4 px-4 d-flex align-items-start">
                    <a onClick={() => router.back()} role="button">
                      <img
                        src="/images/icons/back.svg"
                        alt="back button"
                        width="16px"
                        height="16px"
                      />
                    </a>

                    <div className="mx-4">
                      <img
                        src={
                          fundingRequest?.campaign?.basicInformation
                            ?.campaignImage
                        }
                        alt="userImages"
                        width="162px"
                        height="158px"
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                    <div className="w-100">
                      <div className="d-flex justify-content-between align-items-center">
                        <h3 className="mb-3">
                          {
                            fundingRequest?.campaign?.basicInformation
                              ?.campaignTitle
                          }
                        </h3>
                        <div className="d-flex flex-column ml-auto mb-4">
                          <div
                            className={[
                              "text-small mb-0 mr-3 d-flex align-items-center status mb-3",
                            ].join(" ")}
                            style={{
                              background:
                                fundingRequest?.status == "Approved"
                                  ? "#17D37B"
                                  : fundingRequest?.status == "Pending"
                                  ? "#EFC109"
                                  : "#FF5050",
                            }}
                          >
                            <img
                              src={`/images/icons/${
                                fundingRequest?.status == "Approved"
                                  ? "checkWhite"
                                  : fundingRequest?.status == "Pending"
                                  ? "pendingWhite"
                                  : "rejectedWhite"
                              }.svg`}
                              width="15"
                              height="13"
                              alt="PaymentHistoryIcon"
                              className="mr-2 mr-md-3"
                            />
                            <p className="mb-0">{fundingRequest?.status}</p>
                          </div>
                          <div>
                            <Link
                              href={`/campaign/${fundingRequest?.campaign?._id}/tracker`}
                              passHref
                            >
                              <button className="btn acceptButton">
                                Track Campaign
                              </button>
                            </Link>
                          </div>
                        </div>
                      </div>
                      <div className="d-flex align-items-center mb-3">
                        <img
                          src="/images/icons/location.svg"
                          alt="location icon"
                          width="14px"
                        />
                        <p className="text-blue mb-0 ml-3">
                          {
                            fundingRequest?.campaign?.basicInformation
                              ?.locationState
                          }
                          ,{" "}
                          {
                            fundingRequest?.campaign?.basicInformation
                              ?.locationCountry
                          }
                        </p>
                      </div>
                      <div className="mb-4">
                        <h2 className="">
                          {fundingRequest?.currency == "USD"
                            ? "$"
                            : fundingRequest?.currency == "GBP"
                            ? "£"
                            : "₦"}
                          {fundingRequest?.amount}
                        </h2>
                        <p
                          className="text-small mb-0"
                          style={{ whiteSpace: "pre-wrap" }}
                        >
                          {new Date(
                            fundingRequest?.createdAt
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="mb-4">
                        <h4 className="">Type of Funding</h4>
                        <p
                          className="text-small mb-0"
                          style={{ whiteSpace: "pre-wrap" }}
                        >
                          {fundingRequest?.fundingType}
                        </p>
                      </div>
                      <div className="mb-4">
                        <h4 className="">Purpose of Funding</h4>
                        <p
                          className="text-small mb-0"
                          style={{ whiteSpace: "pre-wrap" }}
                        >
                          {fundingRequest?.purposeOfFunding}
                        </p>
                      </div>
                      <div>
                        <h4 className="">Proof of Funding</h4>
                        <div className="image__div">
                          <img src={fundingRequest?.proofOfFunding} alt="" />
                        </div>
                      </div>
                      {fundingRequest?.declineReason &&
                        fundingRequest?.declineReason != "" && (
                          <div className="mt-4">
                            <h4>Reason for decline</h4>
                            <p
                              className="text-small mb-0"
                              style={{ whiteSpace: "pre-wrap" }}
                            >
                              {fundingRequest?.declineReason}
                            </p>
                          </div>
                        )}
                      {/* */}
                      {fundingRequest?.status == "Pending" && (
                        <div className="d-flex align-items-center mt-4">
                          <button
                            className="acceptButton"
                            onClick={() => setApproveModal(true)}
                          >
                            Approve
                          </button>
                          <button
                            className="deleteButton"
                            onClick={() => setDeclineModal(true)}
                          >
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                </Section>
              )}
            </section>
          </section>
          <ApproveCampaignModal
            showModal={approveModal}
            organizer={
              fundingRequest?.campaign?.organizer as unknown as undefined
            }
            fundingRequest={fundingRequest}
            onModalClose={() => setApproveModal(false)}
            reload={() => setReload(!reload)}
          />
          <DeclineCampaignModal
            showModal={declineModal}
            organizer={fundingRequest?.campaign?.organizer}
            id={fundingRequest?._id}
            organizerId={fundingRequest?.organizerId}
            onModalClose={() => setDeclineModal(false)}
            reload={() => setReload(!reload)}
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
    height: 100%;
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
      min-height: 600px;
      max-height: 100%;
      background: white;
    }
  }
`;

const Section = styled.section`
  width: 100%;
  h3 {
    font-style: normal;
    font-weight: bold;
    font-size: 18px;
    line-height: 30px;
    color: #514949;
  }
  h2 {
    font-style: normal;
    font-weight: bold;
    font-size: 24px;
    line-height: 28px;
    color: #514949;
  }
  h4 {
    font-style: normal;
    font-weight: 500;
    font-size: 16px;
    line-height: 28px;
    color: #514949;
  }
  .acceptButton {
    background: var(--color-primary);
    border-radius: 4px;
    margin-right: 30px;
    border: none;
    outline: none;
    color: white !important;
    height: 36px !important;
    width: 124px !important;
    padding: 0 !important;
    font-style: normal;
    font-weight: 500;
    font-size: 14px;
  }
  .deleteButton {
    background: #fff1f1 !important;
    border: 0.5px solid #ff5050 !important;
    box-sizing: border-box;
    border-radius: 4px;
    color: #ff5050 !important;
    height: 36px !important;
    width: 124px !important;
    padding: 0 !important;
    font-style: normal;
    font-weight: 500;
    font-size: 14px;
  }
  .image__div {
    margin-top: 16px;

    img {
      width: 158px;
      height: 136px;

      @media screen and (max-width: 767px) {
        margin-top: 20px;
      }

      object-fit: cover;
      margin-right: 20px;
    }
  }
  .status {
    padding: 5px 20px;
    border-radius: 4px;
    color: white;

    @media screen and (max-width: 767px) {
      padding: 3px 10px;
    }
  }
`;
