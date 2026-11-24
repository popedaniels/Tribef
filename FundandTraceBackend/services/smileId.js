// Smile ID Enhanced KYC (job type 5): look an ID number up in the issuing
// authority's database (NIMC for NIN, NIBSS for BVN, NIA for the Ghana Card,
// IPRS for Kenya's National ID) and compare the names to the account.
// https://docs.usesmileid.com — synchronous /v1/id_verification.
//
// Privacy: we never store the ID number or the personal data Smile ID returns.
// We keep the last 4 digits, a keyed hash (to spot one ID used on several
// accounts) and the match result.
const crypto = require("crypto");
const axios = require("axios");

const ID_TYPES = {
  NG: { NIN_V2: { label: "NIN (National Identification Number)", re: /^\d{11}$/ }, BVN: { label: "BVN (Bank Verification Number)", re: /^\d{11}$/ } },
  GH: { GHANA_CARD: { label: "Ghana Card", re: /^GHA-\d{9}-\d$/ } },
  KE: { NATIONAL_ID: { label: "National ID", re: /^\d{7,9}$/ } },
};

const configured = () => Boolean(process.env.SMILE_ID_PARTNER_ID && process.env.SMILE_ID_API_KEY);
const baseUrl = () => (process.env.SMILE_ID_ENV === "production" ? "https://api.smileidentity.com/v1" : "https://testapi.smileidentity.com/v1");

/** Signature per Smile ID docs: base64(HMAC-SHA256(api_key, timestamp + partner_id + "sid_request")). */
function sign(timestamp, partnerId = process.env.SMILE_ID_PARTNER_ID, apiKey = process.env.SMILE_ID_API_KEY) {
  return crypto.createHmac("sha256", apiKey).update(timestamp, "utf8").update(partnerId, "utf8").update("sid_request", "utf8").digest("base64");
}

function normaliseId(country, idType, idNumber) {
  const raw = String(idNumber || "").trim().toUpperCase();
  return country === "GH" && idType === "GHANA_CARD" ? raw.replace(/\s+/g, "") : raw.replace(/[\s-]+/g, "");
}

/** Keyed hash so the stored value can't be brute-forced back to an 11-digit NIN. */
function idHash(country, idType, idNumber) {
  const key = process.env.ID_HASH_KEY || process.env.SECURITY_KEY || "";
  return crypto.createHmac("sha256", key).update(`${country}|${idType}|${normaliseId(country, idType, idNumber)}`).digest("hex");
}

const tokens = (s) =>
  String(s || "")
    .toUpperCase()
    .normalize("NFKD")
    .replace(/[^A-Z ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1);

/** "exact" | "partial" | "none": every account name found among the ID's names, some, or none. */
function compareNames(account = {}, record = {}) {
  const have = new Set([...tokens(record.FirstName), ...tokens(record.LastName), ...tokens(record.OtherNames), ...tokens(record.FullName)]);
  const want = [...tokens(account.firstName), ...tokens(account.lastName)];
  if (!have.size || !want.length) return "none";
  const hits = want.filter((w) => have.has(w)).length;
  return hits === want.length ? "exact" : hits > 0 ? "partial" : "none";
}

/** Map Smile ID's ResultCode to our outcome. */
function outcomeFor(code) {
  if (code === "1012") return "verified";
  if (code === "1013") return "not_found";
  if (code === "1014") return "bad_format";
  if (code === "1015") return "unavailable";
  return "error";
}

/**
 * Run the lookup. Returns { outcome, nameMatch, dobMatch, jobId, resultCode, resultText }.
 * Throws {status:400} for unsupported types or a malformed number.
 */
async function verifyIdNumber({ country, idType, idNumber, firstName, lastName, dob, userId }) {
  const cc = String(country || "").toUpperCase();
  const type = ID_TYPES[cc]?.[idType];
  if (!type) throw Object.assign(new Error("That ID type isn't supported for this country."), { status: 400, code: "unsupported_id" });
  const number = normaliseId(cc, idType, idNumber);
  if (!type.re.test(number)) throw Object.assign(new Error(`That doesn't look like a valid ${type.label}.`), { status: 400, code: "bad_id_format" });
  if (!configured()) throw Object.assign(new Error("ID database checks aren't switched on."), { status: 503, code: "smile_id_not_configured" });

  const timestamp = new Date().toISOString();
  const jobId = `ft-${crypto.randomBytes(8).toString("hex")}`;
  const body = {
    partner_id: process.env.SMILE_ID_PARTNER_ID,
    source_sdk: "rest_api",
    source_sdk_version: "1.0.0",
    timestamp,
    signature: sign(timestamp),
    country: cc,
    id_type: idType,
    id_number: number,
    first_name: firstName || "",
    last_name: lastName || "",
    ...(dob ? { dob } : {}),
    partner_params: { job_type: 5, job_id: jobId, user_id: String(userId || "") },
  };
  const { data } = await axios.post(`${baseUrl()}/id_verification`, body, { timeout: 30000 });
  const resultCode = String(data?.ResultCode || "");
  const outcome = outcomeFor(resultCode);
  return {
    outcome,
    nameMatch: outcome === "verified" ? compareNames({ firstName, lastName }, data) : "none",
    dobMatch: dob && data?.DOB ? String(data.DOB).slice(0, 10) === String(dob).slice(0, 10) : null,
    jobId: String(data?.SmileJobID || jobId),
    resultCode,
    resultText: String(data?.ResultText || "").slice(0, 120),
  };
}

const supportedTypes = () => Object.fromEntries(Object.entries(ID_TYPES).map(([cc, types]) => [cc, Object.entries(types).map(([id, t]) => ({ id, label: t.label }))]));

module.exports = { verifyIdNumber, sign, idHash, compareNames, outcomeFor, normaliseId, supportedTypes, configured, ID_TYPES };
