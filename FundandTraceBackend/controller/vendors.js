// Verified vendor network (FT-038).
const mongoose = require("mongoose");
const { Vendor, VENDOR_CATEGORIES } = require("../models/vendorModel");
const { FundingRequests } = require("../models/fundingRequestModel");
const { encrypt, decrypt } = require("../utility/encryption");
const { getAuthUserId } = require("../utility/auth");
const logger = require("../utility/logger");

const fail = (res, status, error, code) => res.status(status).json({ status, error, ...(code ? { code } : {}) });
const str = (v, max) => String(v ?? "").trim().slice(0, max);
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const safeDecrypt = (v) => {
  try {
    return v ? decrypt(v) : "";
  } catch {
    return "";
  }
};

/** Loose name comparison for bank-account checks ("MEDSERVE NIG LTD" ≈ "Medserve Nigeria Limited"). */
function namesMatch(a, b) {
  const norm = (s) =>
    String(s || "")
      .toUpperCase()
      .replace(/\b(LIMITED|LTD|PLC|NIG|NIGERIA|INC|LLC|CO|COMPANY|THE|AND|&)\b/g, " ")
      .replace(/[^A-Z0-9 ]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 1);
  const x = new Set(norm(a));
  const y = norm(b);
  if (!x.size || !y.length) return false;
  const shared = y.filter((w) => x.has(w)).length;
  return shared / Math.max(x.size, y.length) >= 0.6;
}

const publicView = (v, stats) => ({
  id: String(v._id),
  legalName: v.legalName,
  tradingName: v.tradingName,
  category: v.category,
  country: v.country,
  city: v.city,
  website: v.website,
  description: v.description,
  registrationNumber: v.registrationNumber,
  registryUrl: v.registryUrl,
  verifiedAt: v.verifiedAt,
  bank: { bankName: v.bank?.bankName || "", last4: v.bank?.last4 || "", currency: v.bank?.currency || "" },
  ...(stats ? { stats } : {}),
});

async function payoutStats(vendorIds) {
  const rows = await FundingRequests.aggregate([
    { $match: { "vendorDisbursement.vendorId": { $in: vendorIds }, "disbursement.dateDisbursed": { $ne: null } } },
    { $group: { _id: { v: "$vendorDisbursement.vendorId", c: "$disbursement.currency" }, total: { $sum: "$disbursement.amount" }, count: { $sum: 1 } } },
  ]);
  const out = {};
  for (const r of rows) {
    const k = String(r._id.v);
    out[k] = out[k] || { payouts: 0, totals: {} };
    out[k].payouts += r.count;
    out[k].totals[r._id.c || ""] = Math.round(r.total * 100) / 100;
  }
  return out;
}

// GET /api/vendors?country=NG&category=...&q=...&page=1
exports.listVerified = async (req, res) => {
  try {
    const filter = { status: "verified" };
    if (/^[A-Za-z]{2}$/.test(req.query.country || "")) filter.country = req.query.country.toUpperCase();
    if (VENDOR_CATEGORIES.includes(req.query.category)) filter.category = req.query.category;
    const q = str(req.query.q, 60);
    if (q) filter.$or = [{ legalName: { $regex: esc(q), $options: "i" } }, { tradingName: { $regex: esc(q), $options: "i" } }, { city: { $regex: esc(q), $options: "i" } }];
    const page = Math.max(1, Number(req.query.page) || 1);
    const [vendors, total] = await Promise.all([
      Vendor.find(filter).sort({ legalName: 1 }).skip((page - 1) * 30).limit(30).lean(),
      Vendor.countDocuments(filter),
    ]);
    const stats = await payoutStats(vendors.map((v) => v._id));
    return res.json({ status: 200, data: { vendors: vendors.map((v) => publicView(v, stats[String(v._id)] || { payouts: 0, totals: {} })), total, page, categories: VENDOR_CATEGORIES } });
  } catch (err) {
    logger.error({ err }, "listVerified failed");
    return fail(res, 500, "Server error.");
  }
};

