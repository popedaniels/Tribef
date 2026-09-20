// Web Push subscriptions for donor notifications (PWA).
const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

const PushSubscriptionSchema = new mongoose.Schema({
  // The push service endpoint URL is unique per browser/device.
  endpoint: { type: String, required: true, unique: true, index: true },
  keys: {
    p256dh: String,
    auth: String,
  },
  userId: { type: ObjectId, ref: "User", index: true },
  userEmail: { type: String, default: "", index: true },
  createdAt: { type: Date, default: Date.now() },
});

// Indexes for relationship queries
PushSubscriptionSchema.index({ userId: 1, createdAt: -1 });

module.exports = {
  PushSubscription: mongoose.model("PushSubscription", PushSubscriptionSchema),
};
