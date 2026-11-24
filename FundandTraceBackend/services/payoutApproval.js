// Two-person rule for large payouts (gap 3).
//
// Above a per-currency threshold a payout needs two DIFFERENT admins: the
// first approval is recorded but moves no money; the second, within
// SECOND_APPROVAL_TTL_HOURS, releases it. One compromised or mistaken admin
// account can then no longer release a large sum on its own.
//
// Configure either (JSON wins per currency):
//   PAYOUT_SECOND_APPROVAL_JSON={"NGN":1000000,"GHS":10000,"KES":100000,"GBP":1000,"USD":1000}
//   PAYOUT_SECOND_APPROVAL_OVER=1000   (applies to every currency without a JSON entry)
const TTL_HOURS = () => Number(process.env.SECOND_APPROVAL_TTL_HOURS || 72);

function thresholdFor(currency) {
  const cur = String(currency || "").toUpperCase();
  try {
    const map = JSON.parse(process.env.PAYOUT_SECOND_APPROVAL_JSON || "{}");
    if (map && Number(map[cur]) > 0) return Number(map[cur]);
  } catch {
    /* ignore malformed JSON: preflight reports it */
  }
  const flat = Number(process.env.PAYOUT_SECOND_APPROVAL_OVER || 0);
  return flat > 0 ? flat : Infinity;
}

const needsSecondApproval = (amount, currency) => Number(amount) > thresholdFor(currency);

/** Is a recorded first approval still valid, and by someone other than `adminId`? */
function firstApprovalState(fr, adminId, now = Date.now()) {
  const first = fr?.firstApproval;
  if (!first?.adminId || !first.at) return "none";
  if (now - new Date(first.at).getTime() > TTL_HOURS() * 36e5) return "expired";
  return String(first.adminId) === String(adminId) ? "same_admin" : "other_admin";
}

module.exports = { thresholdFor, needsSecondApproval, firstApprovalState, TTL_HOURS };
