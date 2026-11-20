// Transparency Score: a 0–100 public trust signal per campaign, built only
// from facts the platform can verify. Every factor is returned with its points
// and a plain-language reason so the score is never a black box.
//
//   Identity verified (KYC) ............ 25
//   Proof uploaded for payouts ......... 25
//   Proof on time ...................... 15
//   Disputes ........................... 15
//   Paid directly to suppliers ......... 10
//   Recent updates to donors ........... 10

const { isThirdParty } = require("../utility/fundingType");

const DAY = 24 * 60 * 60 * 1000;
const proofDueDays = () => Number(process.env.PROOF_DUE_DAYS || 14);

const grade = (score) =>
  score >= 85 ? "Excellent" : score >= 70 ? "Strong" : score >= 50 ? "Fair" : "Needs attention";

/**
 * @param {object} p
 * @param {object} p.campaign          campaign doc (createdAt, updates, disputeGovernance, charityId)
 * @param {object} [p.organizer]       user doc (identityVerification)
 * @param {object[]} p.fundingRequests funding request docs
 * @param {Date} [p.now]
 */
function computeTransparencyScore({ campaign, organizer, fundingRequests = [], now = new Date() }) {
  const factors = [];
  const add = (key, label, points, max, detail) => factors.push({ key, label, points: Math.round(points), max, detail });

  // 1. Identity
  const kyc = organizer?.identityVerification?.status === "verified";
  add("identity", "Organiser identity verified", kyc ? 25 : 0, 25, kyc ? "ID and selfie checked" : "Organiser hasn't completed identity verification");

  // Payouts that actually left escrow (exclude failed bank transfers).
  const disbursed = fundingRequests.filter(
    (fr) => fr.status === "Approved" && fr.disbursement?.dateDisbursed && fr.disbursement?.providerStatus !== "failed"
  );
  const withProof = disbursed.filter((fr) => fr.disbursement?.receipt);
  const due = proofDueDays();
  const overdue = disbursed.filter(
    (fr) => !fr.disbursement?.receipt && now - new Date(fr.disbursement.dateDisbursed) > due * DAY
  );

  // 2. Proof coverage
  if (!disbursed.length) {
    add("proof", "Proof uploaded for payouts", 20, 25, "No payouts yet");
  } else {
    add(
      "proof",
      "Proof uploaded for payouts",
      (25 * withProof.length) / disbursed.length,
      25,
      `${withProof.length} of ${disbursed.length} payouts have receipts`
    );
  }

  // 3. Proof timeliness
  add(
    "timeliness",
    "Proof on time",
    disbursed.length ? 15 * (1 - overdue.length / disbursed.length) : 15,
    15,
    overdue.length ? `${overdue.length} payout(s) without proof after ${due} days` : `No proof overdue (due within ${due} days)`
  );

  // 4. Disputes
  const gov = campaign.disputeGovernance || {};
  const reports = Array.isArray(gov.disputeReports) ? gov.disputeReports.length : Number(gov.disputeCount || 0);
  if (gov.isLocked) add("disputes", "No unresolved disputes", 0, 15, "Frozen while donor concerns are reviewed");
  else if (reports > 0) add("disputes", "No unresolved disputes", 10, 15, `${reports} donor concern(s) on record, campaign not frozen`);
  else add("disputes", "No unresolved disputes", 15, 15, "No donor disputes");

  // 5. Direct-to-supplier share
  const totalOut = disbursed.reduce((sum, fr) => sum + Number(fr.disbursement?.amount || fr.amount || 0), 0);
  const vendorOut = disbursed
    .filter((fr) => isThirdParty(fr.fundingType))
    .reduce((sum, fr) => sum + Number(fr.disbursement?.amount || fr.amount || 0), 0);
  if (!totalOut) {
    add("direct", "Paid directly to suppliers", 5, 10, "No payouts yet");
  } else {
    const pct = Math.round((100 * vendorOut) / totalOut);
    add("direct", "Paid directly to suppliers", (10 * vendorOut) / totalOut, 10, `${pct}% of payouts went straight to suppliers/institutions`);
  }

  // 6. Updates cadence
  const updates = Array.isArray(campaign.updates) ? campaign.updates : [];
  const lastUpdate = updates.reduce((max, u) => Math.max(max, new Date(u.datePosted || 0).getTime()), 0);
  const ageDays = campaign.createdAt ? (now - new Date(campaign.createdAt)) / DAY : 0;
  const sinceUpdate = lastUpdate ? (now - lastUpdate) / DAY : Infinity;
  if (sinceUpdate <= 30 || ageDays <= 30) add("updates", "Recent updates to donors", 10, 10, lastUpdate ? `Last update ${Math.round(sinceUpdate)} day(s) ago` : "New campaign");
  else if (sinceUpdate <= 90) add("updates", "Recent updates to donors", 5, 10, `Last update ${Math.round(sinceUpdate)} days ago`);
  else add("updates", "Recent updates to donors", 0, 10, lastUpdate ? "No update in over 90 days" : "No updates posted");

  const score = Math.max(0, Math.min(100, factors.reduce((sum, f) => sum + f.points, 0)));
  return {
    score,
    grade: grade(score),
    factors,
    proofOverdue: overdue.map((fr) => String(fr._id)),
    computedAt: now.toISOString(),
  };
}

module.exports = { computeTransparencyScore, grade, proofDueDays };
