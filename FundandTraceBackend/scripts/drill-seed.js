#!/usr/bin/env node
// Seeds a small, internally consistent dataset for the CI backup drill.
const mongoose = require("mongoose");
(async () => {
  await mongoose.connect(process.env.MONGOURL, { serverSelectionTimeoutMS: 10000 });
  await mongoose.connection.db.dropDatabase();
  const { Campaign } = require("../models/campaignModel");
  const { Donations } = require("../models/donationsModel");
  const { LedgerEntry } = require("../models/ledgerEntryModel");
  const { appendEntry } = require("../services/ledger");
  await LedgerEntry.init();
  await Donations.init();
  for (let c = 0; c < 3; c += 1) {
    const camp = await Campaign.create({ launched: true, funding: { currency: "NGN", amountExpected: 100000, amountRaised: 0, availableBalance: 0 } });
    let total = 0;
    for (let i = 0; i < 5; i += 1) {
      const amount = 1000 * (i + 1);
      total += amount;
      await Donations.create({ campaignId: camp._id, amount, donorEmail: `d${i}@example.com`, transactionId: `seed-${c}-${i}`, transactionRef: `seed-${c}-${i}`, paymentMethod: "paystack" });
      await appendEntry({ campaignId: camp._id, type: "credit", amount, currency: "NGN", refId: `paystack:seed-${c}-${i}`, memo: "Donation" });
    }
    await Campaign.updateOne({ _id: camp._id }, { $set: { "funding.amountRaised": total, "funding.availableBalance": total } });
  }
  console.log("seeded");
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
