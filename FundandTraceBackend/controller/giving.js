// Teams, matched giving, Gift Aid and donor statements (FT-042, FT-039, FT-016).
const mongoose = require("mongoose");
const PDFDocument = require("pdfkit");
const { Campaign } = require("../models/campaignModel");
const { Donations } = require("../models/donationsModel");
const { Charity } = require("../models/charity");
const { getAuthUserId } = require("../utility/auth");
const extras = require("../services/donationExtras");
const logger = require("../utility/logger");

const NOT_REFUNDED = { $or: [{ "refund.status": { $in: ["", null, "failed"] } }, { "refund.status": { $exists: false } }] };
const round2 = (n) => Math.round(Number(n) * 100) / 100;
const isId = (id) => mongoose.isValidObjectId(id);
const fail = (res, status, error, code) => res.status(status).json({ status, error, ...(code ? { code } : {}) });
const handle = (name) => (err, res) => {
  logger.error({ err }, `${name} failed`);
  return fail(res, 500, "Server error.");
};

// ── Public: what a donor can opt into on this campaign ───────────────────
exports.campaignGiving = async (req, res) => {
  try {
    if (!isId(req.params.id)) return fail(res, 400, "Invalid campaign id");
    const campaign = await Campaign.findById(req.params.id).select("teams matching charityId funding.currency").lean();
    if (!campaign) return fail(res, 404, "Campaign not found");

    const charity = await extras.giftAidCharity(campaign);
    const totals = await Donations.aggregate([
      { $match: { campaignId: new mongoose.Types.ObjectId(req.params.id), teamId: { $nin: ["", null] }, ...NOT_REFUNDED } },
      { $group: { _id: "$teamId", raised: { $sum: "$amount" }, donations: { $sum: 1 } } },
    ]);
    const byTeam = Object.fromEntries(totals.map((t) => [t._id, t]));
    const teams = (campaign.teams || [])
      .map((t) => ({
        id: String(t._id),
        name: t.name,
        slug: t.slug,
        captainName: t.captainName,
        goal: t.goal || 0,
        raised: round2(byTeam[String(t._id)]?.raised || 0),
        donations: byTeam[String(t._id)]?.donations || 0,
      }))
      .sort((a, b) => b.raised - a.raised);

    const m = campaign.matching || {};
    const matchingLive = Boolean(m.active && m.cap > 0 && (!m.endsAt || new Date(m.endsAt) > new Date()));
    return res.json({
      status: 200,
      data: {
        giftAid: charity
          ? { available: true, charityName: charity.charityName, wording: extras.giftAidWording(charity.charityName) }
          : { available: false },
        teams,
        matching: m.sponsorName
          ? {
              live: matchingLive && m.pledged < m.cap,
              sponsorName: m.sponsorName,
              ratio: m.ratio,
              cap: m.cap,
              pledged: round2(m.pledged || 0),
              received: round2(m.received || 0),
              remaining: round2(Math.max(0, m.cap - (m.pledged || 0))),
              endsAt: m.endsAt,
            }
          : null,
      },
    });
  } catch (err) {
    return handle("campaignGiving")(err, res);
  }
};

// ── Organiser: teams ──────────────────────────────────────────────────────
exports.createTeam = async (req, res) => {
  try {
    const name = String(req.body?.name || "").replace(/\s+/g, " ").trim().slice(0, 60);
    if (name.length < 2) return fail(res, 400, "Team name is required");
    const campaign = await Campaign.findById(req.params.id).select("teams");
    if (!campaign) return fail(res, 404, "Campaign not found");
    if ((campaign.teams || []).length >= 200) return fail(res, 400, "A campaign can have up to 200 teams");
    let slug = extras.slugify(name);
    if (campaign.teams.some((t) => t.slug === slug)) slug = `${slug}-${campaign.teams.length + 1}`;
    campaign.teams.push({
      name,
      slug,
      captainName: String(req.body?.captainName || "").trim().slice(0, 60),
      goal: Math.max(0, Number(req.body?.goal) || 0),
    });
    await campaign.save();
    const team = campaign.teams[campaign.teams.length - 1];
    return res.status(201).json({ status: 201, data: { id: String(team._id), name: team.name, slug: team.slug } });
  } catch (err) {
    return handle("createTeam")(err, res);
  }
};