// GET /api/vendors/:id — public profile with the payouts it has received.
exports.getVerified = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return fail(res, 400, "Invalid id");
    const v = await Vendor.findOne({ _id: req.params.id, status: "verified" }).lean();
    if (!v) return fail(res, 404, "Vendor not found");
    const payouts = await FundingRequests.find({ "vendorDisbursement.vendorId": v._id, "disbursement.dateDisbursed": { $ne: null } })
      .select("campaignId disbursement.amount disbursement.currency disbursement.dateDisbursed purposeOfFunding")
      .populate("campaignId", "basicInformation.campaignTitle")
      .sort({ "disbursement.dateDisbursed": -1 })
      .limit(50)
      .lean();
    const stats = (await payoutStats([v._id]))[String(v._id)] || { payouts: 0, totals: {} };
    return res.json({
      status: 200,
      data: {
        ...publicView(v, stats),
        payouts: payouts.map((p) => ({
          campaignId: String(p.campaignId?._id || p.campaignId || ""),
          campaignTitle: p.campaignId?.basicInformation?.campaignTitle || "",
          amount: p.disbursement?.amount,
          currency: p.disbursement?.currency,
          date: p.disbursement?.dateDisbursed,
          purpose: String(p.purposeOfFunding || "").slice(0, 160),
        })),
      },
    });
  } catch (err) {
    logger.error({ err }, "getVerified failed");
    return fail(res, 500, "Server error.");
  }
};

// POST /api/vendors — an organiser or the vendor's own staff proposes a vendor.
exports.apply = async (req, res) => {
  try {
    const b = req.body || {};
    const doc = {
      legalName: str(b.legalName, 140),
      tradingName: str(b.tradingName, 140),
      category: b.category,
      country: str(b.country, 2).toUpperCase(),
      city: str(b.city, 80),
      address: str(b.address, 240),
      registrationNumber: str(b.registrationNumber, 60).toUpperCase(),
      taxId: str(b.taxId, 60),
      website: /^https?:\/\//.test(b.website || "") ? str(b.website, 200) : "",
      contactEmail: str(b.contactEmail, 160).toLowerCase(),
      contactPhone: str(b.contactPhone, 40),
      description: str(b.description, 600),
      submittedBy: getAuthUserId(req.auth),
    };
    if (doc.legalName.length < 2 || !VENDOR_CATEGORIES.includes(doc.category) || !/^[A-Z]{2}$/.test(doc.country) || doc.registrationNumber.length < 2) {
      return fail(res, 400, "Legal name, category, country and registration number are required");
    }
    if (doc.contactEmail && !/^\S+@\S+\.\S+$/.test(doc.contactEmail)) return fail(res, 400, "Invalid contact email");
    const acct = str(b.bank?.accountNumber, 34).replace(/\s+/g, "");
    if (acct) {
      if (!/^[0-9A-Za-z]{6,34}$/.test(acct)) return fail(res, 400, "Invalid account number");
      doc.bank = {
        currency: str(b.bank.currency, 3).toUpperCase(),
        bankName: str(b.bank.bankName, 80),
        bankCode: str(b.bank.bankCode, 20),
        accountNumber: encrypt(acct),
        accountName: encrypt(str(b.bank.accountName, 120)),
        last4: acct.slice(-4),
      };
    }
    const existing = await Vendor.findOne({ country: doc.country, registrationNumber: doc.registrationNumber }).select("status").lean();
    if (existing) {
      return res.status(409).json({ status: 409, code: "vendor_exists", error: existing.status === "verified" ? "This vendor is already verified." : "This vendor has already been submitted.", data: { id: String(existing._id), status: existing.status } });
    }
    const v = await Vendor.create(doc);
    return res.status(201).json({ status: 201, data: { id: String(v._id), status: v.status } });
  } catch (err) {
    if (err?.code === 11000) return fail(res, 409, "This vendor has already been submitted.", "vendor_exists");
    logger.error({ err }, "vendor apply failed");
    return fail(res, 500, "Server error.");
  }
};

// ── Admin ────────────────────────────────────────────────────────────────
exports.adminList = async (req, res) => {
  try {
    const status = ["pending", "verified", "rejected", "suspended"].includes(req.query.status) ? req.query.status : "pending";
    const vendors = await Vendor.find({ status }).sort({ createdAt: 1 }).limit(200).populate("submittedBy", "firstName lastName email").lean();
    return res.json({
      status: 200,
      data: vendors.map((v) => ({
        ...publicView(v),
        status: v.status,
        address: v.address,
        taxId: v.taxId,
        contactEmail: v.contactEmail,
        contactPhone: v.contactPhone,
        submittedBy: v.submittedBy ? { name: `${v.submittedBy.firstName || ""} ${v.submittedBy.lastName || ""}`.trim(), email: v.submittedBy.email } : null,
        createdAt: v.createdAt,
        review: v.review,
        bank: { ...publicView(v).bank, bankCode: v.bank?.bankCode, accountName: safeDecrypt(v.bank?.accountName), resolvedName: v.bank?.resolvedName, verifiedAt: v.bank?.verifiedAt, method: v.bank?.method },
      })),
    });
  } catch (err) {
    logger.error({ err }, "vendor adminList failed");
    return fail(res, 500, "Server error.");
  }
};

