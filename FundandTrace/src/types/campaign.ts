export interface BasicInformation {
  campaignTitle: string;
  campaignTagline?: string;
  campaignImage?: string;
  duration?: number;
  locationCountry?: string;
  locationState?: string;
}

export interface ContactInfo {
  firstName: string;
  lastName: string;
  country: string;
  state: string;
  zipCode: string;
  email: string;
  phoneNumber: string;
  phoneCode?: string;
  dateOfBirth?: string;
  streetAddress?: string;
  idImage?: string;
}

export interface CampaignTeam {
  primaryContact: ContactInfo;
  secondContact?: ContactInfo;
}

export interface CampaignFunding {
  currency: string;
  amountExpected: number;
  amountRaised: number;
  bankName?: string;
  sortCode?: string;
  accountName?: string;
  accountNumber?: string;
  availableBalance?: number;
  refunded?: boolean;
}

export interface CampaignSettings {
  postFunding?: boolean;
  publicUpdates?: boolean;
  emailDonors?: boolean;
}

export interface CampaignComment {
  _id?: string;
  name?: string;
  email?: string;
  campaignId?: string;
  amount?: number;
  comment: string;
  time?: string | Date;
}

export interface CampaignUpdate {
  _id?: string;
  story: string;
  datePosted?: string | Date;
  image?: string;
  video?: string;
  addedBy?: string;
}

export interface Campaign {
  _id: string;
  basicInformation: BasicInformation;
  category: string;
  createdAt: string | Date;
  campaignType?: string;
  suspended: boolean;
  organizer: string;
  organizerId: string;
  launched: boolean;
  content?: {
    story: string[];
    campaignVideo?: string;
  };
  team?: CampaignTeam;
  funding: CampaignFunding;
  settings?: CampaignSettings;
  comments?: CampaignComment[];
  updates?: CampaignUpdate[];
  targetReachedNotifiedAt?: string | Date | null;
}
