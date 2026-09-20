import type { NextPageContext } from "next";
import type { Campaign } from "./campaign";

export interface StripeConnect {
  accountId?: string;
  payoutsEnabled?: boolean;
  detailsSubmitted?: boolean;
}

export interface FundingCampaign extends Campaign {
  stripeConnect?: StripeConnect;
}

export interface FundingRequestBody {
  fundingType: string;
  currency?: string;
  amount: number;
  purposeOfFunding: string;
  proofOfFunding: string;
  thirdPartyAccountNumber: number;
  thirdPartyAccountName: string;
  thirdPartyBankName: string;
  thirdPartyNameOfRef: string;
  thirdPartyContact: string;
  mobileFieldVerification?: {
    captureTimestampNTP: Date;
    geolocation: {
      latitude: number;
      longitude: number;
      altitude: number | null;
      accuracyMeters: number;
      isMockProvider: boolean;
    };
    deviceAttestation: {
      platform: string;
      hardwareKeystoreSigned: boolean;
    };
  };
}

export interface FundingRequestProps {
  campaign: FundingCampaign | null;
  campaignId: NextPageContext["query"]["id"];
}

export type FundingView = "" | "fixed" | "flexible" | "third" | "success";