// POST /api/admin/vendors/:id/resolve-bank — ask the payout provider whose account it is.
exports.adminResolveBank = async (req, res) => {
  try {
    const v = await Vendor.findById(req.params.id);
    if (!v?.bank?.accountNumber || !v.bank.bankCode) return fail(res, 400, "Vendor has no bank code and account number");
    const { resolveAccount } = require("../services/payoutRails");
    const { accountName } = await resolveAccount({ bankCode: v.bank.bankCode, accountNumber: safeDecrypt(v.bank.accountNumber) });
    v.bank.resolvedName = accountName || "";
    await v.save();
    return res.json({ status: 200, data: { resolvedName: accountName, matchesLegalName: namesMatch(v.legalName, accountName) || namesMatch(v.tradingName, accountName) } });
  } catch (err) {
    logger.warn({ err: err?.response?.data || err?.message }, "vendor bank resolve failed");
    return fail(res, err?.status === 503 ? 503 : 502, err?.status === 503 ? "No payout provider is configured to look up the account." : "The provider couldn't find that account.");
  }
};

// POST /api/admin/vendors/:id/review {decision, notes, checks, bankConfirmedManually}
exports.adminReview = async (req, res) => {
  try {
    const b = req.body || {};
    const decision = b.decision;
    if (!["verify", "reject", "suspend"].includes(decision)) return fail(res, 400, "decision must be verify, reject or suspend");
    const v = await Vendor.findById(req.params.id);
    if (!v) return fail(res, 404, "Vendor not found");
    const notes = str(b.notes, 1000);
    if (decision !== "verify" && notes.length < 5) return fail(res, 400, "Give a reason");

    const checks = { registryChecked: b.checks?.registryChecked === true, bankNameMatches: b.checks?.bankNameMatches === true, contactConfirmed: b.checks?.contactConfirmed === true };
    if (decision === "verify") {
      if (!checks.registryChecked || !checks.bankNameMatches || !checks.contactConfirmed) return fail(res, 400, "All three checks must be done before verifying", "checks_incomplete");
      if (!v.bank?.accountNumber) return fail(res, 400, "A verified vendor needs a bank account", "no_bank");
      // The bank account must be confirmed: by the provider's name lookup, or
      // manually (e.g. a UK account checked against a bank letter) with a note.
      const providerOk = v.bank.resolvedName && (namesMatch(v.legalName, v.bank.resolvedName) || namesMatch(v.tradingName, v.bank.resolvedName));
      if (!providerOk && !(b.bankConfirmedManually === true && notes.length >= 10)) {
        return fail(res, 400, "Confirm the bank account name with the provider lookup, or tick 'confirmed manually' and say how", "bank_unconfirmed");
      }
      if (!v.registryUrl && !str(b.registryUrl, 300)) return fail(res, 400, "Link the public registry entry you checked", "no_registry");
      if (b.registryUrl) v.registryUrl = str(b.registryUrl, 300);
      v.bank.method = providerOk ? "provider-resolve" : "manual";
      v.bank.verifiedAt = new Date();
      v.verifiedAt = new Date();
      v.status = "verified";
    } else {
      v.status = decision === "reject" ? "rejected" : "suspended";
    }
    v.review = { checks, notes, adminId: req.admin?._id, adminName: `${req.admin?.firstName || ""} ${req.admin?.lastName || ""}`.trim(), decidedAt: new Date() };
    await v.save();
    logger.info({ vendorId: String(v._id), decision, admin: String(req.admin?._id) }, "Vendor reviewed");
    return res.json({ status: 200, data: { id: String(v._id), status: v.status } });
  } catch (err) {
    logger.error({ err }, "vendor review failed");
    return fail(res, 500, "Server error.");
  }
};

/** Payout destination for a vendor-backed funding request, or an error message. */
async function vendorPayoutDestination(vendorId) {
  const v = await Vendor.findById(vendorId).lean();
  if (!v || v.status !== "verified" || !v.bank?.verifiedAt) return { error: "The vendor for this request isn't verified (or was suspended), so it can't be paid." };
  return {
    vendor: v,
    bankCode: v.bank.bankCode,
    bankName: v.bank.bankName,
    accountNumber: safeDecrypt(v.bank.accountNumber),
    accountName: safeDecrypt(v.bank.accountName) || v.legalName,
    currency: v.bank.currency,
  };
}

module.exports.vendorPayoutDestination = vendorPayoutDestination;
module.exports._internals = { namesMatch };
