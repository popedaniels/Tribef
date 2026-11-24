// Client side of live evidence (see FundandTraceBackend/services/evidence.js).
import { getApiBaseUrl } from "./api";

export type Slot = "id_front" | "id_back" | "selfie_video" | "photo" | "video";

export type CaptureSession = {
  id: string;
  kind: "identity" | "evidence";
  purpose?: string;
  campaignId?: string;
  fundingRequestId?: string;
  docType?: string;
  docCountry?: string;
  code: string;
  prompts: string[];
  slots: Slot[];
  issuedAt: string;
  expiresAt: string;
  status: "open" | "submitted" | "approved" | "rejected" | "expired";
  records: { slot: Slot; recordId: string; mime: string; sha256: string }[];
  captureToken?: string;
  handoffUrl?: string;
  qr?: string;
};

export type SealedRecord = {
  id: string;
  seq: number;
  kind: string;
  purpose: string;
  slot: Slot;
  sessionId: string;
  userId: string;
  campaignId: string;
  fundingRequestId: string;
  visibility: "public" | "private";
  mime: string;
  bytes: number;
  sha256: string;
  challengeCode: string;
  prompts: string[];
  issuedAt: string;
  receivedAt: string;
  client: { capturedAt?: string | null; width?: number | null; height?: number | null; durationMs?: number | null; facingMode?: string; userAgent?: string };
  locationCoarse: { lat: number; lng: number } | null;
  locationCommitment: string;
  ipCountry: string;
  flags: string[];
  recordHash: string;
  prevHash: string;
  hash: string;
  signature: string;
  keyId: string;
  mediaAvailable: boolean;
  caption?: string;
  mediaUrl?: string | null;
};

/** Absolute URL for a path the API returned ("/api/evidence/records/…/media"). */
export const apiUrl = (path?: string | null) => {
  if (!path) return "";
  return path.startsWith("/api/") ? `${getApiBaseUrl()}${path}` : path;
};

export const hex = (buf: ArrayBuffer) =>
  Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

export const sha256Bytes = async (data: ArrayBuffer | Blob) =>
  hex(await crypto.subtle.digest("SHA-256", data instanceof Blob ? await data.arrayBuffer() : data));
export const sha256Text = async (text: string) => hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)));

const iso = (d?: string | null) => (d ? new Date(d).toISOString() : "");
const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));

/** Same canonical form as services/evidence.js — order is part of the format. */
export const canonicalRecord = (r: SealedRecord) =>
  JSON.stringify([
    "v1",
    str(r.id),
    str(r.sessionId),
    str(r.userId),
    str(r.kind),
    str(r.purpose),
    str(r.slot),
    str(r.campaignId),
    str(r.fundingRequestId),
    str(r.visibility),
    str(r.mime),
    Number(r.bytes),
    str(r.sha256),
    str(r.challengeCode),
    (r.prompts || []).map(String),
    iso(r.issuedAt),
    iso(r.receivedAt),
    iso(r.client?.capturedAt),
    r.client?.width ?? null,
    r.client?.height ?? null,
    r.client?.durationMs ?? null,
    str(r.client?.facingMode),
    str(r.client?.userAgent),
    r.locationCoarse ? [r.locationCoarse.lat, r.locationCoarse.lng] : null,
    str(r.locationCommitment),
    str(r.ipCountry),
    (r.flags || []).map(String),
  ]);

export type VerifyResult = {
  fileMatches: boolean | null;
  recordMatches: boolean;
  linkMatches: boolean;
  signature: boolean | null;
};

const b64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const fromHex = (h: string) => new Uint8Array(h.match(/../g)!.map((x) => parseInt(x, 16)));

/** Verify the Ed25519 signature in the browser where supported (null if not). */
async function verifySignature(r: SealedRecord, publicKeyPem: string): Promise<boolean | null> {
  try {
    const der = b64(publicKeyPem.replace(/-----[^-]+-----/g, "").replace(/\s+/g, ""));
    const key = await crypto.subtle.importKey("spki", der, { name: "Ed25519" }, false, ["verify"]);
    return await crypto.subtle.verify({ name: "Ed25519" }, key, b64(r.signature), fromHex(r.recordHash));
  } catch {
    return null; // browser without Ed25519 in WebCrypto
  }
}

/**
 * Check a sealed record in the visitor's browser: download the file and hash
 * it, recompute the record hash and chain link, and verify our signature.
 */
export async function verifyRecordInBrowser(r: SealedRecord): Promise<VerifyResult> {
  let fileMatches: boolean | null = null;
  if (r.mediaUrl) {
    const res = await fetch(apiUrl(r.mediaUrl), { credentials: "include", cache: "no-store" });
    fileMatches = res.ok ? (await sha256Bytes(await res.arrayBuffer())) === r.sha256 : null;
  }
  const recordMatches = (await sha256Text(`ft-evidence-record:v1:${canonicalRecord(r)}`)) === r.recordHash;
  const linkMatches = (await sha256Text(`ft-evidence-chain:v1:${r.seq}:${r.prevHash}:${r.recordHash}`)) === r.hash;
  let signature: boolean | null = null;
  try {
    const keyRes = await fetch(`${getApiBaseUrl()}/api/evidence/public-key`);
    const key = (await keyRes.json())?.data;
    if (key?.keyId === r.keyId) signature = await verifySignature(r, key.publicKeyPem);
  } catch {
    signature = null;
  }
  return { fileMatches, recordMatches, linkMatches, signature };
}

export const SLOT_LABEL: Record<Slot, string> = {
  id_front: "Front of your ID",
  id_back: "Back of your ID",
  selfie_video: "Short selfie video",
  photo: "Photo",
  video: "Video",
};

export const DOC_TYPES = [
  { value: "passport", label: "Passport" },
  { value: "national_id", label: "National ID card (NIN slip, Ghana Card, Kenyan ID…)" },
  { value: "drivers_licence", label: "Driver's licence" },
  { value: "residence_permit", label: "Residence permit / BRP" },
  { value: "voters_card", label: "Voter's card" },
];

export const FLAG_LABEL: Record<string, string> = {
  no_location: "No location shared",
  no_device_time: "Phone didn't report its time",
  device_clock_mismatch: "Phone clock differed from ours by over 10 minutes",
};
