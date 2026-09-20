import type { CampaignUpdate } from "./campaign";

export interface BasicInformation {
  campaignTitle: string;
  campaignTagline: string;
  campaignImage: string;
  locationState: string;
  locationCountry: string;
  category?: string;
}

export interface Funding {
  currency: string;
  amountExpected: number;
  amountRaised: number;
  daysLeft: number;
}

export interface Content {
  story: string[];
}

export interface Campaign {
  _id: string;
  category: string;
  organizer: string;
  organizerId: string;
  basicInformation: BasicInformation;
  funding: Funding;
  content: Content;
  updates: CampaignUpdate[];
  donations: unknown[];
}

export type FallbackCampaigns = Campaign[];