exports.deleteTeam = async (req, res) => {
  try {
    // Teams with donations stay (their donations reference them); only empty ones can go.
    const used = await Donations.countDocuments({ campaignId: req.params.id, teamId: req.params.teamId });
    if (used) return fail(res, 409, "This team already has donations, so it can't be deleted.", "team_in_use");
    const r = await Campaign.updateOne({ _id: req.params.id }, { $pull: { teams: { _id: req.params.teamId } } });
    if (!r.modifiedCount) return fail(res, 404, "Team not found");
    return res.json({ status: 200 });
  } catch (err) {
    return handle("deleteTeam")(err, res);
  }
};

// ── Admin: matched giving (admins verify the sponsor before it goes public) ─
exports.setMatching = async (req, res) => {
  try {
    const b = req.body || {};
    const sponsorName = String(b.sponsorName || "").trim().slice(0, 80);
    const cap = Number(b.cap);
    const ratio = Number(b.ratio || 1);
    if (!sponsorName || !(cap > 0) || !(ratio >= 0.1 && ratio <= 5)) return fail(res, 400, "sponsorName, cap > 0 and ratio 0.1–5 are required");
    const campaign = await Campaign.findById(req.params.id).select("matching");
    if (!campaign) return fail(res, 404, "Campaign not found");
    if (cap < (campaign.matching?.pledged || 0)) return fail(res, 400, "The cap can't be lower than what's already pledged");
    campaign.matching = {
      ...(campaign.matching?.toObject?.() || {}),
      active: b.active !== false,
      sponsorName,
      ratio,
      cap,
      endsAt: b.endsAt ? new Date(b.endsAt) : null,
    };
    await campaign.save();
    logger.info({ campaignId: req.params.id, admin: String(req.admin?._id), sponsorName, cap, ratio }, "Matching set");
    return res.json({ status: 200, data: campaign.matching });
  } catch (err) {
    return handle("setMatching")(err, res);
  }
};

// Sponsor paid (part of) their pledge: credit the campaign through the ledger.
exports.recordMatchPayment = async (req, res) => {
  try {
    const amount = round2(req.body?.amount);
    const reference = String(req.body?.reference || "").trim().slice(0, 80);
    if (!(amount > 0) || !reference) return fail(res, 400, "amount and the sponsor's payment reference are required");
    const campaign = await Campaign.findById(req.params.id).select("matching funding.currency").lean();
    if (!campaign?.matching?.sponsorName) return fail(res, 404, "No matching on this campaign");
    if (round2((campaign.matching.received || 0) + amount) > round2(campaign.matching.pledged || 0)) {
      return fail(res, 400, "That's more than the sponsor has pledged so far");
    }
    const { creditCampaign } = require("./donations/shared");
    const refId = `match-payment:${reference}`;
    const { LedgerEntry } = require("../models/ledgerEntryModel");
    if (await LedgerEntry.exists({ campaignId: campaign._id, refId })) return fail(res, 409, "That payment reference is already recorded");
    await creditCampaign(campaign._id, amount, { refId, currency: campaign.funding?.currency, memo: `Matching gift from ${campaign.matching.sponsorName}` });
    await Campaign.updateOne({ _id: campaign._id }, { $inc: { "matching.received": amount } });
    return res.json({ status: 200 });
  } catch (err) {
    return handle("recordMatchPayment")(err, res);
  }
};

// ── Admin: enable Gift Aid for a registered charity ──────────────────────
exports.setCharityGiftAid = async (req, res) => {
  try {
    const ref = String(req.body?.hmrcReference || "").trim().toUpperCase();
    const enabled = req.body?.giftAidEnabled === true;
    // HMRC charities reference: 1–2 letters then up to 5 digits (e.g. XR12345, AB123).
    if (enabled && !/^[A-Z]{1,2}\d{1,5}$/.test(ref)) return fail(res, 400, "Enter the charity's HMRC reference (e.g. XR12345)");
    const r = await Charity.updateOne({ _id: req.params.id }, { $set: { hmrcReference: ref, giftAidEnabled: enabled } });
    if (!r.matchedCount) return fail(res, 404, "Charity not found");
    logger.info({ charityId: req.params.id, enabled, admin: String(req.admin?._id) }, "Gift Aid setting changed");
    return res.json({ status: 200 });
  } catch (err) {
    return handle("setCharityGiftAid")(err, res);
  }
};

