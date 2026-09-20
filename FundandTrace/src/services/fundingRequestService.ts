import axios from "axios";
import type { FundingRequestBody } from "../types/fundingRequest";

export const fetchAllFundings = async (campaignId: string | string[] | undefined) => {
  const res = await axios.get(
    process.env.NEXT_PUBLIC_API_URL + "/api/fundingRequests/fundingRequest/" + campaignId
  );
  return res?.data?.data;
};

export const createFundingRequest = async (
  fundingRequest: FundingRequestBody,
  campaign: { organizerId?: string } | null,
  campaignId: string | string[] | undefined
) => {
  const res = await axios.post(
    process.env.NEXT_PUBLIC_API_URL + "/api/fundingRequests/addFundingRequest",
    {
      fundingRequest: {
        ...fundingRequest,
        organizerId: campaign?.organizerId,
        campaignId: campaignId,
      },
    },
    { withCredentials: true }
  );
  return res;
};

export const createStripeConnectAccount = async (campaignId: string | string[] | undefined) => {
  const res = await axios.post(
    process.env.NEXT_PUBLIC_API_URL + "/api/stripeConnect/account/" + campaignId,
    {},
    { withCredentials: true }
  );
  return res;
};

export const fetchCampaignById = async (campaignId: string | string[] | undefined) => {
  const campaigndata = await axios.get(
    process.env.NEXT_PUBLIC_API_URL + "/api/campaigns/campaign/" + campaignId
  );
  return campaigndata?.data?.data;
};
