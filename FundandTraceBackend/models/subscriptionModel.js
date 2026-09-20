// Recurring (monthly) donations via Stripe subscriptions.
const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

const SubscriptionSchema = new mongoose.Schema({
  campaignId: { type: ObjectId, ref: "campaign", index: true },
  subscriberId: { type: ObjectId, ref: "User", index: true },
  subscriberEmail: { type: String, index: true },
  subscriberName: { type: String, default: "" },
  amount: Number,
  tip: { type: Number, default: 0 },
  currency: { type: String, default: "gbp" },
  interval: { type: String, default: "month" },
  anonymous: { type: Boolean, default: false },
  referralCode: { type: String, default: "" },
  stripeCustomerId: { type: String, default: "", index: true },
  stripeSubscriptionId: { type: String, unique: true, sparse: true, index: true },
  // active | canceling | canceled | past_due | incomplete | incomplete_expired
  status: { type: String, default: "incomplete", index: true },
  // Fraud snapshot captured at initialization (rides through gateway metadata).
  fraudSnapshot: {
    score: { type: Number, default: 0 },
    reasons: [{ type: String }],
    ip: { type: String, default: "" },
  },
  totalDonated: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now() },
  canceledAt: { type: Date, default: null },
});

// Indexes for relationship queries
SubscriptionSchema.index({ subscriberId: 1, campaignId: 1 });
SubscriptionSchema.index({ subscriberId: 1, status: 1 });
SubscriptionSchema.index({ stripeCustomerId: 1, status: 1 });

module.exports = {
  Subscription: mongoose.model("Subscription", SubscriptionSchema),
};
