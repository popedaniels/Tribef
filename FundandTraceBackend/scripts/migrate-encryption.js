// One-time migration: re-encrypt legacy static-IV AES-CBC records with the
// randomized-IV AES-256-GCM scheme (utility/encryption v2 format).
//
// Usage:
//   MONGOURL=... node scripts/migrate-encryption.js [--dry-run] [--encrypt-plaintext]
//
// --encrypt-plaintext also encrypts sensitive fields that were stored as
// PLAINTEXT. Third-party funding-request bank details were never encrypted
// because the API compared fundingType against "thirdParty" while the web app
// sends "third-party" (fixed in utility/fundingType.js). Run this once after
// deploying that fix. It also normalizes stored fundingType values.
//
// Requires SECURITY_KEY (same key as production) and INIT_VECTOR (to decrypt
// the legacy records). Safe to re-run: already-migrated (v2) values are
// skipped. After a successful run with zero remaining legacy values,
// INIT_VECTOR can be removed from the environment.

process.env.NODE_ENV = process.env.NODE_ENV || "production";
require("dotenv").config();

const mongoose = require("mongoose");
const logger = require("../utility/logger");
const { encrypt, decrypt, isLegacyCiphertext } = require("../utility/encryption");
const { THIRD_PARTY } = require("../utility/fundingType");

// Import the models directly. The previous mongoose.model("Campaign" |
// "FundingRequest" | "Users") lookups did not match the registered names
// ("campaign", "fundingRequest", "User") and threw MissingSchemaError.
const { Campaign } = require("../models/campaignModel");
const { FundingRequests } = require("../models/fundingRequestModel");
const { Users } = require("../models/users");

const DRY_RUN = process.argv.includes("--dry-run");
const ENCRYPT_PLAINTEXT = process.argv.includes("--encrypt-plaintext");
const V2_PREFIX = "v2:";
const BATCH = 200;

const targets = [
  [Campaign, [
    "funding.accountNumber",
    "funding.accountName",
    "funding.bankName",
    "funding.sortCode",
  ]],
  [FundingRequests, [
    "thirdPartyAccountName",
    "thirdPartyAccountNumber",
    "thirdPartyBankName",
    "thirdPartyNameOfRef",
    "thirdPartyContact",
    "disbursement.bankName",
    "disbursement.accountName",
    "disbursement.accountNumber",
  ]],
  [Users, ["twoFactor.secret"]],
];

async function migrateCollection(Model, fields) {
  const collection = Model.collection.name;
  let scanned = 0;
  let migrated = 0;
  const or = fields.map((f) => ({ [f]: { $type: "string", $ne: "" } }));

  const cursor = Model.find({ $or: or }).cursor();
  for await (const doc of cursor) {
    scanned += 1;
    const updates = {};
    for (const field of fields) {
      const value = field.split(".").reduce((acc, part) => acc && acc[part], doc);
      if (typeof value !== "string" || value === "" || value.startsWith(V2_PREFIX)) continue;

      let plaintext = null;
      if (isLegacyCiphertext(value)) {
        try {
          plaintext = decrypt(value);
        } catch (err) {
          // Hex-looking but not decryptable: a plaintext number (e.g. an
          // account number) rather than legacy ciphertext.
          plaintext = ENCRYPT_PLAINTEXT ? value : null;
          if (!ENCRYPT_PLAINTEXT) {
            logger.error(
              { collection, id: String(doc._id), field },
              `Skipping unreadable legacy value (re-run with --encrypt-plaintext if it is plaintext): ${err.message}`
            );
          }
        }
      } else if (ENCRYPT_PLAINTEXT) {
        plaintext = value;
      }
      if (plaintext === null) continue;

      migrated += 1;
      if (!DRY_RUN) updates[field] = encrypt(plaintext);
    }

    if (!DRY_RUN && Object.keys(updates).length > 0) {
      const set = {};
      for (const [field, value] of Object.entries(updates)) set[field] = value;
      await Model.updateOne({ _id: doc._id }, { $set: set });
    }
  }

  return { collection, scanned, migrated };
}

(async () => {
  if (!process.env.MONGOURL) {
    logger.error("MONGOURL is required");
    process.exit(1);
  }
  if (!process.env.INIT_VECTOR && !ENCRYPT_PLAINTEXT) {
    logger.error(
      "INIT_VECTOR is required to decrypt legacy records during migration"
    );
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGOURL);

  const results = [];
  for (const [Model, fields] of targets) {
    results.push(await migrateCollection(Model, fields));
  }

  if (ENCRYPT_PLAINTEXT) {
    const filter = { fundingType: { $in: ["thirdParty", "third_party", "ThirdParty", "Third Party"] } };
    const count = await FundingRequests.countDocuments(filter);
    if (!DRY_RUN && count) await FundingRequests.updateMany(filter, { $set: { fundingType: THIRD_PARTY } });
    logger.info({ count, dryRun: DRY_RUN }, "Normalized fundingType values to 'third-party'");
  }

  for (const r of results) {
    logger.info(
      { ...r, dryRun: DRY_RUN },
      `${r.collection}: ${r.migrated}/${r.scanned} values ${DRY_RUN ? "would be" : ""} migrated`
    );
  }

  await mongoose.disconnect();
  process.exit(0);
})().catch((err) => {
  logger.error({ err }, "Migration failed");
  process.exit(1);
});
