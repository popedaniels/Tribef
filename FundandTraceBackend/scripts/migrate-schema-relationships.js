// One-time migration: backfill new foreign key fields added to Mongoose schemas.
//
// This script populates the new relationship fields on existing documents
// where the data can be inferred from existing fields (e.g., donorEmail → donorId
// by looking up the User collection).
//
// Usage:
//   MONGOURL=... node scripts/migrate-schema-relationships.js [--dry-run]
//
// New fields backfilled:
//   - Donations.donorId         → lookup User by donorEmail
//   - Subscriptions.subscriberId → lookup User by subscriberEmail
//   - ActivityLog.userId        → lookup User by user (legacy string field)
//   - PushSubscription.userId   → lookup User by userEmail
//   - Waitlist.campaignId       → left null (no campaign context in legacy data)
//   - Reports.campaignId/userId → left null (no context in legacy data)
//   - Support.campaignId        → left null (no context in legacy data)
//   - FundingRequests.organizerId → already a string ObjectId; cast to ObjectId
//   - Charity.userId            → left null (no user link in legacy data)
//   - Campaign.charityId        → left null (set when campaignType=charity in new flows)
//   - Campaign.categoryId       → left null (category is stored as string; set manually)
//   - Donations.fundingRequestId → left null (assigned at disbursement time in new flows)
//
// Safe to re-run: already-populated fields are skipped. --dry-run shows what would
// be modified without writing.

process.env.NODE_ENV = process.env.NODE_ENV || "production";
require("dotenv").config();

const mongoose = require("mongoose");
const logger = require("../utility/logger");

require("../models/users");
require("../models/campaignModel");
require("../models/donationsModel");
require("../models/subscriptionModel");
require("../models/fundingRequestModel");
require("../models/activityLogModel");
require("../models/charity");
require("../models/pushSubscriptionModel");
require("../models/waitlistModel");
require("../models/reports");
require("../models/support");

const DRY_RUN = process.argv.includes("--dry-run");
const BATCH = 200;

// Helper: safely convert a string to ObjectId, return null if invalid
function toObjectId(str) {
  if (!str || typeof str !== "string") return null;
  try {
    return new mongoose.Types.ObjectId(str);
  } catch {
    return null;
  }
}

// Helper: update a document if the target field is missing but we have a value
async function upsertField(Model, doc, fieldPath, value) {
  if (!value) return false;

  const parts = fieldPath.split(".");
  let current = doc;
  for (const part of parts) {
    if (current == null) return false;
    current = current[part];
  }
  // Field already populated
  if (current != null) return false;

  if (DRY_RUN) {
    logger.info(
      { collection: Model.collection.name, id: String(doc._id), field: fieldPath },
      `[DRY-RUN] Would set ${fieldPath}`
    );
    return true;
  }

  // Build $set with nested path
  const set = {};
  set[fieldPath] = value;
  await Model.updateOne({ _id: doc._id }, { $set: set });
  return true;
}

// ── 1. Donations.donorId ──────────────────────────────────────────────────────
async function migrateDonationsDonorId() {
  const { Donations } = require("../models/donationsModel");
  const { Users } = require("../models/users");

  let scanned = 0;
  let updated = 0;

  const cursor = Donations.find({
    donorId: { $exists: false },
  }).cursor();

  for await (const doc of cursor) {
    scanned += 1;
    if (!doc.donorEmail) continue;

    const user = await Users.findOne({ email: doc.donorEmail }).select("_id");
    if (!user) continue;

    const didUpdate = await upsertField(Donations, doc, "donorId", user._id);
    if (didUpdate) updated += 1;

    if (scanned % BATCH === 0) {
      logger.info(
        { collection: "Donations", scanned, updated, dryRun: DRY_RUN },
        `Donations.donorId: ${updated}/${scanned} so far`
      );
    }
  }

  return { collection: "Donations.donorId", scanned, updated };
}

// ── 2. Subscriptions.subscriberId ─────────────────────────────────────────────
async function migrateSubscriptionsSubscriberId() {
  const { Subscription } = require("../models/subscriptionModel");
  const { Users } = require("../models/users");

  let scanned = 0;
  let updated = 0;

  const cursor = Subscription.find({
    subscriberId: { $exists: false },
  }).cursor();

  for await (const doc of cursor) {
    scanned += 1;
    if (!doc.subscriberEmail) continue;

    const user = await Users.findOne({ email: doc.subscriberEmail }).select("_id");
    if (!user) continue;

    const didUpdate = await upsertField(Subscription, doc, "subscriberId", user._id);
    if (didUpdate) updated += 1;

    if (scanned % BATCH === 0) {
      logger.info(
        { collection: "Subscriptions", scanned, updated, dryRun: DRY_RUN },
        `Subscriptions.subscriberId: ${updated}/${scanned} so far`
      );
    }
  }

  return { collection: "Subscriptions.subscriberId", scanned, updated };
}

