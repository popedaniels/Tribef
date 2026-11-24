#!/usr/bin/env node
// Copy evidence media from MongoDB GridFS to S3/R2 (services/s3Store.js).
// Idempotent: objects already in the bucket are skipped. Each copy is
// verified by reading it back and comparing SHA-256 of the decrypted bytes
// with the GridFS original before it counts. GridFS files are NOT deleted
// unless you pass --delete-after-verify (do that only after a backup and a
// few days of serving from S3).
//
//   node scripts/migrate-media-to-s3.js [--dry-run] [--delete-after-verify]
require("dotenv").config();
const crypto = require("crypto");
const mongoose = require("mongoose");
const { gridStore } = require("../services/mediaStore");
const s3 = require("../services/s3Store");

const dry = process.argv.includes("--dry-run");
const del = process.argv.includes("--delete-after-verify");
const sha = (b) => crypto.createHash("sha256").update(b).digest("hex");

(async () => {
  if (!s3.configured()) throw new Error("Set STORAGE_BUCKET, STORAGE_ACCESS_KEY_ID and STORAGE_SECRET_ACCESS_KEY");
  await mongoose.connect(process.env.MONGOURL);
  const store = s3.s3Store();
  const files = mongoose.connection.db.collection("evidenceMedia.files").find({}, { projection: { _id: 1, metadata: 1, length: 1 } });
  let copied = 0;
  let skipped = 0;
  let failed = 0;
  for await (const f of files) {
    const id = String(f._id);
    if (await store.get(id).catch(() => null)) {
      skipped += 1;
      continue;
    }
    if (dry) {
      copied += 1;
      continue;
    }
    try {
      const orig = await gridStore.get(id);
      await store.put(orig.buffer, { contentType: orig.contentType, encrypt: Boolean(f.metadata?.encrypted), key: s3.keyFor(id) });
      const back = await store.get(id);
      if (!back || sha(back.buffer) !== sha(orig.buffer)) throw new Error("read-back hash mismatch");
      if (del) await gridStore.remove(id);
      copied += 1;
    } catch (err) {
      failed += 1;
      console.error(`  ✘ ${id}: ${err.message}`);
    }
  }
  console.log(`${dry ? "[dry run] would copy" : "copied"} ${copied}, already there ${skipped}, failed ${failed}`);
  await mongoose.disconnect();
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
