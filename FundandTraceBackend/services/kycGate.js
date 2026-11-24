// Identity requirements for organisers.
//
// REQUIRE_KYC_TO_LAUNCH:
//   "submitted" (default) — launch once a live ID check has been submitted
//                           (in-app capture or Stripe Identity), even if the
//                           review is still pending. Payouts need "verified".
//   "verified" | "true"   — launch only after the check has passed.
//   "off" | "false"       — no identity needed to launch.

function launchGate(value = process.env.REQUIRE_KYC_TO_LAUNCH) {
  const v = String(value || "").trim().toLowerCase();
  if (v === "off" || v === "false") return "off";
  if (v === "verified" || v === "true") return "verified";
  return "submitted";
}

function canLaunch(identity, gate = launchGate()) {
  const status = identity?.status || "unverified";
  if (gate === "off" || status === "verified") return { allowed: true };
  if (gate === "submitted" && status === "pending" && identity?.submittedAt) return { allowed: true };
  if (status === "requires_input") {
    return { allowed: false, message: `Your identity check needs another try${identity?.rejectionReason ? `: ${identity.rejectionReason}` : "."}` };
  }
  if (gate === "verified" && status === "pending") {
    return { allowed: false, message: "Your identity check is being reviewed. You can launch as soon as it passes." };
  }
  return { allowed: false, message: "Verify your identity before launching a campaign. It takes about two minutes with your phone camera." };
}

module.exports = { launchGate, canLaunch };
