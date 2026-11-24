// Storage for captured evidence files.
//
// Files live in MongoDB GridFS (bucket "evidenceMedia"), in the same region as
// the rest of the data and private by default — no public bucket URL exists.
// Identity files (ID photos, selfie videos) are encrypted with AES-256-GCM
// under a key derived from SECURITY_KEY before they are written, so a database
// dump alone does not expose anyone's passport.
//
// The interface is small so another backend (S3/R2 with SSE) can replace it:
//   put(buffer, { filename, contentType, encrypt }) → id
//   get(id) → { buffer, contentType }
//   remove(id)

const crypto = require("crypto");
const mongoose = require("mongoose");

const BUCKET = "evidenceMedia";

let mediaKey = null;
const getMediaKey = () => {
  if (mediaKey) return mediaKey;
  if (!process.env.SECURITY_KEY) throw new Error("SECURITY_KEY is required to encrypt identity media");
  mediaKey = Buffer.from(
    crypto.hkdfSync("sha256", Buffer.from(process.env.SECURITY_KEY, "hex"), Buffer.alloc(0), Buffer.from("ft-evidence-media:v1"), 32)
  );
  return mediaKey;
};

function encryptBuffer(plain, key = getMediaKey()) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const body = Buffer.concat([cipher.update(plain), cipher.final()]);
  return { body, iv: iv.toString("hex"), tag: cipher.getAuthTag().toString("hex") };
}

function decryptBuffer(body, { iv, tag }, key = getMediaKey()) {
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "hex"));
  decipher.setAuthTag(Buffer.from(tag, "hex"));
  return Buffer.concat([decipher.update(body), decipher.final()]);
}

const bucket = () => new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: BUCKET });

const gridStore = {
  async put(buffer, { filename, contentType, encrypt = false }) {
    let body = buffer;
    const metadata = { contentType, encrypted: false };
    if (encrypt) {
      const enc = encryptBuffer(buffer);
      body = enc.body;
      Object.assign(metadata, { encrypted: true, iv: enc.iv, tag: enc.tag });
    }
    return new Promise((resolve, reject) => {
      const upload = bucket().openUploadStream(filename, { metadata });
      upload.once("error", reject);
      upload.once("finish", () => resolve(String(upload.id)));
      upload.end(body);
    });
  },

  async get(id) {
    const _id = new mongoose.Types.ObjectId(String(id));
    const [file] = await bucket().find({ _id }).limit(1).toArray();
    if (!file) return null;
    const chunks = [];
    await new Promise((resolve, reject) => {
      bucket()
        .openDownloadStream(_id)
        .on("data", (c) => chunks.push(c))
        .once("error", reject)
        .once("end", resolve);
    });
    let buffer = Buffer.concat(chunks);
    if (file.metadata?.encrypted) buffer = decryptBuffer(buffer, file.metadata);
    return { buffer, contentType: file.metadata?.contentType || "application/octet-stream" };
  },

  async remove(id) {
    try {
      await bucket().delete(new mongoose.Types.ObjectId(String(id)));
    } catch (err) {
      if (!/FileNotFound|not found/i.test(String(err?.message))) throw err;
    }
  },
};

// In-memory store for tests.
function memoryStore() {
  const files = new Map();
  let n = 0;
  return {
    files,
    async put(buffer, { contentType, encrypt = false }) {
      n += 1;
      const id = `mem${n}`;
      files.set(id, encrypt ? { ...encryptBuffer(buffer), contentType, encrypted: true } : { body: buffer, contentType });
      return id;
    },
    async get(id) {
      const f = files.get(String(id));
      if (!f) return null;
      return { buffer: f.encrypted ? decryptBuffer(f.body, f) : f.body, contentType: f.contentType };
    },
    async remove(id) {
      files.delete(String(id));
    },
  };
}

// Object storage when configured (services/s3Store.js), else GridFS.
let current = gridStore;
module.exports = {
  /** Call once at startup, after the module graph is loaded. */
  useConfiguredStore() {
    const s3 = require("./s3Store");
    if (s3.configured() && process.env.NODE_ENV !== "test") current = s3.routingStore(s3.s3Store(), gridStore);
    return current === gridStore ? "gridfs" : "s3";
  },
  get store() {
    return current;
  },
  setStore(s) {
    current = s;
  },
  gridStore,
  memoryStore,
  encryptBuffer,
  decryptBuffer,
};