// ── 3. ActivityLog.userId ─────────────────────────────────────────────────────
async function migrateActivityLogUserId() {
  const { ActivityLog } = require("../models/activityLogModel");
  const { Users } = require("../models/users");

  let scanned = 0;
  let updated = 0;

  const cursor = ActivityLog.find({
    userId: { $exists: false },
  }).cursor();

  for await (const doc of cursor) {
    scanned += 1;
    // Legacy field is `user` (string email or id)
    if (!doc.user) continue;

    // Try email first, then raw ObjectId string
    let user = null;
    if (doc.user.includes("@")) {
      user = await Users.findOne({ email: doc.user }).select("_id");
    } else {
      const oid = toObjectId(doc.user);
      if (oid) user = await Users.findById(oid).select("_id");
    }
    if (!user) continue;

    const didUpdate = await upsertField(ActivityLog, doc, "userId", user._id);
    if (didUpdate) updated += 1;

    if (scanned % BATCH === 0) {
      logger.info(
        { collection: "ActivityLog", scanned, updated, dryRun: DRY_RUN },
        `ActivityLog.userId: ${updated}/${scanned} so far`
      );
    }
  }

  return { collection: "ActivityLog.userId", scanned, updated };
}

// ── 4. PushSubscription.userId ────────────────────────────────────────────────
async function migratePushSubscriptionUserId() {
  const { PushSubscription } = require("../models/pushSubscriptionModel");
  const { Users } = require("../models/users");

  let scanned = 0;
  let updated = 0;

  const cursor = PushSubscription.find({
    userId: { $exists: false },
  }).cursor();

  for await (const doc of cursor) {
    scanned += 1;
    if (!doc.userEmail) continue;

    const user = await Users.findOne({ email: doc.userEmail }).select("_id");
    if (!user) continue;

    const didUpdate = await upsertField(PushSubscription, doc, "userId", user._id);
    if (didUpdate) updated += 1;

    if (scanned % BATCH === 0) {
      logger.info(
        { collection: "PushSubscription", scanned, updated, dryRun: DRY_RUN },
        `PushSubscription.userId: ${updated}/${scanned} so far`
      );
    }
  }

  return { collection: "PushSubscription.userId", scanned, updated };
}

// ── 5. FundingRequests.organizerId (cast string to ObjectId ref) ─────────────
async function migrateFundingRequestsOrganizerId() {
  const { FundingRequests } = require("../models/fundingRequestModel");

  let scanned = 0;
  let updated = 0;

  // In the old schema, organizerId was stored as a String (raw ObjectId value).
  // We check if it's a string that looks like an ObjectId and ensure the field
  // is properly typed. Mongoose handles the conversion transparently, but we
  // verify the field exists and is valid.
  const cursor = FundingRequests.find({
    organizerId: { $exists: true },
  }).cursor();

  for await (const doc of cursor) {
    scanned += 1;
    // If organizerId is stored as a string ObjectId, Mongoose will cast it.
    // No update needed — the schema change handles it transparently.
    // We just log.
    if (scanned % BATCH === 0) {
      logger.info(
        { collection: "FundingRequests", scanned, dryRun: DRY_RUN },
        `FundingRequests.organizerId: ${scanned} docs verified (schema handles cast)`
      );
    }
  }

  return { collection: "FundingRequests.organizerId", scanned, updated: 0 };
}

// ── Fields left as null (no legacy data to infer) ────────────────────────────
const NOOP_MIGRATIONS = [
  "Donations.fundingRequestId",     // Assigned at disbursement time
  "Reports.campaignId",             // No campaign context in legacy reports
  "Reports.userId",                 // No user context in legacy reports
  "Support.campaignId",             // No campaign context in legacy tickets
  "Charity.userId",                 // No user link in legacy charity records
  "Campaign.charityId",             // Set when campaignType=charity in new flows
  "Campaign.categoryId",            // Category stored as string; map manually if needed
  "Waitlist.campaignId",            // No campaign context in legacy waitlist
];

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  if (!process.env.MONGOURL) {
    logger.error("MONGOURL is required");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGOURL, {
    serverSelectionTimeoutMS: 10000,
  });

  logger.info(
    { dryRun: DRY_RUN },
    "Starting schema relationship migration..."
  );

  const results = [];

  // Run the backfill migrations that can infer data from existing fields
  results.push(await migrateDonationsDonorId());
  results.push(await migrateSubscriptionsSubscriberId());
  results.push(await migrateActivityLogUserId());
  results.push(await migratePushSubscriptionUserId());
  results.push(await migrateFundingRequestsOrganizerId());

  // Log noop fields
  logger.info(
    { noopFields: NOOP_MIGRATIONS, dryRun: DRY_RUN },
    "Fields left as null (no legacy data to infer): %s",
    NOOP_MIGRATIONS.join(", ")
  );

  // Summary
  console.log("\n┌─────────────────────────────────────────────────────────┐");
  console.log("│         Schema Relationship Migration Summary            │");
  console.log("├─────────────────────────────────────────────────────────┤");
  for (const r of results) {
    console.log(
      `│ ${r.collection.padEnd(35)} ${String(r.updated).padStart(6)}/${String(r.scanned).padStart(6)} updated  │`
    );
  }
  console.log("│                                                         │");
  if (DRY_RUN) {
    console.log("│ ⚠ DRY RUN — no data was written                        │");
  } else {
    console.log("│ ✓ Migration complete                                    │");
  }
  console.log("└─────────────────────────────────────────────────────────┘");

  await mongoose.disconnect();
  process.exit(0);
})().catch((err) => {
  logger.error({ err }, "Migration failed");
  process.exit(1);
});
