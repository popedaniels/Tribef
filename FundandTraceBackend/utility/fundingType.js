// Single source of truth for funding-request payout types.
//
// The web app has always submitted "third-party" (see FundandTrace
// src/constants/fundingRequestConstants.ts) while the API compared against
// "thirdParty". The mismatch meant third-party bank details were never
// encrypted at rest and approvals paid out to the *campaign's* account
// instead of the requested third party. Every comparison now goes through
// these helpers, and new records are stored in the canonical form.

const THIRD_PARTY = "third-party";

const normalizeFundingType = (value) => {
  if (value === undefined || value === null) return "";
  const compact = String(value).trim().toLowerCase().replace(/[\s_-]+/g, "");
  if (compact === "thirdparty") return THIRD_PARTY;
  return String(value).trim();
};

const isThirdParty = (value) => normalizeFundingType(value) === THIRD_PARTY;

module.exports = { THIRD_PARTY, normalizeFundingType, isThirdParty };
