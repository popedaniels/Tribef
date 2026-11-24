// Public (unauthenticated) views of campaigns, donations and funding requests.
//
// Before this module, public endpoints returned whole Mongoose documents:
//   - GET /api/campaigns/campaign/:id DECRYPTED and returned the organizer's
//     bank account number, account name, bank name and sort code;
//   - every campaign read exposed team contacts' email, phone, date of birth,
//     street address and ID-document image URLs;
//   - dispute reports exposed the names/emails of donors who raised them;
//   - the public tracker returned every donor's email and fraud IP, the
//     organizer's full user document and payout bank details.
//
// Every public read must go through these projections/serializers. The
// campaign owner (and admins, via /api/admin) still get full detail.

const { safeProfile } = require("./safeProfile");

const TEAM_PRIVATE_FIELDS = [
  "email",
  "phoneNumber",
  "phoneCode",
  "dateOfBirth",
  "streetAddress",
  "zipCode",
  "idImage",
];

// Mongo exclusion projection for campaign documents served publicly.
const CAMPAIGN_PUBLIC_PROJECTION = {
  "funding.accountName": 0,
  "funding.accountNumber": 0,
  "funding.sortCode": 0,
  "funding.bankName": 0,
  "funding.accountHash": 0,
  riskAssessment: 0,
  "stripeConnect.accountId": 0,
  "disputeGovernance.disputeReports": 0,
  "comments.email": 0,
  adminActivities: 0,
  ...Object.fromEntries(TEAM_PRIVATE_FIELDS.map((f) => [`team.primaryContact.${f}`, 0])),
  ...Object.fromEntries(TEAM_PRIVATE_FIELDS.map((f) => [`team.secondContact.${f}`, 0])),
};

// Same rules applied to an already-loaded campaign object (e.g. when the
// owner check fails after the document was fetched).
const toPublicCampaign = (doc) => {
  if (!doc) return doc;
  const campaign = doc.toObject ? doc.toObject() : { ...(doc._doc || doc) };
  if (campaign.funding) {
    const { accountName, accountNumber, sortCode, bankName, accountHash, ...funding } = campaign.funding;
    campaign.funding = funding;
  }
  delete campaign.riskAssessment;
  if (campaign.stripeConnect) {
    const { accountId, ...connect } = campaign.stripeConnect;
    campaign.stripeConnect = connect;
  }
  if (campaign.disputeGovernance) {
    const { disputeReports, ...governance } = campaign.disputeGovernance;
    campaign.disputeGovernance = {
      ...governance,
      disputeCount: Array.isArray(disputeReports) ? disputeReports.length : 0,
    };
  }
  if (Array.isArray(campaign.comments)) {
    campaign.comments = campaign.comments.map(({ email, ...comment }) => comment);
  }
  delete campaign.adminActivities;
  if (campaign.team) {
    const team = { ...campaign.team };
    ["primaryContact", "secondContact"].forEach((key) => {
      if (team[key]) {
        const contact = { ...team[key] };
        TEAM_PRIVATE_FIELDS.forEach((f) => delete contact[f]);
        team[key] = contact;
      }
    });
    campaign.team = team;
  }
  return campaign;
};

// Donations: only what a public donor wall needs.
const DONATION_PUBLIC_FIELDS = "donorName amount tip currency createdAt anonymous campaignId";

const toPublicDonation = (doc) => {
  const donation = doc && doc.toObject ? doc.toObject() : { ...(doc?._doc || doc) };
  return {
    _id: donation._id,
    campaignId: donation.campaignId,
    donorName: donation.anonymous ? "Anonymous" : donation.donorName || "",
    amount: donation.amount,
    tip: donation.tip,
    currency: donation.currency,
    createdAt: donation.createdAt,
    anonymous: Boolean(donation.anonymous),
  };
};

// Funding requests on the public tracker: purpose, amounts, status, dates and
// receipts — never payout bank details or internal locks.
const FUNDING_REQUEST_PUBLIC_PROJECTION = {
  thirdPartyAccountName: 0,
  thirdPartyAccountNumber: 0,
  thirdPartyBankName: 0,
  thirdPartyNameOfRef: 0,
  thirdPartyContact: 0,
  "disbursement.bankName": 0,
  "disbursement.accountName": 0,
  "disbursement.accountNumber": 0,
  "vendorDisbursement.bankDetails": 0,
  payoutLockedAt: 0,
};

const toPublicUser = (user) => {
  const profile = safeProfile(user);
  if (!profile) return profile;
  // The tracker shows who is raising, not how to contact them privately.
  const { email, phone, code, role, ...rest } = profile;
  return rest;
};

module.exports = {
  CAMPAIGN_PUBLIC_PROJECTION,
  toPublicCampaign,
  DONATION_PUBLIC_FIELDS,
  toPublicDonation,
  FUNDING_REQUEST_PUBLIC_PROJECTION,
  toPublicUser,
};
