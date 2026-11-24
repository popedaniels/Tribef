process.env.SECURITY_KEY = "c".repeat(64);
process.env.STORAGE_BUCKET = "ft-test";
const { s3Store, routingStore, keyFor } = require("../../services/s3Store");
const { memoryStore } = require("../../services/mediaStore");

function fakeS3() {
  const objects = new Map();
  const send = async (cmd) => {
    const { Key, Body, Metadata, ContentType } = cmd.input;
    const kind = cmd.constructor.name;
    if (kind === "PutObjectCommand") return objects.set(Key, { Body, Metadata, ContentType }), {};
    if (kind === "GetObjectCommand") {
      const o = objects.get(Key);
      if (!o) throw Object.assign(new Error("nope"), { name: "NoSuchKey" });
      return { Body: { transformToByteArray: async () => new Uint8Array(o.Body) }, Metadata: o.Metadata, ContentType: o.ContentType };
    }
    if (kind === "DeleteObjectCommand") return objects.delete(Key), {};
    throw new Error(kind);
  };
  return { objects, send };
}

describe("S3/R2 media store", () => {
  it("round-trips plain files with their content type", async () => {
    const f = fakeS3();
    const store = s3Store(f.send);
    const id = await store.put(Buffer.from("receipt"), { contentType: "image/jpeg" });
    expect(id).toMatch(/^s3:evidence\/\d{4}\/\d{2}\/[0-9a-f]{32}$/);
    expect(await store.get(id)).toEqual({ buffer: Buffer.from("receipt"), contentType: "image/jpeg" });
  });

  it("encrypts identity media before it leaves the app", async () => {
    const f = fakeS3();
    const store = s3Store(f.send);
    const id = await store.put(Buffer.from("passport scan"), { contentType: "image/jpeg", encrypt: true });
    const stored = f.objects.get(id.slice(3));
    expect(Buffer.from(stored.Body).includes(Buffer.from("passport"))).toBe(false);
    expect(stored.ContentType).toBe("application/octet-stream");
    expect((await store.get(id)).buffer.toString()).toBe("passport scan");
  });

  it("serves migrated legacy ids from S3 and falls back to GridFS", async () => {
    const f = fakeS3();
    const grid = memoryStore();
    const legacyId = await grid.put(Buffer.from("old"), { contentType: "image/png" });
    const router = routingStore(s3Store(f.send), grid);
    expect((await router.get(legacyId)).buffer.toString()).toBe("old"); // not migrated yet
    await s3Store(f.send).put(Buffer.from("old"), { contentType: "image/png", key: keyFor(legacyId) });
    await grid.remove(legacyId);
    expect((await router.get(legacyId)).buffer.toString()).toBe("old"); // now from S3
    expect(await router.get("s3:missing")).toBeNull();
  });
});
