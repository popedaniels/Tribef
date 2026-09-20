import React, { useEffect, useState } from "react";
import CampaignDashboardLayout from "./campaignDashboardLayout";
import PaymentHistoryCard from "../../../components/PaymentHistoryCard/PaymentHistoryCard";
import router from "next/router";
import type { GetServerSidePropsContext } from "next";
import { useFundingRequestForm } from "../../../hooks/useFundingRequestForm";
import { useFundingHistory } from "../../../hooks/useFundingHistory";
import { useStripeConnect } from "../../../hooks/useStripeConnect";
import { activeBtn, inactiveBtn } from "../../../constants/fundingRequestConstants";
import { Custom, Div, Wrapper, Main } from "../../../components/FundingRequest/FundingRequest.styles";
import { StripeConnectCard } from "../../../components/FundingRequest/StripeConnectCard";
import { FundingAmountInput } from "../../../components/FundingRequest/FundingAmountInput";
import { BalanceCard, IdCard } from "../../../components/FundingRequest/BalanceCard";
import type { FundingCampaign } from "../../../types/fundingRequest";
import { fetchCampaignById } from "../../../services/fundingRequestService";

interface FundingRequestProps {
  campaign: FundingCampaign | null;
  campaignId: GetServerSidePropsContext["query"]["id"];
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const campaignId = context.query.id;
  try {
    const campaign = await fetchCampaignById(campaignId as string);
    return {
      props: { campaign, campaignId },
    };
  } catch {
    return { props: { campaign: null, campaignId } };
  }
};

