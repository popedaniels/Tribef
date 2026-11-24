// Payout bank-account changes: the classic account-takeover cash-out is to
// change the payout account and request a payout straight away. So after an
// organiser changes an existing account, bank payouts wait
// BANK_CHANGE_COOLDOWN_HOURS (default 48) and the organiser is emailed at the
// address on file, giving the real owner time to raise the alarm.
const logger = require("../utility/logger");

const cooldownHours = () => {
  const h = Number(process.env.BANK_CHANGE_COOLDOWN_HOURS ?? 48);
  return Number.isFinite(h) && h >= 0 ? h : 48;
};

/** Milliseconds until bank payouts may resume (0 = clear). */
function cooldownRemainingMs(campaign, now = new Date()) {
  const at = campaign?.funding?.bankChangedAt;
  if (!at) return 0;
  const until = new Date(at).getTime() + cooldownHours() * 3600e3;
  return Math.max(0, until - now.getTime());
}

async function notifyBankChange(campaignId) {
  try {
    const { Campaign } = require("../models/campaignModel");
    const { Users } = require("../models/users");
    const campaign = await Campaign.findById(campaignId).select("organizerId basicInformation.campaignTitle").lean();
    const user = campaign?.organizerId ? await Users.findById(campaign.organizerId).select("email firstName").lean() : null;
    if (!user?.email) return;
    const { createTransporter } = require("./mailing");
    const t = await createTransporter();
    const title = campaign.basicInformation?.campaignTitle || "your campaign";
    const support = process.env.SUPPORT_EMAIL || "support@fundandtrace.com";
    await t.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL,
      to: user.email,
      subject: `The payout bank account for "${title}" was changed`,
      text: `Hi ${user.firstName || "there"},

The bank account that payouts for "${title}" go to was just changed.

If this was you, there's nothing to do. For your protection, bank payouts are paused for ${cooldownHours()} hours after a change.

If this wasn't you, reply to this email or contact ${support} straight away and change your password. We'll hold all payouts while we check.

Fund&Trace`,
    });
  } catch (err) {
    logger.warn({ err: err?.message, campaignId: String(campaignId) }, "Bank change notification failed");
  }
}

module.exports = { cooldownHours, cooldownRemainingMs, notifyBankChange };
