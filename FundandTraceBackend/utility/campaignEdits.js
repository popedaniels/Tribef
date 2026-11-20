// What a campaign organiser is allowed to change.
//
// The wizard's "save" endpoint used to pass the client's whole campaign object
// to findOneAndUpdate, and the funding step replaced the whole `funding`
// sub-document. An organiser could therefore set their own escrow balance,
// un-suspend their campaign, clear a dispute freeze, change organizerId or
// point stripeConnect.accountId at another Stripe account. Only the sections
// below are organiser-editable; everything else is server-owned.

const { encrypt } = require("./encryption");

const EDITABLE_SECTIONS = ["basicInformation", "content", "team", "settings"];
const EDITABLE_FUNDING = ["currency", "amountExpected", "bankName", "accountName", "accountNumber", "sortCode", "bankCode"];
const ENCRYPTED_FUNDING = ["bankName", "accountName", "accountNumber", "sortCode"];

const isPlainObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const encryptOnce = (value) => {
  if (value === undefined || value === null || value === "") return value;
  const s = String(value);
  return s.startsWith("v2:") ? s : encrypt(s);
};

/**
 * Build a $set update from organiser input.
 * @param {object} input     client payload (whole campaign or a section)
 * @param {object} existing  current campaign document
 * @returns {{ set: object, errors: string[] }}
 */
function buildOrganizerUpdate(input, existing) {
  const set = {};
  const errors = [];
  if (!isPlainObject(input)) return { set, errors: ["Invalid campaign payload"] };

  for (const section of EDITABLE_SECTIONS) {
    if (isPlainObject(input[section])) set[section] = input[section];
  }

  if (typeof input.category === "string" && !existing.launched) {
    set.category = input.category.toLowerCase().split(" ").join("").slice(0, 60);
  }

  if (isPlainObject(input.funding)) {
    const raised = Number(existing.funding?.amountRaised || 0);
    for (const key of EDITABLE_FUNDING) {
      if (!(key in input.funding)) continue;
      let value = input.funding[key];
      if (key === "amountExpected") {
        value = Number(value);
        if (!Number.isFinite(value) || value < 0) {
          errors.push("funding goal must be a positive number");
          continue;
        }
      }
      if (key === "currency") {
        value = String(value || "").toUpperCase().slice(0, 3);
        // Changing currency after money arrived would mis-state every amount.
        if (raised > 0 && value !== String(existing.funding?.currency || "").toUpperCase()) {
          errors.push("currency can't change after donations have been received");
          continue;
        }
      }
      if (ENCRYPTED_FUNDING.includes(key)) value = encryptOnce(value);
      if (key === "bankCode") value = String(value || "").slice(0, 32);
      set[`funding.${key}`] = value;
    }
  }
  return { set, errors };
}

module.exports = { buildOrganizerUpdate, EDITABLE_SECTIONS, EDITABLE_FUNDING };
