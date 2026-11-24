// Checkout extras that must NOT travel through payment-gateway metadata
// (a Gift Aid declaration contains the donor's home address). Keyed by the
// gateway's own reference ("paystack:<ref>", "flw:<tx_ref>", "stripe:<session>"),
// attached to the Donation when the payment is credited, then expired.
const mongoose = require("mongoose");

const CheckoutIntentSchema = new mongoose.Schema(
  {
    _id: { type: String }, // "<rail>:<gateway reference>"
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign", index: true },
    teamId: { type: String, default: "" },
    giftAid: {
      declared: { type: Boolean, default: false },
      title: { type: String, default: "" },
      firstName: { type: String, default: "" },
      lastName: { type: String, default: "" },
      houseNameOrNumber: { type: String, default: "" },
      postcode: { type: String, default: "" },
      declaredAt: { type: Date },
      wording: { type: String, default: "" },
    },
    createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 30 },
  },
  { versionKey: false }
);

const CheckoutIntent = mongoose.model("CheckoutIntent", CheckoutIntentSchema);
module.exports = { CheckoutIntent };
