const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

const DonationsSchema = new mongoose.Schema({
  campaignId: { type: ObjectId, ref: "campaign", index: true },
  donorId: { type: ObjectId, ref: "User", index: true },
  donorEmail: { type: String, index: true },
  donorName: String,
  amount: Number,
  tip: Number,
  // Card/processing fee the donor paid on top (services/fees.js). Not credited
  // to the campaign; covers what the processor deducts.
  processingFee: { type: Number, default: 0 },
  // Gift Aid (UK): declaration captured at checkout for eligible campaigns.
  giftAid: {
    declared: { type: Boolean, default: false },
    title: { type: String, default: "" },
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    houseNameOrNumber: { type: String, default: "" },
    postcode: { type: String, default: "" },
    declaredAt: { type: Date, default: null },
    claimedAt: { type: Date, default: null },
  },
  // Team / matching attribution (group fundraising).
  teamId: { type: String, default: "", index: true },
  matchedAt: { type: Date, default: null },
  matchedAmount: { type: Number, default: 0 },
  transactionId: { type: String, unique: true, sparse: true, index: true },
  transactionRef: { type: String, unique: true, sparse: true, index: true },
  paymentMethod: String,
  flwRef: String,
  paymentId: { type: String, unique: true, sparse: true, index: true },
  paymentOption: String,
  zipCode: String,
  createdAt: { type: Date, default: Date.now, index: true },
  anonymous: Boolean,
  // Idempotency token to prevent double-charging/double-crediting during concurrency
  idempotencyKey: { type: String, unique: true, sparse: true, index: true },
  // Share/referral attribution captured at donation time.
  referralCode: { type: String, default: "", index: true },
  // Fraud assessment snapshot computed at payment initialization.
  fraud: {
    score: { type: Number, default: 0 },
    reasons: [{ type: String }],
    flagged: { type: Boolean, default: false, index: true },
    ip: { type: String, default: "" },
    assessedAt: { type: Date, default: null },
  },
  // Link to the funding request this donation contributed to (if disbursed)
  fundingRequestId: { type: ObjectId, ref: "fundingRequest" },
  refund: {
    // "" | processing | pending | succeeded | failed
    status: { type: String, default: "", index: true },
    amount: Number, // returned to the donor (may include the tip)
    escrowAmount: Number, // taken back out of the campaign escrow
    requestedBy: { type: String, default: "" }, // admin | donor | dispute
    reason: String,
    adminId: String,
    adminName: String,
    createdAt: { type: Date },
    refundId: String,
  },
});

// Compound indexes for fast audit and profile donation lookup
DonationsSchema.index({ campaignId: 1, createdAt: -1 });
DonationsSchema.index({ donorEmail: 1, createdAt: -1 });
// New indexes for relationship queries
DonationsSchema.index({ donorId: 1, createdAt: -1 });
DonationsSchema.index({ donorId: 1, campaignId: 1 });
DonationsSchema.index({ fundingRequestId: 1 });
DonationsSchema.index({ donorId: 1, status: 1 });

const Donations = mongoose.model("Donation", DonationsSchema);

module.exports = {
  Donations,
};
