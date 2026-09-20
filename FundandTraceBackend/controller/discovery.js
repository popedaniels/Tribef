// Campaign search & discovery.
// GET /api/discovery/search?q=...        — weighted full-text search
// GET /api/discovery/trending?limit=10   — momentum-ranked campaigns
// GET /api/discovery/similar/:id         — same-category campaigns
// GET /api/discovery/referrals/:id       — referral attribution stats
const mongoose = require("mongoose");
const { Campaign } = require("../models/campaignModel");
const { Donations } = require("../models/donationsModel");
const logger = require("../utility/logger");

const PUBLIC_PROJECTION = {
  basicInformation: 1,
  category: 1,
  campaignType: 1,
  funding: 1,
  createdAt: 1,
};

const LAUNCHED_FILTER = { launched: true, suspended: false };

exports.search = async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) {
      return res.status(400).json({ status: 400, error: "Query parameter q is required" });
    }
    const limit = Math.min(Number(req.query.limit || 20), 50);

    const results = await Campaign.find(
      { ...LAUNCHED_FILTER, $text: { $search: q } },
      { score: { $meta: "textScore" }, ...PUBLIC_PROJECTION }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(limit)
      .maxTimeMS(3000);

    return res.status(200).json({ data: results });
  } catch (error) {
    logger.error({ err: error }, "Campaign search failed");
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

// Trending = donation velocity over the trailing window, not lifetime totals,
// so long-running giants don't permanently dominate the shelf.
exports.trending = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 10), 50);
    const windowDays = Number(process.env.TRENDING_WINDOW_DAYS || 7);
    const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

    const velocity = await Donations.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: "$campaignId",
          recentAmount: { $sum: "$amount" },
          recentCount: { $sum: 1 },
        },
      },
      { $sort: { recentAmount: -1, recentCount: -1 } },
      { $limit: limit * 2 }, // headroom for launched/suspended filtering
    ]).option({ maxTimeMS: 3000 });

    const ids = velocity.map((v) => v._id).filter(Boolean);
    if (ids.length === 0) return res.status(200).json({ data: [] });

    const campaigns = await Campaign.find({
      _id: { $in: ids },
      ...LAUNCHED_FILTER,
    }).select(PUBLIC_PROJECTION);

    // Preserve velocity order; cap at requested limit.
    const byId = new Map(campaigns.map((c) => [String(c._id), c]));
    const ranked = velocity
      .map((v) => byId.get(String(v._id)))
      .filter(Boolean)
      .slice(0, limit)
      .map((c, i) => ({
        campaign: c,
        trend: velocity.find((v) => String(v._id) === String(c._id)),
        rank: i + 1,
      }));

    return res.status(200).json({ data: ranked });
  } catch (error) {
    logger.error({ err: error }, "Trending failed");
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

exports.similar = async (req, res) => {
  try {
    const source = await Campaign.findById(req.params.id).select("category");
    if (!source) return res.status(404).json({ status: 404, error: "Campaign not found" });

    const similar = await Campaign.find({
      _id: { $ne: source._id },
      category: source.category,
      ...LAUNCHED_FILTER,
    })
      .select(PUBLIC_PROJECTION)
      .limit(Math.min(Number(req.query.limit || 6), 20));

    return res.status(200).json({ data: similar });
  } catch (error) {
    logger.error({ err: error }, "Similar campaigns failed");
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

// Referral performance for a campaign (owner or admin).
// GET /api/discovery/referrals/:id
exports.referralStats = async (req, res) => {
  try {
    const authUserId = req.auth && (req.auth.id || req.auth.profile?._id);
    // requireAuth tokens carry role for admins ({profile}) but plain users
    // only carry {email, id} — resolve admin status from the token itself.
    const isAdmin =
      req.auth &&
      ((req.auth.profile && req.auth.profile.role === "admin") ||
        req.auth.role === "admin");

    if (!isAdmin) {
      if (!authUserId) return res.status(401).json({ status: 401, error: "Unauthorized" });
      const owned = await Campaign.findOne({
        _id: req.params.id,
        organizerId: String(authUserId),
      }).select("_id");
      if (!owned) return res.status(403).json({ status: 403, error: "Campaign ownership required" });
    }

    // Top codes by attributed volume; unattributed donations excluded.
    const stats = await Donations.aggregate([
      {
        $match: {
          campaignId: new mongoose.Types.ObjectId(String(req.params.id)),
          referralCode: { $exists: true, $nin: ["", null] },
        },
      },
      {
        $group: {
          _id: "$referralCode",
          totalAmount: { $sum: "$amount" },
          donationCount: { $sum: 1 },
        },
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 50 },
    ]).option({ maxTimeMS: 3000 });

    return res.status(200).json({ data: stats });
  } catch (error) {
    logger.error({ err: error }, "Referral stats failed");
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};
