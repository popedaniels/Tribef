// S3-compatible object storage for evidence media (AWS S3, Cloudflare R2,
// Backblaze B2, MinIO…). Same interface as the GridFS store.
//
//   STORAGE_BUCKET=ft-evidence
//   STORAGE_REGION=eu-west-2            (R2: "auto")
//   STORAGE_ENDPOINT=                   (R2: https://<account>.r2.cloudflarestorage.com)
//   STORAGE_ACCESS_KEY_ID / STORAGE_SECRET_ACCESS_KEY
//   STORAGE_SSE=AES256                  (AWS only; R2 always encrypts at rest)
//
// Identity media is additionally encrypted by the app (AES-256-GCM) before
// upload, exactly as in GridFS. New objects get ids "s3:<key>". Files copied
// from GridFS keep their original id and live under "legacy/<id>"
// (sealed evidence records can't change their storageId).
const crypto = require("crypto");
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { encryptBuffer, decryptBuffer } = require("./mediaStore");

const configured = () => Boolean(process.env.STORAGE_BUCKET && process.env.STORAGE_ACCESS_KEY_ID && process.env.STORAGE_SECRET_ACCESS_KEY);

let client = null;
const s3 = () =>
  (client ||= new S3Client({
    region: process.env.STORAGE_REGION || "auto",
    ...(process.env.STORAGE_ENDPOINT ? { endpoint: process.env.STORAGE_ENDPOINT, forcePathStyle: process.env.STORAGE_PATH_STYLE === "true" } : {}),
    credentials: { accessKeyId: process.env.STORAGE_ACCESS_KEY_ID, secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY },
  }));
const Bucket = () => process.env.STORAGE_BUCKET;

const keyFor = (id) => (String(id).startsWith("s3:") ? String(id).slice(3) : `legacy/${id}`);

async function streamToBuffer(body) {
  if (!body) return Buffer.alloc(0);
  if (typeof body.transformToByteArray === "function") return Buffer.from(await body.transformToByteArray());
  const chunks = [];
  for await (const c of body) chunks.push(c);
  return Buffer.concat(chunks);
}

function s3Store(send = (cmd) => s3().send(cmd)) {
  return {
    async put(buffer, { contentType, encrypt = false, key } = {}) {
      let body = buffer;
      const Metadata = { encrypted: "false" };
      if (encrypt) {
        const enc = encryptBuffer(buffer);
        body = enc.body;
        Object.assign(Metadata, { encrypted: "true", iv: enc.iv, tag: enc.tag });
      }
      const d = new Date();
      const objectKey = key || `evidence/${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${crypto.randomBytes(16).toString("hex")}`;
      await send(
        new PutObjectCommand({
          Bucket: Bucket(),
          Key: objectKey,
          Body: body,
          ContentType: encrypt ? "application/octet-stream" : contentType,
          Metadata: { ...Metadata, "original-content-type": String(contentType || "") },
          ...(process.env.STORAGE_SSE ? { ServerSideEncryption: process.env.STORAGE_SSE } : {}),
          CacheControl: "private, no-store",
        })
      );
      return key ? key : `s3:${objectKey}`;
    },

    async get(id) {
      try {
        const out = await send(new GetObjectCommand({ Bucket: Bucket(), Key: keyFor(id) }));
        let buffer = await streamToBuffer(out.Body);
        const m = out.Metadata || {};
        if (m.encrypted === "true") buffer = decryptBuffer(buffer, { iv: m.iv, tag: m.tag });
        return { buffer, contentType: m["original-content-type"] || out.ContentType || "application/octet-stream" };
      } catch (err) {
        if (err?.name === "NoSuchKey" || err?.$metadata?.httpStatusCode === 404) return null;
        throw err;
      }
    },

    async remove(id) {
      await send(new DeleteObjectCommand({ Bucket: Bucket(), Key: keyFor(id) }));
    },
  };
}

/**
 * New writes go to S3; reads try S3 first for legacy GridFS ids (after
 * migration) and fall back to GridFS, so nothing breaks mid-migration.
 */
function routingStore(s3s, grid) {
  return {
    put: (buffer, opts) => s3s.put(buffer, opts),
    async get(id) {
      if (String(id).startsWith("s3:")) return s3s.get(id);
      return (await s3s.get(id).catch(() => null)) || grid.get(id);
    },
    async remove(id) {
      if (String(id).startsWith("s3:")) return s3s.remove(id);
      await s3s.remove(id).catch(() => {});
      return grid.remove(id);
    },
  };
}

module.exports = { s3Store, routingStore, configured, keyFor };
