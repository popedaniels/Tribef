// Payout review checklist. Puts everything a reviewer has to check before
// approving a funding request on one screen, computed by the server so every
// reviewer applies the same rules.
//
// Each check is "pass", "warn" (look closer) or "fail" (approval would be
// refused or is unsafe). The verdict is the worst of them. Approval itself
// still enforces the hard rules (balance, freeze, KYC) on its own.
const { isThirdParty } = require("../utility/fundingType");
const { railFor } = require("./payoutRails");
const { proofDueDays } = require("./transparency");

const DAY = 864e5;
const fmt = (n) => Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });
const round2 = (n) => Math.round(Number(n || 0) * 100) / 100;

/**
 * Pure: evaluate a funding request. All inputs are plain objects.
 * @param fr          the funding request under review
 * @param campaign    its campaign
 * @param organizer   the organiser's user record (identityVerification, createdAt, suspended)
 * @param history     the campaign's other funding requests
 * @param donations   {total, flagged} counts for the campaign
 */
function evaluatePayout({ fr, campaign, organizer, history = [], donations = { total: 0, flagged: 0 }, now = new Date() }) {
  const checks = [];
  const add = (id, status, label, detail) => checks.push({ id, status, label, detail });
  const currency = String(campaign?.funding?.currency || fr?.currency || "").toUpperCase();
  const amount = round2(fr?.amount);
  const available = round2(campaign?.funding?.availableBalance);
  const raised = round2(campaign?.funding?.amountRaised);
  const thirdParty = isThirdParty(fr?.fundingType);

  // 1. Money is there.
  if (!(amount > 0)) add("amount", "fail", "Valid amount", "The request has no positive amount.");
  else if (available >= amount) add("escrow", "pass", "Escrow covers the request", `${fmt(available)} ${currency} available, ${fmt(amount)} requested.`);
  else add("escrow", "fail", "Escrow covers the request", `Only ${fmt(available)} ${currency} available for ${fmt(amount)} requested.`);

  // 2. Not under dispute.
  if (campaign?.disputeGovernance?.isLocked) add("frozen", "fail", "Campaign not frozen", "Payouts are locked while donor reports are reviewed.");
  else if ((campaign?.disputeGovernance?.disputeCount || 0) > 0)
    add("frozen", "warn", "Campaign not frozen", `${campaign.disputeGovernance.disputeCount} donor report(s) on file, below the freeze threshold.`);
  else add("frozen", "pass", "Campaign not frozen", "No donor reports.");

  // 3. Who gets paid is verified.
  const kyc = organizer?.identityVerification?.status || "unverified";
  if (thirdParty) add("kyc", "pass", "Recipient checks", "Paid directly to a third party; organiser identity not required.");
  else if (kyc === "verified") add("kyc", "pass", "Organiser identity verified", "Identity check passed.");
  else if (process.env.REQUIRE_KYC_FOR_PAYOUT === "false") add("kyc", "warn", "Organiser identity verified", `Status: ${kyc}. KYC enforcement is turned off.`);
  else add("kyc", "fail", "Organiser identity verified", `Status: ${kyc}. Approval will be refused until it's verified.`);

  if (organizer?.suspended) add("account", "fail", "Organiser account in good standing", "The organiser's account is suspended.");

  // 4. There's a way to pay them.
  const connect = campaign?.stripeConnect?.accountId && campaign?.stripeConnect?.payoutsEnabled;
  const bankCode = thirdParty ? fr?.thirdPartyBankCode : campaign?.funding?.bankCode;
  if (connect && !thirdParty) add("rail", "pass", "Payout route", "Stripe Connect account with payouts enabled.");
  else if (bankCode && railFor(currency)) add("rail", "pass", "Payout route", `Bank transfer in ${currency} (bank code ${bankCode}).`);
  else if (thirdParty) add("rail", "warn", "Payout route", "No bank code on file: this will be a manual transfer to the third party.");
  else add("rail", "fail", "Payout route", `No Stripe Connect account and no bank transfer route for ${currency}.`);

  // 4b. A recent bank change holds bank payouts (account-takeover defence).
  if (!thirdParty && !connect && campaign?.funding?.bankChangedAt) {
    const { cooldownRemainingMs } = require("./bankChange");
    const wait = cooldownRemainingMs(campaign, now);
    if (wait > 0) add("bank-change", "fail", "Payout account settled", `Bank account changed ${new Date(campaign.funding.bankChangedAt).toISOString().slice(0, 16).replace("T", " ")} UTC; bank payouts resume in about ${Math.ceil(wait / 3600e3)}h.`);
    else add("bank-change", "warn", "Payout account settled", "The organiser changed their bank account since setting it up. The bank's name for the account is checked at approval.");
  }

  // 5. Evidence for this request.
  if (fr?.proofOfFunding) add("evidence", "pass", "Supporting document", "Invoice or quote attached.");
  else add("evidence", thirdParty ? "fail" : "warn", "Supporting document", thirdParty ? "Third-party payments need an invoice." : "No invoice or quote attached.");
  if (!String(fr?.purposeOfFunding || "").trim()) add("purpose", "fail", "Stated purpose", "The request doesn't say what the money is for.");

  // 6. Track record: earlier payouts have receipts.
  const others = history.filter((h) => String(h._id) !== String(fr?._id));
  const paid = others.filter((h) => h.status === "Approved" && h.disbursement?.dateDisbursed);
  const overdue = paid.filter((h) => !h.disbursement?.receipt && now - new Date(h.disbursement.dateDisbursed) > proofDueDays() * DAY);
  if (!paid.length) add("receipts", "pass", "Receipts for earlier payouts", "First payout for this campaign.");
  else if (overdue.length) add("receipts", "fail", "Receipts for earlier payouts", `${overdue.length} earlier payout(s) are past the ${proofDueDays()}-day receipt deadline.`);
  else add("receipts", "pass", "Receipts for earlier payouts", `${paid.length} earlier payout(s), all accounted for.`);

  // 7. Shape of the request.
  const pendingDupes = others.filter((h) => h.status === "Pending" && round2(h.amount) === amount);
  if (pendingDupes.length) add("duplicate", "warn", "Not a duplicate", `${pendingDupes.length} other pending request(s) for the same amount.`);
  if (raised > 0 && amount / raised > 0.5 && !thirdParty)
    add("size", "warn", "Size of request", `${Math.round((100 * amount) / raised)}% of everything raised, paid to the organiser. Consider paying the supplier directly.`);

  // 8. Where the money came from.
  if (donations.total > 0) {
    const share = donations.flagged / donations.total;
    if (share >= 0.2) add("fraud", "fail", "Donations look genuine", `${donations.flagged} of ${donations.total} donations were flagged by fraud checks.`);
    else if (donations.flagged > 0) add("fraud", "warn", "Donations look genuine", `${donations.flagged} of ${donations.total} donations were flagged by fraud checks.`);
    else add("fraud", "pass", "Donations look genuine", `None of ${donations.total} donations flagged.`);
  }

  // 9. Brand-new organiser accounts deserve a second look. (Users have no
  //    createdAt field; the ObjectId carries the creation time.)
  const joined = require("./organiserRisk").createdAtOf(organizer);
  if (joined && now - joined < 7 * DAY && !thirdParty)
    add("new-account", "warn", "Organiser account age", "The organiser's account is less than a week old.");

  // 10. Risk score taken at launch.
  const risk = campaign?.riskAssessment;
  if (risk?.level === "high") add("risk", "warn", "Organiser risk at launch", `High (${risk.score}/100): ${(risk.reasons || []).join("; ")}.`);
  else if (risk?.level === "medium") add("risk", "warn", "Organiser risk at launch", `Medium (${risk.score}/100): ${(risk.reasons || []).join("; ")}.`);

  const verdict = checks.some((c) => c.status === "fail") ? "blocked" : checks.some((c) => c.status === "warn") ? "review" : "ready";
  return { verdict, checks };
}

module.exports = { evaluatePayout };
