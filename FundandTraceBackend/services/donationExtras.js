// Gift Aid declarations, fundraising teams and matched giving.
//
// Flow: checkout calls prepare() to validate what the donor sent, then
// save() once the gateway reference is known. When the payment is credited,
// creditCampaign() calls onCredited(), which copies the extras onto the
// Donation and applies matching exactly once.
const crypto = require("crypto");
const { CheckoutIntent } = require("../models/checkoutIntentModel");
const { Charity } = require("../models/charity");
const logger = require("../utility/logger");

const round2 = (n) => Math.round(Number(n) * 100) / 100;
const bad = (code, error) => Object.assign(new Error(error), { status: 400, code });

// HMRC model declaration for a single donation (wording since April 2016),
// adapted to an online tick box. The donor sees exactly this text.
function giftAidWording(charityName) {
  return (
    `I want to Gift Aid my donation to ${charityName}. I am a UK taxpayer and understand that if I pay less ` +
    "Income Tax and/or Capital Gains Tax than the amount of Gift Aid claimed on all my donations in that tax " +
    "year it is my responsibility to pay any difference."
  );
}

// UK postcode (incl. GIR 0AA). HMRC wants capitals with a single space.
const POSTCODE = /^(GIR ?0AA|[A-PR-UWYZ][A-HK-Y]?\d[A-Z\d]? ?\d[ABD-HJLNP-UW-Z]{2})$/i;
function normalisePostcode(p) {
  const s = String(p || "").toUpperCase().replace(/\s+/g, "");
  if (!POSTCODE.test(s)) return "";
  return `${s.slice(0, -3)} ${s.slice(-3)}`;
}
const clean = (s, max) => String(s || "").replace(/[^\p{L}\p{N} '.&-]/gu, "").replace(/-/g, " ").replace(/\s+/g, " ").trim().slice(0, max);

/** Is Gift Aid available on this campaign? Returns the charity or null. */
async function giftAidCharity(campaign) {
  if (!campaign?.charityId) return null;
  if (String(campaign.funding?.currency || "").toUpperCase() !== "GBP") return null;
  const charity = await Charity.findById(campaign.charityId).select("charityName giftAidEnabled hmrcReference").lean();
  if (!charity?.giftAidEnabled || !charity.hmrcReference) return null;
  return charity;
}

/**
 * Validate the extras in a checkout's meta. Throws {status:400, code} on bad
 * input. Returns the fields to store, or null when there is nothing to keep.
 */
async function prepare(meta = {}, campaign) {
  const out = { teamId: "", giftAid: null };

  const teamId = String(meta.teamId || "").trim();
  if (teamId) {
    const team = (campaign.teams || []).find((t) => String(t._id) === teamId);
    if (!team) throw bad("unknown_team", "That team isn't part of this campaign.");
    out.teamId = teamId;
  }

  const ga = meta.giftAid;
  if (ga && (ga.declared === true || ga.declared === "true")) {
    const charity = await giftAidCharity(campaign);
    if (!charity) throw bad("gift_aid_unavailable", "Gift Aid isn't available on this campaign.");
    const firstName = clean(ga.firstName, 35);
    const lastName = clean(ga.lastName, 35);
    const house = clean(ga.houseNameOrNumber, 40);
    const postcode = normalisePostcode(ga.postcode);
    if (!firstName || !lastName) throw bad("gift_aid_name", "Gift Aid needs your first and last name.");
    if (!house) throw bad("gift_aid_address", "Gift Aid needs your house name or number.");
    if (!postcode) throw bad("gift_aid_postcode", "Gift Aid needs a valid UK postcode.");
    out.giftAid = {
      declared: true,
      title: clean(ga.title, 4),
      firstName,
      lastName,
      houseNameOrNumber: house,
      postcode,
      declaredAt: new Date(),
      wording: giftAidWording(charity.charityName || "the charity"),
    };
  }
  return out.teamId || out.giftAid ? out : null;
}

/** Store the extras against the gateway reference (call after the gateway accepted the checkout). */
async function save(ref, campaignId, extras) {
  if (!extras || !ref) return;
  try {
    await CheckoutIntent.create({ _id: String(ref), campaignId, teamId: extras.teamId || "", giftAid: extras.giftAid || undefined });
  } catch (err) {
    if (err?.code !== 11000) logger.error({ err, ref }, "Saving checkout extras failed");
  }
}

/**
 * Called by creditCampaign after a donation was credited. Idempotent: the
 * donation's matchedAt is the claim, so a replayed webhook matches nothing.
 */
async function onCredited({ campaignId, refId, amount }) {
  if (!refId || !(Number(amount) > 0)) return;
  // Lazy: models/campaign requires shared → services; avoid a require cycle.
  const { Donations } = require("../models/donationsModel");
  const { Campaign } = require("../models/campaignModel");
  const tx = String(refId).slice(String(refId).indexOf(":") + 1);
  const who = { campaignId, $or: [{ transactionId: tx }, { transactionRef: tx }] };

  try {
    // Flutterwave credits under its own transaction id, but the intent was
    // saved under our tx_ref, so try every reference the donation carries.
    const rail = String(refId).split(":")[0];
    const d = await Donations.findOne(who).select("transactionId transactionRef").lean();
    const keys = [...new Set([String(refId), d && `${rail}:${d.transactionId}`, d && `${rail}:${d.transactionRef}`].filter(Boolean))];
    const intent = await CheckoutIntent.findOne({ _id: { $in: keys } }).lean();
    if (intent) {
      const set = {};
      if (intent.teamId) set.teamId = intent.teamId;
      if (intent.giftAid?.declared) set.giftAid = intent.giftAid;
      if (Object.keys(set).length) await Donations.updateOne(who, { $set: set });
    }

    const camp = await Campaign.findById(campaignId).select("matching").lean();
    const m = camp?.matching;
    if (!m?.active || !(m.cap > 0) || (m.endsAt && new Date(m.endsAt) < new Date())) return;

    // Claim the donation first so the pledge is counted at most once.
    const claimed = await Donations.findOneAndUpdate({ ...who, matchedAt: null }, { $set: { matchedAt: new Date() } }, { new: true });
    if (!claimed) return;
    const want = round2(Number(amount) * Number(m.ratio || 1));
    // Atomic: add min(want, cap - pledged) so concurrent donations can't overshoot the cap.
    const updated = await Campaign.findOneAndUpdate(
      { _id: campaignId, "matching.active": true, $expr: { $lt: ["$matching.pledged", "$matching.cap"] } },
      [{ $set: { "matching.pledged": { $round: [{ $min: ["$matching.cap", { $add: ["$matching.pledged", want] }] }, 2] } } }],
      { new: false, projection: { matching: 1 } }
    );
    const got = updated ? round2(Math.min(want, updated.matching.cap - updated.matching.pledged)) : 0;
    await Donations.updateOne({ _id: claimed._id }, { $set: { matchedAmount: got } });
  } catch (err) {
    logger.error({ err, campaignId, refId }, "Applying donation extras failed");
  }
}

const slugify = (s) =>
  String(s || "").toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_-]+/g, "-").slice(0, 50) ||
  crypto.randomBytes(3).toString("hex");

module.exports = { prepare, save, onCredited, giftAidCharity, giftAidWording, normalisePostcode, slugify };
