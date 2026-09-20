import React, { useEffect, useState } from "react";
import TopCampaignSection from "../../components/homepageComponents/topCampaignSection/TopCampaignSection";
import WhySection from "../../components/homepageComponents/WhySection/WhySection";
import Navbar from "../../components/Navbar/Navbar";
import styles from "./donated.module.scss";
import Footer from "../../components/Footer/Footer";
import CommentModal from "../../components/composed/Modal/DefaultModal/CommentModal";
import Link from "next/link";
import type { GetServerSidePropsContext } from "next";
import axios from "axios";
import { useRouter } from "next/router";
import { toast } from "../../../store/slices/ToastSlice";
import { useSelector } from "react-redux";
import { selectAuthStateState } from "../../../store/slices/authSlice";
import Layout from "../../components/Layout";
import FundingRequestsComponent from "../../components/composed/fundingRequestComponent/FundingRequestComponent";
import FeaturesGrid from "../../components/homepageComponents/FeaturesGrid/FeaturesGrid";
import { useAppDispatch } from "./../../../store/hooks";
import type { Campaign } from "../../types/campaign";
import type { Campaign as ListedCampaign } from "../../types/campaigns";

interface FundingRequestSummary {
  status?: string;
}

interface DonatedPageProps {
  campaign: Campaign | null;
  fundingRequests: FundingRequestSummary[];
}


export async function getServerSideProps(context: GetServerSidePropsContext) {
  const campaignId = context.query.id;
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const [fundingRequestsData, campaigndata] = await Promise.allSettled([
      axios.get(`${apiUrl}/api/fundingRequests/fundingRequest/${campaignId}`, { timeout: 3000 }),
      axios.get(`${apiUrl}/api/campaigns/campaign/${campaignId}`, { timeout: 3000 }),
    ]);

    const fundingRequests = fundingRequestsData.status === "fulfilled" ? fundingRequestsData.value?.data?.data : [];
    const campaign = campaigndata.status === "fulfilled" ? campaigndata.value?.data?.data : null;

    return {
      props: {
        campaign,
        fundingRequests,
      },
    };
  } catch (error) {
    return {
      props: {
        campaign: null,
        fundingRequests: [],
      },
    };
  }
}

export default function DonatedPage({
  campaign,
  fundingRequests,
}: DonatedPageProps) {
  const [campaigns, setCampaigns] = useState<ListedCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();
  const { status, name, email, amount, campaignId, anonymous } = router.query;
  const dispatch = useAppDispatch();
  const { authenticated } = useSelector(selectAuthStateState);
  const [remove, setRemove] = useState(false);

  useEffect(() => {
    status == "successful" &&
      setTimeout(() => {
        setShowModal(true);
      }, 1000);
  }, [status]);

  const getAllCampaigns = async () => {
    try {
      const campaigns = await axios.get(
        process.env.NEXT_PUBLIC_API_URL + "/api/campaigns"
      );

      campaigns && setCampaigns(campaigns?.data?.data);
      campaigns && setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllCampaigns();
  }, []);

  useEffect(() => {
    if (status == "successful") {
      dispatch(toast(true, "Payment Successful", "success"));
    }
  }, [status, dispatch]);

  const handleWhitelist = async () => {
    try {
      const whitelist = { email, campaignId };
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/campaignEmailWhitelist`,
        whitelist
      );
      res && dispatch(toast(true, "Added to tracking list", "success"));
      setRemove(true);
    } catch (error) {
      dispatch(toast(true, error?.response?.data?.error, "error"));
      error?.response?.data?.error?.includes("Server error.")
        ? null
        : setRemove(true);
    }
  };

  return (
    <Layout
      title={`Thank You | ${campaign?.basicInformation?.campaignTitle}`}
      description="Donation Successful!"
      ogImage={`${campaign?.basicInformation?.campaignImage}`}
    >
      <div>
        <Navbar />
      </div>
      <div className="custom-container">
        <div className="border-bottom" style={{ borderColor: "#C4C4C4" }}>
          <div className={styles.acknowledgement}>
            <h2 className="text-heading mb-0">
              Thank you for contributing to{" "}
              {campaign?.basicInformation?.campaignTitle}.
            </h2>
            <h2 className="text-heading mb-0">
              Your donation has been received!
            </h2>
            <p className="text-small">A receipt has been sent to your email </p>
          </div>
        </div>
      </div>
      {!remove && (
        <div className="custom-container mb-5 pb-2">
          <h2 className="text-big text-center mt-5 mb-3">
            Would you like to receive updates about this campaign?
          </h2>
          <p
            className={[
              styles.paragraph,
              "text-small mx-auto text-center",
            ].join(" ")}
          >
            As a donor, funding statements of the campaign will be sent to your
            email from time to time as funding requests are made.
          </p>
          <div
            style={{ maxWidth: 650 }}
            className="d-flex align-items-center flex-column flex-md-row my-4 mx-auto"
          >
            <button
              className="mr-md-3 px-4 btn w-100 w-md-auto mb-3 mb-md-0"
              style={{
                color: "var(--color-primary)",
                minWidth: "max-content",
                background: "white",
                border: "0.5px solid var(--color-primary)",
                borderRadius: 4,
                paddingTop: 15,
                paddingBottom: 15,
              }}
              onClick={() => setRemove(true)}
            >
              No, I don’t need updates
            </button>
            <button
              className="px-4 w-100 btn"
              style={{
                minWidth: "max-content",
                color: "white",
                background: "var(--color-primary)",
                borderRadius: 4,
                paddingTop: 15,
                paddingBottom: 15,
              }}
              onClick={handleWhitelist}
            >
              Yes, I would like to track this campaign
            </button>
          </div>
        </div>
      )}
      {/* <div
        className="mb-5 pb-2 mx-auto custom-container pt-5"
        style={{ maxWidth: 800 }}
      >
        {fundingRequests?.length ? (
          fundingRequests?.map(
            (fundingRequest, i) =>
              fundingRequest?.status == "Approved" && (
                <FundingRequestsComponent
                  campaign={campaign}
                  key={i}
                  fundingRequest={fundingRequest}
                />
              )
          )
        ) : (
          <div className="custom-container mx-auto">
            <h2 className="text-center text-medium mt-2 mb-0">
              No funding Requests for this campaign yet!
            </h2>
          </div>
        )}
      </div> */}
      <div className="mb-4 mt-5 pt-2">
        {!authenticated && (
          <div className="custom-container">
            <div className={styles.signUpSection}>
              <h2 className="text-big mb-3 text-center">
                Sign up on our platform!
              </h2>
              {/* <p className="text-small mb-3 text-center">
                Get more interesting features on our platform and get live
                updates of campaigns near you!
              </p> */}
              <Link href="/SignUp" passHref>
                <button className="btn text-white mt-2">
                  Join Fund&Trace!
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
      <FeaturesGrid />

      <div className="mt-5 pt-5">
        <TopCampaignSection
          title="Donate"
          heading="Find a campaign near you"
          data={campaigns}
          loading={loading}
        />
      </div>
      <Footer />
      <CommentModal
        details={{
          name: name,
          email: email,
          campaignId: campaignId,
          amount: amount,
          time: Date.now(),
        }}
        showModal={showModal}
        onModalClose={() => {
          setShowModal(false);
          window.history.replaceState(null, "", `/donated/${campaign?._id}`);
        }}
      />
    </Layout>
  );
}
