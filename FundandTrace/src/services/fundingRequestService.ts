import axios from "axios";
import type { FundingRequestBody } from "../types/fundingRequest";
import { getApiBaseUrl } from "../utils/api";

export const fetchAllFundings = async (campaignId: string | string[] | undefined) => {
  const res = await axios.get(
    getApiBaseUrl() + "/api/fundingRequests/fundingRequest/" + campaignId
  );
  return res?.data?.data;
};

export const createFundingRequest = async (
  fundingRequest: FundingRequestBody,
  campaign: { organizerId?: string } | null,
  campaignId: string | string[] | undefined
) => {
  const res = await axios.post(
    getApiBaseUrl() + "/api/fundingRequests/addFundingRequest",
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
    getApiBaseUrl() + "/api/stripeConnect/account/" + campaignId,
    {},
    { withCredentials: true }
  );
  return res;
};

export const fetchCampaignById = async (campaignId: string | string[] | undefined) => {
  const campaigndata = await axios.get(
    getApiBaseUrl() + "/api/campaigns/campaign/" + campaignId,
    { withCredentials: true }
  );
  return campaigndata?.data?.data;
};
