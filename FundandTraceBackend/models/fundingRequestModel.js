const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

const fundingRequestSchema = new mongoose.Schema({
  campaignId: { type: ObjectId, ref: "campaign", index: true },
  organizerId: { type: ObjectId, ref: "User", index: true },
  fundingType: { type: String, default: "" },
  currency: { type: String },
  amount: { type: Number, default: 0 },
  purposeOfFunding: { type: String, default: "" },
  proofOfFunding: { type: String, default: "" },
  thirdPartyAccountNumber: { type: Number },
  thirdPartyAccountName: { type: String },
  thirdPartyBankName: { type: String },
  thirdPartyNameOfRef: { type: String },
  thirdPartyContact: { type: String },

  // Direct-to-Vendor Institutional Disbursement
  vendorDisbursement: {
    isDirectToVendor: { type: Boolean, default: false },
    // Set when paying a verified vendor from the network: the payout can then
    // only go to that vendor's verified account (controller/donations/payout.js).
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", default: null, index: true },
    vendorCategory: {
      type: String,
      enum: [
        "Hospital / Healthcare Provider",
        "Educational Institution",
        "Accredited NGO",
        "Licensed Contractor",
        "Supplier",
        "Other",
        "",
      ],
      default: "",
    },
    vendorLegalName: { type: String, default: "" },
    vendorTaxIdOrRegistration: { type: String, default: "" },
    vendorContactEmail: { type: String, default: "" },
    vendorContactPhone: { type: String, default: "" },
    bankDetails: {
      routingOrSortCode: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      accountName: { type: String, default: "" },
      bankName: { type: String, default: "" },
      swiftOrIban: { type: String, default: "" },
    },
    invoiceDocumentUrl: { type: String, default: "" },
    invoiceNumber: { type: String, default: "" },
    invoiceTotalAmount: { type: Number, default: 0 },
  },

  // Mobile Hardware & Field Telemetry Verification
  mobileFieldVerification: {
    captureTimestampNTP: { type: Date, default: null },
    geolocation: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      altitude: { type: Number, default: null },
      accuracyMeters: { type: Number, default: null },
      isMockProvider: { type: Boolean, default: false },
      distanceFromProjectMeters: { type: Number, default: null },
    },
    deviceAttestation: {
      platform: {
        type: String,
        enum: ["ios", "android", "mobile_web", "web", ""],
        default: "web",
      },
      attestationToken: { type: String, default: null },
      hardwareKeystoreSigned: { type: Boolean, default: false },
      isRootedOrJailbroken: { type: Boolean, default: false },
    },
    livenessChallenge: {
      challengeCode: { type: String, default: "" },
      spokenCodeVerified: { type: Boolean, default: false },
      videoPlaybackUrl: { type: String, default: "" },
      durationSeconds: { type: Number, default: 0 },
    },
  },

  // Dispute & Lock Status
  disputeState: {
    isDisputed: { type: Boolean, default: false, index: true },
    disputeCount: { type: Number, default: 0 },
    disputeReason: { type: String, default: "" },
  },

  createdAt: { type: Date, default: Date.now },
  approvedAt: { type: Date },
  declinedAt: { type: Date },
  status: { type: String, default: "Pending", index: true },
  declineReason: String,
  adminId: String,
  adminName: String,
  // Set atomically by the payout handler while a disbursement is in flight so
  // concurrent/retried payout calls for the same request cannot both run.
  payoutLockedAt: { type: Date },
  payoutAttempts: { type: Number, default: 0 },
  thirdPartyBankCode: { type: String, default: "" },
  disbursement: {
    amount: Number,
    currency: String,
    bankName: String,
    accountName: String,
    accountNumber: String,
    dateDisbursed: Date,
    receipt: String,
    stripeTransferId: String,
    stripeTransferStatus: String,
    // stripe_connect | flutterwave | paystack | manual
    provider: String,
    providerReference: String,
    providerId: String,
    // pending | successful | failed (bank rails settle asynchronously)
    providerStatus: String,
    receiptUploadedAt: Date,
    // Set when the receipt was captured live in the app (sealed evidence).
    receiptEvidenceSessionId: String,
  },
});

const FundingRequests = mongoose.model("fundingRequest", fundingRequestSchema);

module.exports = {
  FundingRequests,
};
