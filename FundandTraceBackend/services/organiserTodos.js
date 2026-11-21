// What an organiser should do next, most urgent first. Pure function so the
// rules are testable; the endpoint just loads the records.
const { isThirdParty } = require("../utility/fundingType");
const { proofDueDays } = require("./transparency");

const DAY = 864e5;
const fmt = (n) => Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });
const RANK = { urgent: 0, important: 1, suggested: 2 };

function organiserTodos({ user, campaigns = [], fundingRequests = [], now = new Date() }) {
  const todos = [];
  const add = (t) => todos.push(t);
  const kyc = user?.identityVerification?.status || "unverified";
  const hasMoney = campaigns.some((c) => Number(c.funding?.amountRaised) > 0);

  if (kyc !== "verified" && hasMoney) {
    add({
      id: "kyc",
      level: kyc === "requires_input" ? "urgent" : "important",
      title: kyc === "pending" ? "Your identity check is being processed" : "Verify your identity to get paid",
      detail:
        kyc === "pending"
          ? "We'll let you know when it's done. Payouts to you start after that."
          : "Payouts to you need a quick ID check. Payments made directly to a supplier don't.",
      href: "/dashboard/settings/verification",
      action: kyc === "pending" ? null : "Verify now",
    });
  }

  for (const c of campaigns) {
    const id = String(c._id);
    const title = c.basicInformation?.campaignTitle || "Your campaign";
    if (!c.launched) {
      add({ id: `launch-${id}`, level: "suggested", title: `Finish and launch "${title}"`, detail: "Your draft isn't visible to donors yet.", href: "/StartACampaign", action: "Continue" });
      continue;
    }
    if (c.disputeGovernance?.isLocked) {
      add({
        id: `frozen-${id}`,
        level: "urgent",
        title: `Payouts for "${title}" are paused`,
        detail: "Donors reported a problem and our team is reviewing it. Post an update with receipts or evidence: it's the fastest way to resolve it.",
        href: `/campaign/${id}/tracker`,
        action: "See the tracker",
      });
    }
    const hasBank = c.funding?.bankCode || c.funding?.accountNumber;
    const hasConnect = c.stripeConnect?.accountId && c.stripeConnect?.payoutsEnabled;
    if (Number(c.funding?.amountRaised) > 0 && !hasBank && !hasConnect) {
      add({ id: `payout-${id}`, level: "important", title: `Add payout details for "${title}"`, detail: "Add a bank account (or connect Stripe) so approved payouts can reach you.", href: `/dashboard/${id}`, action: "Add details" });
    }
    const lastUpdate = Math.max(0, ...(c.updates || []).map((u) => new Date(u.datePosted || 0).getTime()));
    if (Number(c.funding?.amountRaised) > 0 && now - (lastUpdate || new Date(c.createdAt).getTime()) > 30 * DAY) {
      add({ id: `update-${id}`, level: "suggested", title: `Post an update on "${title}"`, detail: "No update in 30 days. Donors give more when they see progress.", href: `/dashboard/${id}`, action: "Write an update" });
    }
  }

  const due = proofDueDays();
  for (const fr of fundingRequests) {
    const paidAt = fr.disbursement?.dateDisbursed ? new Date(fr.disbursement.dateDisbursed) : null;
    const href = `/dashboard/${fr.campaignId}/fundingRequest`;
    if (fr.status === "Approved" && paidAt && !fr.disbursement?.receipt) {
      const daysLeft = Math.ceil((paidAt.getTime() + due * DAY - now.getTime()) / DAY);
      add({
        id: `receipt-${fr._id}`,
        level: daysLeft < 0 ? "urgent" : daysLeft <= 3 ? "important" : "suggested",
        title: daysLeft < 0 ? `Receipt overdue by ${-daysLeft} day${daysLeft === -1 ? "" : "s"}` : `Upload a receipt within ${daysLeft} day${daysLeft === 1 ? "" : "s"}`,
        detail: `For the payout of ${fmt(fr.amount)} ${fr.currency || ""}${isThirdParty(fr.fundingType) ? " to your supplier" : ""}. Missing receipts lower your Transparency Score and block your next payout.`,
        href,
        action: "Upload receipt",
      });
    }
    if (fr.disbursement?.providerStatus === "failed" || fr.disbursement?.providerStatus === "reversed") {
      add({ id: `failed-${fr._id}`, level: "urgent", title: "A bank transfer to you didn't go through", detail: "The money is back in escrow. Check your bank details, then request it again.", href, action: "Check details" });
    }
    if (fr.status === "Declined" && now - new Date(fr.updatedAt || fr.createdAt) < 14 * DAY) {
      add({ id: `declined-${fr._id}`, level: "important", title: "A funding request was declined", detail: fr.declineReason || "See the reason and send a new request.", href, action: "See why" });
    }
  }

  return todos.sort((a, b) => RANK[a.level] - RANK[b.level]);
}

module.exports = { organiserTodos };
