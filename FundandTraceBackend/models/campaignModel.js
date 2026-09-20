const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

const campaignSchema = new mongoose.Schema({
  basicInformation: {
    campaignTitle: { type: String, default: "" },
    campaignTagline: { type: String, default: "" },
    campaignImage: { type: String, default: "" },
    duration: { type: Number, default: 30 },
    locationCountry: { type: String, default: "" },
    locationState: { type: String, default: "" },
  },
  categoryId: { type: ObjectId, ref: "category" },
  category: { type: String, default: "", index: true },
  createdAt: { type: Date, default: Date.now, index: true },
  campaignType: { type: String, default: "", index: true },
  suspended: { type: Boolean, default: false, index: true },
  organizer: { type: String, default: "", index: true },
  organizerId: { type: ObjectId, ref: "User", index: true },
  // Link to registered charity when campaignType is 'charity'
  charityId: { type: ObjectId, ref: "Charity", index: true },
  launched: { type: Boolean, default: false, index: true },
  content: {
    story: [{ type: String, default: "" }],
    campaignVideo: { type: String, default: "" },
  },
  adminActivities: [
    {
      date: Date,
      AdminId: String,
      AdminName: String,
      action: String,
    },
  ],
  team: {
    primaryContact: {
      firstName: { type: String, default: "" },
      lastName: { type: String, default: "" },
      country: { type: String, default: "" },
      state: { type: String, default: "" },
      zipCode: { type: String, default: "" },
      email: { type: String, default: "" },
      phoneNumber: { type: String, default: "" },
      phoneCode: { type: String, default: "" },
      dateOfBirth: { type: String, default: "" },
      streetAddress: { type: String, default: "" },
      idImage: { type: String, default: "" },
    },
    secondContact: {
      firstName: { type: String, default: "" },
      lastName: { type: String, default: "" },
      country: { type: String, default: "" },
      state: { type: String, default: "" },
      zipCode: { type: String, default: "" },
      phoneCode: { type: String, default: "" },
      email: { type: String, default: "" },
      phoneNumber: { type: String, default: "" },
      dateOfBirth: { type: String, default: "" },
      streetAddress: { type: String, default: "" },
      idImage: { type: String, default: "" },
    },
  },
  funding: {
    currency: { type: String, default: "USD" },
    amountExpected: { type: Number, default: 0 },
    amountRaised: { type: Number, default: 0 },
    bankName: { type: String, default: "" },
    sortCode: { type: String, default: "" },
    accountName: { type: String, default: "" },
    accountNumber: { type: String, default: "" },
    availableBalance: { type: Number, default: 0 },
    refunded: { type: Boolean, default: false },
  },
  settings: {
    postFunding: { type: Boolean, default: true },
    publicUpdates: { type: Boolean, default: false },
    emailDonors: { type: Boolean, default: false },
  },
  // Set once when funding.amountRaised first reaches amountExpected; gates
  // the one-time goal-reached notifications.
  targetReachedNotifiedAt: { type: Date, default: null },
  comments: [
    {
      name: String,
      email: String,
      campaignId: ObjectId,
      amount: Number,
      comment: String,
      time: Date,
    },
  ],
  updates: [
    {
      story: String,
      datePosted: Date,
      image: String,
      video: String,
      addedBy: String,
    },
  ],
  // Stripe Express Connect — payout account for the campaign organizer.
  stripeConnect: {
    accountId: { type: String, default: "", index: true },
    payoutsEnabled: { type: Boolean, default: false },
    detailsSubmitted: { type: Boolean, default: false },
    updatedAt: { type: Date, default: null },
  },
  disputeGovernance: {
    isLocked: { type: Boolean, default: false, index: true },
    lockedAt: { type: Date, default: null },
    lockReason: { type: String, default: "" },
    disputeReports: [
      {
        donorId: { type: ObjectId, ref: "users" },
        donorEmail: String,
        donorName: String,
        donationId: { type: ObjectId, ref: "donations" },
        disputeCategory: {
          type: String,
          enum: [
            "Fake Evidence / Altered Receipt",
            "Misappropriation of Funds",
            "Inactive / Abandoned Milestone",
            "Identity Mismatch",
            "Other",
          ],
          default: "Other",
        },
        description: String,
        evidenceAttachmentUrl: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    totalDisputeVolumeUSD: { type: Number, default: 0 },
  },
});

// Full-text search across the fields donors actually search by.
// Weights: title matches rank highest, then tagline, then story.
campaignSchema.index(
  {
    "basicInformation.campaignTitle": "text",
    "basicInformation.campaignTagline": "text",
    "content.story": "text",
  },
  {
    weights: {
      "basicInformation.campaignTitle": 10,
      "basicInformation.campaignTagline": 5,
      "content.story": 1,
    },
    name: "campaign_text_search",
  }
);

// Compound index for homepage feed and public query optimization
campaignSchema.index({ launched: 1, suspended: 1, createdAt: -1 });

// New indexes for relationship queries
campaignSchema.index({ organizerId: 1, launched: 1 });
campaignSchema.index({ charityId: 1, launched: 1 });
campaignSchema.index({ categoryId: 1, launched: 1 });
campaignSchema.index({ categoryId: 1, category: 1 });

const Campaign = mongoose.model("campaign", campaignSchema);

module.exports = { Campaign };
