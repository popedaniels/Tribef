/**
 * @jest-environment node
 */
// The donor-facing "Verify" button must hash exactly like the server
// (FundandTraceBackend/services/evidence.js). This fixture — including the
// Ed25519 signature — was produced by the server implementation; if either
// side changes the canonical form, this test fails.
import { webcrypto } from "crypto";
import { canonicalRecord, sha256Text, sha256Bytes, verifyRecordInBrowser, SealedRecord } from "../evidence";

if (!globalThis.crypto?.subtle) {
  // @ts-ignore - Node test environment
  globalThis.crypto = webcrypto;
}

const SERVER_RECORD: SealedRecord = {
  "id": "6741d2f0a1b2c3d4e5f60718",
  "seq": 42,
  "kind": "evidence",
  "purpose": "receipt",
  "slot": "photo",
  "sessionId": "6741d2f0a1b2c3d4e5f60719",
  "userId": "6741d2f0a1b2c3d4e5f6071a",
  "campaignId": "6741d2f0a1b2c3d4e5f6071b",
  "fundingRequestId": "6741d2f0a1b2c3d4e5f6071c",
  "visibility": "public",
  "mime": "image/jpeg",
  "bytes": 21,
  "sha256": "3b9e370428433e376096ea5605a3069463d08064d2dbfe0f735fa89a69f59257",
  "challengeCode": "K7M2QX",
  "prompts": [],
  "issuedAt": "2026-11-23T10:00:00.000Z",
  "receivedAt": "2026-11-23T10:03:10.123Z",
  "client": {
    "capturedAt": "2026-11-23T10:03:05.500Z",
    "width": 1280,
    "height": 720,
    "durationMs": null,
    "facingMode": "environment",
    "userAgent": "Mozilla/5.0 (Linux; Android 14) “quoted” é"
  },
  "locationCoarse": {
    "lat": 6.45,
    "lng": 3.39
  },
  "locationCommitment": "abababababababababababababababababababababababababababababababab",
  "ipCountry": "NG",
  "flags": [
    "device_clock_mismatch"
  ],
  "recordHash": "296c96bb5949d8a7e52d16762360ded510ad780328eb41abc30dd8d993d6a9ba",
  "prevHash": "cdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcd",
  "hash": "ff7d2c9bf0ae186eb47cdf023ddf9a672f07ecaa921a533dfeac2d90bdd144d9",
  "signature": "E4ZNXB0XpyqWGGRwt5E7wcZNWlGF6tJsnkyOy/fu8ZDoTBwi3hXEnKZCrfW5BpaITbUIfV1KYqRW8zWNDLenCw==",
  "keyId": "f1e8c03b661791a6",
  "mediaAvailable": true
};
const FILE = Buffer.from("Zml4dHVyZS1qcGVnLWJ5dGVzLcOp", "base64");
const PUBLIC_KEY_PEM = "-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEAQ4X8nAenoD+6GE6IC1xtxGG8abgx5lp7jpP1pPlJl9c=\n-----END PUBLIC KEY-----\n";

describe("sealed evidence verification in the browser", () => {
  it("recomputes the server's record hash and chain link", async () => {
    expect(await sha256Text(`ft-evidence-record:v1:${canonicalRecord(SERVER_RECORD)}`)).toBe(SERVER_RECORD.recordHash);
    expect(await sha256Text(`ft-evidence-chain:v1:${SERVER_RECORD.seq}:${SERVER_RECORD.prevHash}:${SERVER_RECORD.recordHash}`)).toBe(SERVER_RECORD.hash);
  });

  it("matches the file fingerprint", async () => {
    expect(await sha256Bytes(new Uint8Array(FILE).buffer)).toBe(SERVER_RECORD.sha256);
  });

  it("runs every check end to end, and catches a changed detail or file", async () => {
    const fetchMock = jest.fn(async (url: string) => {
      if (url.endsWith("/api/evidence/public-key")) return { ok: true, json: async () => ({ data: { keyId: SERVER_RECORD.keyId, publicKeyPem: PUBLIC_KEY_PEM } }) };
      return { ok: true, arrayBuffer: async () => new Uint8Array(FILE).buffer };
    });
    // @ts-ignore
    globalThis.fetch = fetchMock;
    const withMedia = { ...SERVER_RECORD, mediaUrl: "/api/evidence/records/x/media" };
    const ok = await verifyRecordInBrowser(withMedia);
    expect(ok.fileMatches).toBe(true);
    expect(ok.recordMatches).toBe(true);
    expect(ok.linkMatches).toBe(true);
    // Node 22 WebCrypto has Ed25519, as do current Chrome, Safari and Firefox.
    expect(ok.signature).toBe(true);

    const moved = await verifyRecordInBrowser({ ...withMedia, locationCoarse: { lat: 6.46, lng: 3.39 } });
    expect(moved.recordMatches).toBe(false);
    const backdated = await verifyRecordInBrowser({ ...withMedia, receivedAt: "2026-11-22T10:03:10.123Z" });
    expect(backdated.recordMatches).toBe(false);

    // @ts-ignore
    globalThis.fetch = jest.fn(async (url: string) =>
      url.endsWith("public-key")
        ? { ok: true, json: async () => ({ data: { keyId: SERVER_RECORD.keyId, publicKeyPem: PUBLIC_KEY_PEM } }) }
        : { ok: true, arrayBuffer: async () => new TextEncoder().encode("a different photo").buffer }
    );
    expect((await verifyRecordInBrowser(withMedia)).fileMatches).toBe(false);
  });
});
