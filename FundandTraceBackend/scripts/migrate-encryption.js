// One-time migration: re-encrypt legacy static-IV AES-CBC records with the
// randomized-IV AES-256-GCM scheme (utility/encryption v2 format).
//
// Usage:
//   MONGOURL=... node scripts/migrate-encryption.js [--dry-run]
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

require("../models/campaignModel");
require("../models/fundingRequestModel");
require("../models/users");

const DRY_RUN = process.argv.includes("--dry-run");
const BATCH = 200;

const targets = {
  Campaign: [
    "funding.accountNumber",
    "funding.accountName",
    "funding.bankName",
    "funding.sortCode",
  ],
  FundingRequest: [
    "thirdPartyAccountName",
    "thirdPartyAccountNumber",
    "thirdPartyBankName",
    "thirdPartyNameOfRef",
    "thirdPartyContact",
    "disbursement.bankName",
    "disbursement.accountName",
    "disbursement.accountNumber",
  ],
  Users: ["twoFactor.secret"],
};

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
      if (!isLegacyCiphertext(value)) continue;

      if (DRY_RUN) {
        migrated += 1;
        continue;
      }
      try {
        updates[field] = encrypt(decrypt(value));
        migrated += 1;
      } catch (err) {
        logger.error(
          { collection, id: String(doc._id), field },
          `Skipping unreadable legacy value: ${err.message}`
        );
      }
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
  if (!process.env.INIT_VECTOR) {
    logger.error(
      "INIT_VECTOR is required to decrypt legacy records during migration"
    );
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGOURL);

  const results = [];
  for (const [modelName, fields] of Object.entries(targets)) {
    const Model = mongoose.model(modelName);
    results.push(await migrateCollection(Model, fields));
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
