// Business metrics for the admin dashboard (FT-030 / FT-040).
//
// Margin per donation = what Fund&Trace keeps − what the processor charges:
//   revenue = tip + processing fee the donor paid
//   cost    = estimated processor fee on the whole charge (services/fees)
// With fees passed on at cost (Paystack/Flutterwave) the fee nets to ~0 and
// margin ≈ tip; on UK/EU cards where the donor didn't cover the fee, the
// platform absorbs it and margin can be negative.
const { Donations } = require("../models/donationsModel");
const { Campaign } = require("../models/campaignModel");
const { FundingRequests } = require("../models/fundingRequestModel");
const fees = require("./fees");

const round2 = (n) => Math.round(Number(n || 0) * 100) / 100;
const NOT_REFUNDED = { $or: [{ "refund.status": { $in: ["", null, "failed"] } }, { "refund.status": { $exists: false } }] };

const railOf = (d) => {
  const m = String(d.paymentMethod || "").toLowerCase();
  if (m.includes("paystack")) return "paystack";
  if (m.includes("flutter")) return "flutterwave";
  if (m.includes("stripe")) return "stripe";
  return m || "unknown";
};
const methodOf = (d, rail, currency) => (rail === "paystack" && currency === "KES" && /mobile/i.test(d.paymentOption || "") ? "mpesa" : "");

/** Pure: summarise donation rows (exported for tests). */
function summariseDonations(rows, currencyOf) {
  const groups = {};
  const donors = new Set();
  const daily = {};
  for (const d of rows) {
    const currency = String(currencyOf(d) || "").toUpperCase() || "?";
    const rail = railOf(d);
    const key = `${rail}|${currency}`;
    const g = (groups[key] ||= { rail, currency, donations: 0, donated: 0, tips: 0, feesCollected: 0, processorCost: 0, withTip: 0, coveredFee: 0, matched: 0, giftAid: 0 });
    const amount = Number(d.amount || 0);
    const tip = Number(d.tip || 0);
    const fee = Number(d.processingFee || 0);
    const total = amount + tip + fee;
    g.donations += 1;
    g.donated += amount;
    g.tips += tip;
    g.feesCollected += fee;
    g.processorCost += fees.processorCost({ rail, currency, total, method: methodOf(d, rail, currency) });
    if (tip > 0) g.withTip += 1;
    if (fee > 0) g.coveredFee += 1;
    g.matched += Number(d.matchedAmount || 0);
    if (d.giftAid?.declared) g.giftAid += 1;
    if (d.donorEmail) donors.add(String(d.donorEmail).toLowerCase());
    const day = new Date(d.createdAt).toISOString().slice(0, 10);
    daily[day] = (daily[day] || 0) + 1;
  }
  const byRail = Object.values(groups)
    .map((g) => {
      const revenue = g.tips + g.feesCollected;
      const margin = revenue - g.processorCost;
      return {
        ...g,
        donated: round2(g.donated),
        tips: round2(g.tips),
        feesCollected: round2(g.feesCollected),
        processorCost: round2(g.processorCost),
        matched: round2(g.matched),
        revenue: round2(revenue),
        margin: round2(margin),
        marginPerDonation: round2(g.donations ? margin / g.donations : 0),
        avgDonation: round2(g.donations ? g.donated / g.donations : 0),
        tipRate: g.donations ? Math.round((1000 * g.withTip) / g.donations) / 10 : 0,
        coverFeeRate: g.donations ? Math.round((1000 * g.coveredFee) / g.donations) / 10 : 0,
        takeRate: g.donated ? Math.round((10000 * margin) / g.donated) / 100 : 0,
      };
    })
    .sort((a, b) => b.donations - a.donations);
  return {
    donations: rows.length,
    uniqueDonors: donors.size,
    byRail,
    daily: Object.entries(daily)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count })),
  };
}

async function computeMetrics({ from, to }) {
  const range = { $gte: from, $lt: to };
  const rows = await Donations.find({ createdAt: range, ...NOT_REFUNDED })
    .select("campaignId amount tip processingFee paymentMethod paymentOption donorEmail createdAt matchedAmount giftAid.declared")
    .limit(200000)
    .lean();
  const campaignIds = [...new Set(rows.map((d) => String(d.campaignId)))];
  const camps = await Campaign.find({ _id: { $in: campaignIds } }).select("funding.currency").lean();
  const curById = Object.fromEntries(camps.map((c) => [String(c._id), c.funding?.currency]));
  const donations = summariseDonations(rows, (d) => curById[String(d.campaignId)]);

  const [launched, goalReached, refunds, payouts, frozen] = await Promise.all([
    Campaign.countDocuments({ launched: true, createdAt: range }),
    Campaign.countDocuments({ targetReachedNotifiedAt: range }),
    Donations.aggregate([{ $match: { "refund.status": "succeeded", "refund.createdAt": range } }, { $group: { _id: null, n: { $sum: 1 }, amount: { $sum: "$refund.amount" } } }]),
    FundingRequests.aggregate([
      { $match: { "disbursement.dateDisbursed": range } },
      { $group: { _id: "$disbursement.currency", n: { $sum: 1 }, amount: { $sum: "$disbursement.amount" }, vendor: { $sum: { $cond: [{ $ifNull: ["$vendorDisbursement.vendorId", false] }, 1, 0] } } } },
    ]),
    Campaign.countDocuments({ "disputeGovernance.isLocked": true }),
  ]);

  return {
    range: { from, to },
    donations,
    campaigns: { launched, goalReached, frozenNow: frozen, withDonations: campaignIds.length },
    refunds: { count: refunds[0]?.n || 0, amountMixedCurrency: round2(refunds[0]?.amount || 0) },
    payouts: payouts.map((p) => ({ currency: p._id, count: p.n, amount: round2(p.amount), toVerifiedVendors: p.vendor })),
    notes: [
      "Processor cost is estimated from published rates; Stripe is costed at the UK domestic rate, so foreign-card costs are understated.",
      "Refunded donations are excluded. Amounts are per currency and never added across currencies.",
    ],
  };
}

module.exports = { computeMetrics, summariseDonations };
