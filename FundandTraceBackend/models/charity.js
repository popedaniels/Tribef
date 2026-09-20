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
});

const Charity = mongoose.model("Charity", CharitySchema);

module.exports = {
  Charity,
};