// ── Gift Aid claim export, in HMRC's schedule column order ───────────────
// Columns: Title, First name, Last name, House name or number, Postcode,
// Aggregated donations, Sponsored event, Donation date (DD/MM/YY), Amount.
// Admins or the charity's own account. ?markClaimed=true stamps claimedAt so
// the next export doesn't repeat them.
const csvCell = (v) => {
  const s = String(v ?? "");
  // Neutralise spreadsheet formulas (CSV injection) and quote.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};
const ddmmyy = (d) => {
  const x = new Date(d);
  return `${String(x.getUTCDate()).padStart(2, "0")}/${String(x.getUTCMonth() + 1).padStart(2, "0")}/${String(x.getUTCFullYear()).slice(-2)}`;
};

exports.giftAidExport = async (req, res) => {
  try {
    const charityId = req.query.charityId;
    if (!isId(charityId)) return fail(res, 400, "charityId is required");
    const charity = await Charity.findById(charityId).lean();
    if (!charity) return fail(res, 404, "Charity not found");
    const isAdmin = req.admin || (await isAdminUser(req));
    if (!isAdmin && String(charity.userId) !== String(getAuthUserId(req.auth))) return fail(res, 403, "Not your charity");

    const from = req.query.from ? new Date(req.query.from) : new Date(0);
    const to = req.query.to ? new Date(req.query.to) : new Date();
    const campaignIds = (await Campaign.find({ charityId }).select("_id").lean()).map((c) => c._id);
    const filter = {
      campaignId: { $in: campaignIds },
      "giftAid.declared": true,
      "giftAid.claimedAt": null,
      createdAt: { $gte: from, $lte: to },
      ...NOT_REFUNDED,
    };
    const rows = await Donations.find(filter).sort({ createdAt: 1 }).limit(1000).lean();
    const header = ["Title", "First name or initial", "Last name", "House name or number", "Postcode", "Aggregated donations", "Sponsored event", "Donation date", "Amount"];
    const lines = [header.map(csvCell).join(",")];
    for (const d of rows) {
      const g = d.giftAid || {};
      // Only the donation itself qualifies: never the tip or the card fee.
      lines.push([g.title, g.firstName, g.lastName, g.houseNameOrNumber, g.postcode, "", "", ddmmyy(d.createdAt), round2(d.amount).toFixed(2)].map(csvCell).join(","));
    }
    if (req.query.markClaimed === "true" && rows.length) {
      await Donations.updateMany({ _id: { $in: rows.map((r) => r._id) } }, { $set: { "giftAid.claimedAt": new Date() } });
    }
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="gift-aid-${charity.hmrcReference || charityId}-${ddmmyy(new Date()).replace(/\//g, "")}.csv"`);
    res.setHeader("X-Rows", String(rows.length));
    res.setHeader("X-More", String(rows.length === 1000)); // HMRC schedules hold 1,000 lines
    return res.send(lines.join("\r\n") + "\r\n");
  } catch (err) {
    return handle("giftAidExport")(err, res);
  }
};

async function isAdminUser(req) {
  const { Users } = require("../models/users");
  const u = await Users.findById(getAuthUserId(req.auth)).select("role").lean();
  return u?.role === "admin";
}

// ── Donor annual statement (PDF) ──────────────────────────────────────────
// ?basis=uk uses the UK tax year (6 April – 5 April); default is calendar year.
exports.donorStatement = async (req, res) => {
  try {
    const year = Number(req.params.year);
    if (!Number.isInteger(year) || year < 2015 || year > new Date().getUTCFullYear() + 1) return fail(res, 400, "Invalid year");
    const email = String(req.auth?.email || req.auth?.profile?.email || "").toLowerCase();
    if (!email) return fail(res, 401, "Unauthorized");
    const uk = req.query.basis === "uk";
    const from = uk ? new Date(Date.UTC(year, 3, 6)) : new Date(Date.UTC(year, 0, 1));
    const to = uk ? new Date(Date.UTC(year + 1, 3, 6)) : new Date(Date.UTC(year + 1, 0, 1));

    const donations = await Donations.find({
      donorEmail: { $regex: `^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
      createdAt: { $gte: from, $lt: to },
      ...NOT_REFUNDED,
    })
      .sort({ createdAt: 1 })
      .lean();
    const campaigns = await Campaign.find({ _id: { $in: donations.map((d) => d.campaignId) } })
      .select("basicInformation.campaignTitle funding.currency charityId")
      .lean();
    const byId = Object.fromEntries(campaigns.map((c) => [String(c._id), c]));

    const pdf = await buildStatementPdf({ email, year, uk, from, to, donations, byId });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="fundandtrace-statement-${uk ? `${year}-${String(year + 1).slice(-2)}` : year}.pdf"`);
    return res.send(pdf);
  } catch (err) {
    return handle("donorStatement")(err, res);
  }
};

function buildStatementPdf({ email, year, uk, from, to, donations, byId }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    const fmt = (n, c) => `${c} ${Number(n).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const day = (d) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

    doc.fontSize(18).text("Fund&Trace donation statement");
    doc.moveDown(0.3).fontSize(10).fillColor("#555")
      .text(`${uk ? `UK tax year ${year}–${String(year + 1).slice(-2)}` : `Calendar year ${year}`}  ·  ${day(from)} to ${day(new Date(to - 1))}`)
      .text(`Donor: ${email}`)
      .text(`Generated ${day(new Date())}`);
    doc.moveDown().fillColor("#000");

    if (!donations.length) {
      doc.fontSize(12).text("No donations in this period.");
      doc.end();
      return;
    }
    const cols = [50, 130, 330, 420, 490];
    doc.fontSize(9).font("Helvetica-Bold");
    const hy = doc.y;
    const widths = [75, 190, 85, 65, 50];
    ["Date", "Campaign", "Donation", "Tip / fee", "Gift Aid"].forEach((h, i) => doc.text(h, cols[i], hy, { width: widths[i] }));
    doc.moveDown(0.6).font("Helvetica");
    const totals = {};
    for (const d of donations) {
      const c = byId[String(d.campaignId)];
      const cur = String(c?.funding?.currency || "").toUpperCase();
      totals[cur] = totals[cur] || { donated: 0, extra: 0, giftAid: 0 };
      totals[cur].donated += Number(d.amount || 0);
      totals[cur].extra += Number(d.tip || 0) + Number(d.processingFee || 0);
      if (d.giftAid?.declared) totals[cur].giftAid += Number(d.amount || 0);
      if (doc.y > 760) doc.addPage();
      const y = doc.y;
      doc.text(day(d.createdAt), cols[0], y, { width: 75 });
      doc.text(String(c?.basicInformation?.campaignTitle || "Campaign").slice(0, 60), cols[1], y, { width: 190 });
      doc.text(fmt(d.amount, cur), cols[2], y, { width: 85 });
      doc.text(fmt(Number(d.tip || 0) + Number(d.processingFee || 0), cur), cols[3], y, { width: 65 });
      doc.text(d.giftAid?.declared ? "Yes" : "–", cols[4], y, { width: 50 });
      doc.moveDown(0.4);
    }
    doc.moveDown().font("Helvetica-Bold").fontSize(11).text("Totals", 50);
    doc.font("Helvetica").fontSize(10);
    for (const [cur, t] of Object.entries(totals)) {
      doc.text(`${cur}: donated ${fmt(t.donated, cur)}; tips and card fees ${fmt(t.extra, cur)}${t.giftAid ? `; Gift Aid declared on ${fmt(t.giftAid, cur)}` : ""}`);
    }
    doc.moveDown().fontSize(8).fillColor("#555").text(
      "Tips and card fees are payments to Fund&Trace and the payment processor, not donations to the campaign, and are not eligible for Gift Aid or tax relief. " +
        "Refunded donations are excluded. Whether a donation qualifies for tax relief depends on where you pay tax and on the recipient's status; this statement is a record of payments, not tax advice."
    );
    doc.end();
  });
}

// Exposed for tests.
exports._internals = { csvCell, ddmmyy };

// ── Admin: business metrics (FT-030/040) ──────────────────────────────────
exports.adminMetrics = async (req, res) => {
  try {
    const to = req.query.to ? new Date(req.query.to) : new Date();
    const from = req.query.from ? new Date(req.query.from) : new Date(to.getTime() - 30 * 864e5);
    if (Number.isNaN(+from) || Number.isNaN(+to) || to <= from || to - from > 400 * 864e5) return fail(res, 400, "Use a valid range of up to 400 days");
    const data = await require("../services/metrics").computeMetrics({ from, to });
    return res.json({ status: 200, data });
  } catch (err) {
    return handle("adminMetrics")(err, res);
  }
};