export default function FundingRequest({
  campaign,
  campaignId,
}: FundingRequestProps) {
  const [view, setView] = useState("funding");

  const {
    fundingRequest,
    setFundingRequest,
    fundingView,
    setFundingView,
    selectedFile,
    loading,
    showDropdown,
    setShowDropdown,
    refresh,
    handleSelect,
    handleSubmit,
    resetForFundingType,
    clearProof,
  } = useFundingRequestForm({ campaign, campaignId: campaignId as string });

  const { allFundings } = useFundingHistory(campaignId as string, refresh);

  const { stripeConnect, connectLoading, connectStripePayouts } = useStripeConnect(
    campaignId as string,
    campaign?.stripeConnect || {
      accountId: "",
      payoutsEnabled: false,
      detailsSubmitted: false,
    }
  );

  useEffect(() => {
    router.query.tab == "requests" && setView("history");
  }, []);

  return (
    <CampaignDashboardLayout
      active={4}
      campaignId={campaignId}
      title={campaign?.basicInformation?.campaignTitle}
      page="funding Request"
    >
      <div className="bg-white">
        <nav className="custom mx-auto" style={{ maxWidth: 1140 }}>
          <p className="text-blue mb-0">
            {campaign?.basicInformation?.campaignTitle} / FUNDING REQUESTS
          </p>

          <div
            className="d-lg-flex d-none align-items-center "
            style={{ minWidth: 350 }}
          >
            <button
              className="btn mr-4"
              onClick={() => setView("funding")}
              style={view == "funding" ? activeBtn : inactiveBtn}
            >
              Funding Request
            </button>

            <button
              className="btn"
              onClick={() => setView("history")}
              style={view == "history" ? activeBtn : inactiveBtn}
            >
              Funding History
            </button>
          </div>
        </nav>
      </div>
      <Div className="d-lg-none d-flex align-items-center mx-auto my-4 custom-container">
        <button
          className="btn btn1"
          onClick={() => setView("funding")}
          style={view == "funding" ? activeBtn : inactiveBtn}
        >
          Funding Request
        </button>

        <button
          className="btn btn2"
          onClick={() => setView("history")}
          style={view == "history" ? activeBtn : inactiveBtn}
        >
          Funding History
        </button>
      </Div>
      {view == "funding" ? (
        <>
          <Main
            className="custom mx-auto align-items-end"
            style={{ maxWidth: 1140 }}
          >
            <BalanceCard campaign={campaign} />
            <IdCard idImage={campaign?.team?.primaryContact?.idImage} />
          </Main>
          <Wrapper className="mx-auto" style={{ maxWidth: 1140 }}>
            <article className="custom">
              <StripeConnectCard
                stripeConnect={stripeConnect}
                connectLoading={connectLoading}
                onConnect={connectStripePayouts}
              />
              <div className="mb-5">
                <h2 className="text-heading mb-4">Make a Funding Request</h2>
                <p className="mb-4">
                  For Fund & Trace to start funding your cause, you would have
                  to make a request - one-off or monthly. Kindly view the links
                  for more details about fixed and flexible funding.
                </p>
                <div className="d-flex align-items-md-center flex-md-row flex-column">
                  <div className="mb-4 mr-md-5 d-flex">
                    <input
                      type="radio"
                      name="fixedflexible"
                      id="fixed"
                      checked={fundingView == "fixed"}
                      onChange={() => resetForFundingType("fixed", "one-off")}
                    />
                    <label htmlFor="fixed">One-Off funding</label>
                  </div>
                  <div className="mb-4 d-flex mr-5">
                    <input
                      type="radio"
                      name="fixedflexible"
                      id="flexible"
                      checked={fundingView == "flexible"}
                      onChange={() => resetForFundingType("flexible", "monthly")}
                    />
                    <label htmlFor="flexible">Monthly Funding</label>
                  </div>
                  <div className="mb-4 d-flex">
                    <input
                      type="radio"
                      name="fixedflexible"
                      id="third"
                      checked={fundingView == "third"}
                      onChange={() => resetForFundingType("third", "third-party")}
                    />
                    <label htmlFor="third">Third party payment request</label>
                  </div>
                </div>
              </div>
              {fundingView == "fixed" && (
                <div className="w-100">
                  <h2 className="text-medium-heading mb-4">Fixed Funding</h2>
                  <p className="mb-4 text-small">
                    This type of funding request is for when you intend to
                    withdraw all of the funds raised for the campaign.
                  </p>
                  <div className="mb-5">
                    <h2 className="text-medium mb-4">Amount</h2>
                    <p className="mb-4">Total amount raised for campaign</p>
                    <FundingAmountInput
                      value={fundingRequest.amount}
                      currency={campaign?.funding?.currency}
                      max={campaign?.funding?.amountRaised}
                      onChange={(val) => setFundingRequest({ ...fundingRequest, amount: val })}
                      onShowDropdown={() => setShowDropdown(!showDropdown)}
                    />
                  </div>

                  <h6 className="mb-3">Purpose Of Funding</h6>
                  <p className="text-small">
                    Provide more details on what the money is to be used for
                  </p>
                  <textarea
                    name="mail"
                    id="mail"
                    value={fundingRequest?.purposeOfFunding}
                    onChange={(e) =>
                      setFundingRequest({
                        ...fundingRequest,
                        purposeOfFunding: e.target.value,
                      })
                    }
                    className="mb-4"
                    style={{ height: 181 }}
                  ></textarea>
                  <h6 className="mb-3">Verifable Proof Of Funding</h6>
                  <p className="text-small">
                    Kindly provide any proof that is related to the funding
                    cause. Images/Videos could range from invoices, pictures of
                    the beneficiaries and so on
                  </p>
                  {fundingRequest?.proofOfFunding == "" && !selectedFile && (
                    <div className="file d-flex align-items-center justify-content-center">
                      <label
                        className="d-flex flex-column align-items-center"
                        style={{ cursor: "pointer" }}
                        htmlFor="pic"
                      >
                        <img
                          src="/images/icons/uploadImage.svg"
                          alt="fundandtraceLogo"
                          width={32}
                          height={32}
                          className="mb-2"
                        />
                        <p className="text-blue mb-0">Capture Live Proof (Photo / Video)</p>
                        <input
                          type="file"
                          accept="image/*,video/*"
                          capture="environment"
                          className="d-none"
                          name="pic"
                          id="pic"
                          onChange={handleSelect}
                        />
                      </label>
                    </div>
                  )}
                  <div className="d-flex align-items-md-center flex-column flex-md-row">
                    <div
                      className="file mt-3"
                      style={{
                        height: "auto",
                        border: "none",
                        borderRadius: "none",
                        background: "transparent",
                      }}
                    >
                      {loading && <p className="text-blue">Uploading...</p>}

                      {fundingRequest?.proofOfFunding != "" && !selectedFile ? (
                        <img
                          src={fundingRequest?.proofOfFunding}
                          alt="image"
                          style={{
                            width: "100%",
                            objectFit: "cover",
                            maxHeight: 200,
                          }}
                        />
                      ) : (
                        selectedFile && (
                          <img
                            src={selectedFile}
                            alt="image"
                            style={{
                              width: "100%",
                              objectFit: "cover",
                              maxHeight: 200,
                            }}
                          />
                        )
                      )}
                    </div>
                    {fundingRequest?.proofOfFunding != "" && (
                      <div className="ml-0 ml-md-4 mt-4 mt-md-0">
                        <div
                          className="d-flex align-items-center"
                          onClick={clearProof}
                          role="button"
                        >
                          <img
                            src="/images/icons/deleteIcon.svg"
                            alt="delete"
                            width={20}
                            height={20}
                          />
                          <p className="text-small text-danger mb-0 ml-3">
                            Delete
                          </p>
                        </div>
                        <label
                          className="d-flex align-items-center mt-3"
                          htmlFor="pic"
                        >
                          <img
                            src="/images/icons/uploadImage.svg"
                            alt="fundandtraceLogo"
                            width={20}
                            height={20}
                            className=""
                          />
                          <p className="text-small text-blue mb-0 ml-3">
                            Upload Image
                          </p>
                          <input
                            type="file"
                            accept="image/*"
                            className="d-none"
                            name="pic"
                            id="pic"
                            onChange={handleSelect}
                          />
                        </label>
                      </div>
                    )}
                  </div>

                  <button
                    className="bluebtn btn text-white mt-5"
                    onClick={handleSubmit}
                    disabled={
                      fundingRequest.amount >
                      Number(campaign?.funding?.amountRaised)
                        ? true
                        : false
                    }
                  >
                    Make a Funding Request
                  </button>
                </div>
              )}
              {fundingView == "flexible" && (
                <div className="w-100">
                  <h2 className="text-medium-heading mb-4">Monthly Funding</h2>
                  <p className="text-small mb-4">
                    This type of funding is for when you intend to request that
                    some of the funds raised be withdrawn once a month e.g.
                    paying salaries from funds donated.
                  </p>
                  <div className="mb-5">
                    <h2 className="text-medium mb-4">Amount</h2>
                    <p className="mb-4">Total amount raised for campaign</p>
                    <FundingAmountInput
                      value={fundingRequest.amount}
                      currency={campaign?.funding?.currency}
                      max={campaign?.funding?.amountRaised}
                      onChange={(val) => setFundingRequest({ ...fundingRequest, amount: val })}
                      onShowDropdown={() => setShowDropdown(!showDropdown)}
                    />
                  </div>

                  <h6 className="mb-3">Purpose Of Funding</h6>
                  <p className="text-small">
                    Provide more details on what the money is to be used for
                  </p>
                  <textarea
                    name="mail"
                    id="mail"
                    value={fundingRequest?.purposeOfFunding}
                    onChange={(e) =>
                      setFundingRequest({
                        ...fundingRequest,
                        purposeOfFunding: e.target.value,
                      })
                    }
                    className="mb-4"
                    style={{ height: 181 }}
                  ></textarea>
                  <h6 className="mb-3">Verifable Proof Of Funding</h6>
                  <p className="text-small">
                    Kindly provide any proof that is related to the funding
                    cause. Images/Videos could range from invoices, pictures of
                    the beneficiaries and so on
                  </p>
                  {fundingRequest?.proofOfFunding == "" && !selectedFile && (
                    <div className="file d-flex align-items-center justify-content-center">
                      <label
                        className="d-flex flex-column align-items-center"
                        style={{ cursor: "pointer" }}
                        htmlFor="pic"
                      >
                        <img
                          src="/images/icons/uploadImage.svg"
                          alt="fundandtraceLogo"
                          width={32}
                          height={32}
                          className="mb-2"
                        />
                        <p className="text-blue mb-0">Upload Image</p>
                        <input
                          type="file"
                          accept="image/*"
                          className="d-none"
                          name="pic"
                          id="pic"
                          onChange={handleSelect}
                        />
                      </label>
                    </div>
                  )}
                  <div className="d-flex align-items-md-center flex-column flex-md-row">
                    <div
                      className="file mt-3"
                      style={{
                        height: "auto",
                        border: "none",
                        borderRadius: "none",
                        background: "transparent",
                      }}
                    >
                      {loading && <p className="text-blue">Uploading...</p>}

                      {fundingRequest?.proofOfFunding != "" && !selectedFile ? (
                        <img
                          src={fundingRequest?.proofOfFunding}
                          alt="image"
                          style={{
                            width: "100%",
                            objectFit: "cover",
                            maxHeight: 200,
                          }}
                        />
                      ) : (
                        selectedFile && (
                          <img
                            src={selectedFile}
                            alt="image"
                            style={{
                              width: "100%",
                              objectFit: "cover",
                              maxHeight: 200,
                            }}
                          />
                        )
                      )}
                    </div>
                    {fundingRequest?.proofOfFunding != "" && (
                      <div className="ml-0 ml-md-4 mt-4 mt-md-0">
                        <div
                          className="d-flex align-items-center"
                          onClick={clearProof}
                          role="button"
                        >
                          <img
                            src="/images/icons/deleteIcon.svg"
                            alt="delete"
                            width={20}
                            height={20}
                          />
                          <p className="text-small text-danger mb-0 ml-3">
                            Delete
                          </p>
                        </div>
                        <label
                          className="d-flex align-items-center mt-3"
                          htmlFor="pic"
                        >
                          <img
                            src="/images/icons/uploadImage.svg"
                            alt="fundandtraceLogo"
                            width={20}
                            height={20}
                            className=""
                          />
                          <p className="text-small text-blue mb-0 ml-3">
                            Upload Image
                          </p>
                          <input
                            type="file"
                            accept="image/*"
                            className="d-none"
                            name="pic"
                            id="pic"
                            onChange={handleSelect}
                          />
                        </label>
                      </div>
                    )}
                  </div>

                  <button
                    className="bluebtn btn text-white mt-5"
                    onClick={handleSubmit}
                    disabled={
                      fundingRequest.amount >
                      Number(campaign?.funding?.amountRaised)
                        ? true
                        : false
                    }
                  >
                    Make a Funding Request
                  </button>
                </div>
              )}
              {fundingView == "third" && (
                <div className="w-100">
                  <h2 className="text-medium-heading mb-4">
                    Third party Funding
                  </h2>
                  <p className="text-small mb-4">
                    This type of funding request is for when you intend to
                    transfer some or all of the funds donated to the third party
                    for which the campaign was created for e.g. paying medical
                    bills to a hospital.
                  </p>
                  <div className="mb-5">
                    <h2 className="text-medium mb-4">Amount</h2>
                    <p className="mb-4">Total amount raised for campaign</p>
                    <FundingAmountInput
                      value={fundingRequest.amount}
                      currency={campaign?.funding?.currency}
                      max={campaign?.funding?.amountRaised}
                      onChange={(val) => setFundingRequest({ ...fundingRequest, amount: val })}
                      onShowDropdown={() => setShowDropdown(!showDropdown)}
                    />
                  </div>

                  <h6 className="mb-3">Purpose Of Funding</h6>
                  <p className="text-small">
                    Provide more details on what the money is to be used for
                  </p>
                  <textarea
                    name="mail"
                    id="mail"
                    value={fundingRequest?.purposeOfFunding}
                    onChange={(e) =>
                      setFundingRequest({
                        ...fundingRequest,
                        purposeOfFunding: e.target.value,
                      })
                    }
                    className="mb-5"
                    style={{ height: 181 }}
                  ></textarea>
                  <div className="thirdparty w-100 mb-3">
                    <h6 className=" mb-5">Third party Account information</h6>
                    <div className="d-flex justify-content-between align-items-center flex-column flex-md-row">
                      <div className="thirdinput">
                        <h6>Account number</h6>
                        <input
                          type="number"
                          name="account"
                          id="account"
                          min="1"
                          value={
                            fundingRequest?.thirdPartyAccountNumber == 0 ||
                            fundingRequest?.thirdPartyAccountNumber
                              ?.toString()
                              .includes("-")
                              ? ""
                              : fundingRequest?.thirdPartyAccountNumber
                          }
                          onChange={(e) =>
                            setFundingRequest({
                              ...fundingRequest,
                              thirdPartyAccountNumber: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div className="thirdinput">
                        <h6>Account name</h6>
                        <input
                          type="text"
                          name="account"
                          id="account"
                          value={fundingRequest?.thirdPartyAccountName}
                          onChange={(e) =>
                            setFundingRequest({
                              ...fundingRequest,
                              thirdPartyAccountName: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="d-flex justify-content-between align-items-center flex-column flex-md-row">
                      <div className="thirdinput">
                        <h6>Bank name</h6>
                        <input
                          type="text"
                          name="account"
                          id="account"
                          value={fundingRequest?.thirdPartyBankName}
                          onChange={(e) =>
                            setFundingRequest({
                              ...fundingRequest,
                              thirdPartyBankName: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="thirdparty w-100">
                    <h6 className=" mb-3">Reference</h6>
                    <p className="text-small mb-4">
                      Provide contact of a reference from the third party we can
                      contact to verify this information e.g. Call line of a
                      hospital, email address of the school.{" "}
                    </p>
                    <div className="d-flex justify-content-between align-items-center flex-column flex-md-row">
                      <div className="thirdinput">
                        <input
                          type="text"
                          name="reference"
                          id="reference"
                          value={fundingRequest?.thirdPartyNameOfRef}
                          onChange={(e) =>
                            setFundingRequest({
                              ...fundingRequest,
                              thirdPartyNameOfRef: e.target.value,
                            })
                          }
                          placeholder="Name of reference"
                        />
                      </div>
                      <div className="thirdinput">
                        <input
                          type="text"
                          name="reference"
                          id="reference"
                          value={fundingRequest?.thirdPartyContact}
                          onChange={(e) =>
                            setFundingRequest({
                              ...fundingRequest,
                              thirdPartyContact: e.target.value,
                            })
                          }
                          placeholder="Phone number or email address"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    className="bluebtn btn text-white mt-5"
                    onClick={handleSubmit}
                    disabled={
                      fundingRequest.amount >
                      Number(campaign?.funding?.amountRaised)
                        ? true
                        : false
                    }
                  >
                    Make a Funding Request
                  </button>
                </div>
              )}
              {fundingView == "success" && (
                <div>
                  <h6 className="mb-5">
                    Your request is being processed. You’ll be notified within
                    the next 48 hours.
                  </h6>
                  <p className="text-small mb-3">
                    Would you like to make another request?
                  </p>
                  <button
                    className="bluebtn btn text-white"
                    onClick={() => setFundingView("")}
                  >
                    Make a Funding Request
                  </button>
                </div>
              )}
            </article>
          </Wrapper>
        </>
      ) : (
        <Custom className="mt-5 mb-5">
          <h2 className="text-medium-heading mb-4">Funding History</h2>
          {allFundings?.length ? (
            allFundings.map((campaign, i) => (
              <PaymentHistoryCard
                fundingRequest={campaign}
                key={i}
                last={i == allFundings.length - 1 && "last"}
              />
            ))
          ) : (
            <div>
              <h2 className="text-heading text-center">
                {" "}
                No Funding Request Yet!
              </h2>
            </div>
          )}
        </Custom>
      )}
    </CampaignDashboardLayout>
  );
}
