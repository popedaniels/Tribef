const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;
const CharitySchema = new mongoose.Schema({
  userId: { type: ObjectId, ref: "User", index: true },
  firstName: { type: String, index: true },
  lastName: String,
  country: { type: String, index: true },
  charityName: { type: String, index: true },
  alsoKnownAs: { type: String, index: true },
  registrationNumber: { type: String },
  website: String,
  publicEmail: String,
  publicInfo: String,
  logo: String,
  sector: { type: [], index: true },
  // Gift Aid (UK only): set by an admin after checking the HMRC charities
  // reference. Only then is the Gift Aid box offered on its GBP campaigns.
  hmrcReference: { type: String, default: "" },
  giftAidEnabled: { type: Boolean, default: false },
});

const Charity = mongoose.model("Charity", CharitySchema);

module.exports = {
  Charity,
};
