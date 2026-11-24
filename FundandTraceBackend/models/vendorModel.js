// Verified vendor network (FT-038): hospitals, schools, suppliers and
// contractors that campaigns can pay directly. A vendor is only usable once
// an admin has checked the registration and confirmed the bank account name
// with the payout provider; payouts for vendor-backed requests can then only
// go to that stored account.
const mongoose = require("mongoose");

const CATEGORIES = ["Hospital / Healthcare Provider", "Educational Institution", "Accredited NGO", "Licensed Contractor", "Supplier", "Other"];

const VendorSchema = new mongoose.Schema(
  {
    legalName: { type: String, required: true, maxlength: 140, index: true },
    tradingName: { type: String, default: "", maxlength: 140 },
    category: { type: String, enum: CATEGORIES, required: true, index: true },
    country: { type: String, required: true, uppercase: true, minlength: 2, maxlength: 2, index: true },
    city: { type: String, default: "", maxlength: 80 },
    address: { type: String, default: "", maxlength: 240 },
    registrationNumber: { type: String, required: true, maxlength: 60 }, // e.g. CAC RC number, Companies House number
    registryUrl: { type: String, default: "", maxlength: 300 }, // public registry entry the admin checked
    taxId: { type: String, default: "", maxlength: 60 },
    website: { type: String, default: "", maxlength: 200 },
    contactEmail: { type: String, default: "", maxlength: 160 },
    contactPhone: { type: String, default: "", maxlength: 40 },
    description: { type: String, default: "", maxlength: 600 },
    bank: {
      currency: { type: String, default: "", uppercase: true },
      bankName: { type: String, default: "" },
      bankCode: { type: String, default: "" },
      accountNumber: { type: String, default: "" }, // encrypted
      accountName: { type: String, default: "" }, // encrypted
      last4: { type: String, default: "" },
      resolvedName: { type: String, default: "" }, // name returned by Paystack/Flutterwave
      verifiedAt: { type: Date, default: null },
      method: { type: String, enum: ["", "provider-resolve", "manual"], default: "" },
    },
    status: { type: String, enum: ["pending", "verified", "rejected", "suspended"], default: "pending", index: true },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    review: {
      checks: {
        registryChecked: { type: Boolean, default: false },
        bankNameMatches: { type: Boolean, default: false },
        contactConfirmed: { type: Boolean, default: false },
      },
      notes: { type: String, default: "", maxlength: 1000 },
      adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      adminName: { type: String, default: "" },
      decidedAt: { type: Date, default: null },
    },
    verifiedAt: { type: Date, default: null },
  },
  { timestamps: true }
);
VendorSchema.index({ country: 1, registrationNumber: 1 }, { unique: true });
VendorSchema.index({ legalName: "text", tradingName: "text", city: "text" });

const Vendor = mongoose.model("Vendor", VendorSchema);
module.exports = { Vendor, VENDOR_CATEGORIES: CATEGORIES };
