const mongoose = require("mongoose");
const UsersSchema = new mongoose.Schema({
  firstName: { type: String, index: true },
  lastName: String,
  country: { type: String, index: true },
  city: String,
  email: { type: String, index: true, unique: true, lowercase: true, trim: true },
  phone: String,
  code: String,
  verified: { type: Boolean, index: true },
  profilePicture: String,
  language: { type: String, default: "English" },
  joined: { type: Date, default: Date.now, index: true },
  role: { type: String, default: "user", index: true },
  suspended: { type: Boolean, default: false, index: true },
  // TOTP two-factor authentication. Secret is stored encrypted at rest
  // (utility/encryption) and never returned by API responses.
  twoFactor: {
    enabled: { type: Boolean, default: false },
    secret: { type: String, default: "" },
    confirmedAt: { type: Date, default: null },
  },
  identityVerification: {
    status: {
      type: String,
      enum: ["unverified", "pending", "verified", "requires_input", "canceled"],
      default: "unverified",
      index: true,
    },
    sessionId: { type: String, default: null },
    verifiedAt: { type: Date, default: null },
    idDocumentType: { type: String, default: null },
    idCountry: { type: String, default: null },
    facialLivenessMatched: { type: Boolean, default: false },
  },
  adminActivities: [
    {
      date: Date,
      AdminId: String,
      AdminName: String,
      action: String,
    },
  ],
});

const CredentialsSchema = new mongoose.Schema({
  email: { type: String, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
});
const Credentials = mongoose.model("Credential", CredentialsSchema);

const Users = mongoose.model("User", UsersSchema);

module.exports = {
  Users,
  Credentials,
};