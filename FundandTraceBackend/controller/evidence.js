const crypto = require("crypto");
const mongoose = require("mongoose");
const QRCode = require("qrcode");
const ev = require("../services/evidence");
const media = require("../services/mediaStore");
const { CaptureSession, EvidenceRecord } = require("../models/evidenceModel");
const { Users } = require("../models/users");
const { Campaign } = require("../models/campaignModel");
const { FundingRequests } = require("../models/fundingRequestModel");
const { encrypt, decrypt } = require("../utility/encryption");
const { getAuthUserId, authenticate } = require("../utility/auth");
const logger = require("../utility/logger");
const { recordAdminAction } = require("../services/activityLog");

const MAX_OPEN_SESSIONS_PER_HOUR = 8;
const isObjectId = (v) => mongoose.Types.ObjectId.isValid(String(v || "")) && /^[0-9a-f]{24}$/i.test(String(v));
const bad = (res, status, error, extra = {}) => res.status(status).json({ status, error, ...extra });
const mediaPath = (recordId) => `/api/evidence/records/${recordId}/media`;
const frontendUrl = () => String(process.env.MAINURL || "http://localhost:3000").replace(/\/$/, "");
const ipCountryOf = (req) =>
  String(req.headers["cf-ipcountry"] || req.headers["x-vercel-ip-country"] || req.headers["x-country-code"] || "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 2);

const sessionView = (s, { includeCode = true } = {}) => ({
  id: String(s._id),
  kind: s.kind,
  purpose: s.purpose,
  campaignId: s.campaignId,
  fundingRequestId: s.fundingRequestId,
  docType: s.docType,
  docCountry: s.docCountry,
  code: includeCode ? s.code : undefined,
  prompts: s.prompts,
  slots: s.slots,
  issuedAt: s.issuedAt,
  expiresAt: s.expiresAt,
  status: s.status === "open" && new Date(s.expiresAt) < new Date() ? "expired" : s.status,
  records: (s.records || []).map((r) => ({ slot: r.slot, recordId: r.recordId, mime: r.mime, sha256: r.sha256 })),
});

// ── Who may act on a session: its owner (signed in) or the holder of its
// capture token (the phone they scanned the QR code with). ────────────────
async function loadSessionForCapture(req, res) {
  const { id } = req.params;
  if (!isObjectId(id)) return bad(res, 400, "Invalid session id"), null;
  const session = await CaptureSession.findById(id);
  if (!session) return bad(res, 404, "Capture session not found"), null;

  const token = String(req.headers["x-capture-token"] || "");
  const tokenOk =
    token.length >= 32 &&
    crypto.timingSafeEqual(Buffer.from(ev.sha256(token)), Buffer.from(String(session.tokenHash)));
  let owner = false;
  if (!tokenOk) {
    const decoded = await authenticate(req);
    owner = Boolean(decoded && String(getAuthUserId(decoded)) === String(session.userId));
  }
  if (!tokenOk && !owner) return bad(res, 403, "Not allowed to use this capture session"), null;
  return session;
}

const isOpen = (s) => s.status === "open" && new Date(s.expiresAt) > new Date();

// POST /api/evidence/sessions
exports.createSession = async (req, res) => {
  try {
    const userId = String(getAuthUserId(req.auth));
    const kind = String(req.body?.kind || "");
    if (!["identity", "evidence"].includes(kind)) return bad(res, 400, "kind must be identity or evidence");

    const since = new Date(Date.now() - 60 * 60 * 1000);
    const recent = await CaptureSession.countDocuments({ userId, issuedAt: { $gte: since } });
    if (recent >= MAX_OPEN_SESSIONS_PER_HOUR) return bad(res, 429, "Too many capture sessions. Please wait a while and try again.");

    const fields = { userId, kind };
    if (kind === "identity") {
      const docType = String(req.body?.docType || "");
      const docCountry = String(req.body?.docCountry || "").trim().slice(0, 60);
      if (!ev.ID_DOC_TYPES.includes(docType)) return bad(res, 400, `docType must be one of: ${ev.ID_DOC_TYPES.join(", ")}`);
      if (!docCountry) return bad(res, 400, "docCountry is required");
      const user = await Users.findById(userId).select("identityVerification").lean();
      if (user?.identityVerification?.status === "verified") return bad(res, 409, "Your identity is already verified");
      Object.assign(fields, { docType, docCountry, slots: ev.slotsFor("identity", docType), prompts: [...ev.randomPrompts(1), ev.ID_PROMPT] });
    } else {
      const purpose = String(req.body?.purpose || "update");
      const campaignId = String(req.body?.campaignId || "");
      if (!["update", "receipt"].includes(purpose)) return bad(res, 400, "purpose must be update or receipt");
      if (!isObjectId(campaignId)) return bad(res, 400, "campaignId is required");
      const campaign = await Campaign.findById(campaignId).select("organizerId").lean();
      if (!campaign) return bad(res, 404, "Campaign not found");
      if (String(campaign.organizerId) !== userId) return bad(res, 403, "Only the organiser can add evidence to this campaign");
      Object.assign(fields, { purpose, campaignId, slots: ev.slotsFor("evidence") });
      if (purpose === "receipt") {
        const frId = String(req.body?.fundingRequestId || "");
        if (!isObjectId(frId)) return bad(res, 400, "fundingRequestId is required for a receipt");
        const fr = await FundingRequests.findById(frId).select("campaignId disbursement").lean();
        if (!fr || String(fr.campaignId) !== campaignId) return bad(res, 404, "Funding request not found for this campaign");
        if (!fr.disbursement?.dateDisbursed) return bad(res, 409, "Proof can be added once the payout has been made");
        fields.fundingRequestId = frId;
      }
    }

    const token = crypto.randomBytes(32).toString("base64url");
    const now = new Date();
    const session = await CaptureSession.create({
      ...fields,
      code: ev.randomCode(),
      tokenHash: ev.sha256(token),
      issuedAt: now,
      expiresAt: new Date(now.getTime() + ev.SESSION_TTL_MS),
    });
    // Token goes in the URL fragment: never sent to a server, never in logs or Referer.
    const handoffUrl = `${frontendUrl()}/capture/${session._id}#t=${token}`;
    const qr = await QRCode.toDataURL(handoffUrl, { margin: 1, width: 240 });
    return res.status(201).json({ status: 201, data: { ...sessionView(session), captureToken: token, handoffUrl, qr } });
  } catch (error) {
    logger.error({ err: error }, "createSession failed");
    return bad(res, 500, "Server error.");
  }
};

// GET /api/evidence/sessions/:id
exports.getSession = async (req, res) => {
  try {
    const session = await loadSessionForCapture(req, res);
    if (!session) return undefined;
    return res.status(200).json({ status: 200, data: sessionView(session) });
  } catch (error) {
    logger.error({ err: error }, "getSession failed");
    return bad(res, 500, "Server error.");
  }
};

// POST /api/evidence/sessions/:id/media/:slot   (raw body: the captured file)
exports.uploadMedia = async (req, res) => {
  try {
    const session = await loadSessionForCapture(req, res);
    if (!session) return undefined;
    if (!isOpen(session)) return bad(res, 410, "This capture session has expired. Start a new one.");

    const slot = String(req.params.slot || "");
    const rule = ev.SLOT_RULES[slot];
    if (!rule || !session.slots.includes(slot)) return bad(res, 400, "This session doesn't accept that item");
    if (session.kind === "identity" && session.records.some((r) => r.slot === slot)) {
      return bad(res, 409, "Already captured. Start a new session to retake.");
    }
    if (session.kind === "evidence" && session.records.length >= ev.MAX_EVIDENCE_ITEMS) {
      return bad(res, 409, `Up to ${ev.MAX_EVIDENCE_ITEMS} items per session`);
    }

    const body = req.body;
    if (!Buffer.isBuffer(body) || !body.length) return bad(res, 400, "Send the captured file as the request body");
    if (body.length > rule.maxBytes) return bad(res, 413, "File too large");
    const sniffed = ev.sniffMedia(body);
    if (!sniffed || !rule.media.includes(sniffed.media)) return bad(res, 415, `Expected a ${rule.media.join(" or ")} from the camera`);

    const digest = ev.sha256(body);
    const claimed = String(req.headers["x-content-sha256"] || "").toLowerCase();
    if (claimed && claimed !== digest) return bad(res, 422, "The file was corrupted in transit. Please try again.");

    const receivedAt = new Date();
    const clientMeta = ev.parseClientMeta(req.headers["x-capture-meta"]);
    const loc = ev.sealLocation(clientMeta.location);
    const isIdentity = session.kind === "identity";
    const visibility = isIdentity ? "private" : "public";

    const storageId = await media.store.put(body, {
      filename: `${session._id}-${slot}`,
      contentType: sniffed.mime,
      encrypt: isIdentity,
    });

    const record = await ev.appendRecord(
      {
        sessionId: String(session._id),
        userId: session.userId,
        kind: session.kind,
        purpose: session.purpose || (isIdentity ? "identity" : ""),
        slot,
        campaignId: session.campaignId || "",
        fundingRequestId: session.fundingRequestId || "",
        visibility,
        mime: sniffed.mime,
        bytes: body.length,
        sha256: digest,
        challengeCode: session.code,
        prompts: slot === "selfie_video" ? session.prompts : [],
        issuedAt: session.issuedAt,
        receivedAt,
        client: { ...clientMeta, location: undefined, userAgent: String(req.headers["user-agent"] || "").slice(0, 300) },
        locationCoarse: loc.coarse,
        locationCommitment: loc.commitment,
        ipCountry: ipCountryOf(req),
        flags: ev.flagsFor({ clientMeta, receivedAt, location: clientMeta.location }),
      },
      { storageId, preciseLocationEnc: loc.precise ? encrypt(JSON.stringify(loc.precise)) : "" },
      { EvidenceRecord, Types: mongoose.Types }
    );

    await CaptureSession.updateOne(
      { _id: session._id },
      { $push: { records: { slot, recordId: String(record._id), mime: record.mime, sha256: record.sha256 } } }
    );
    return res.status(201).json({ status: 201, data: ev.publicRecord(record) });
  } catch (error) {
    if (error.status === 503) return bad(res, 503, "Live capture is temporarily unavailable.");
    logger.error({ err: error }, "uploadMedia failed");
    return bad(res, 500, "Server error.");
  }
};

// POST /api/evidence/sessions/:id/submit
exports.submitSession = async (req, res) => {
  try {
    const session = await loadSessionForCapture(req, res);
    if (!session) return undefined;
    if (!isOpen(session)) return bad(res, 410, "This capture session has expired. Start a new one.");
    const have = new Set(session.records.map((r) => r.slot));

    if (session.kind === "identity") {
      const missing = session.slots.filter((s) => !have.has(s));
      if (missing.length) return bad(res, 422, `Still needed: ${missing.join(", ")}`, { missing });
      session.status = "submitted";
      session.submittedAt = new Date();
      await session.save();
      const user = await Users.findById(session.userId);
      if (user && user.identityVerification?.status !== "verified") {
        user.identityVerification = {
          ...(user.identityVerification?.toObject?.() || user.identityVerification || {}),
          status: "pending",
          method: "in_app",
          sessionId: String(session._id),
          submittedAt: session.submittedAt,
          idDocumentType: session.docType,
          idCountry: session.docCountry,
          rejectionReason: "",
        };
        await user.save();
      }
      logger.info({ sessionId: String(session._id) }, "Identity submitted for review");
      return res.status(200).json({ status: 200, data: sessionView(session) });
    }

    if (!session.records.length) return bad(res, 422, "Capture at least one photo or video first");
    const caption = String(req.body?.caption || "").trim().slice(0, 1000);
    session.status = "submitted";
    session.submittedAt = new Date();
    session.caption = caption;
    await session.save();

    const photo = session.records.find((r) => r.slot === "photo");
    const video = session.records.find((r) => r.slot === "video");
    if (session.purpose === "receipt") {
      const first = photo || video;
      await FundingRequests.updateOne(
        { _id: session.fundingRequestId },
        {
          $set: {
            "disbursement.receipt": mediaPath(first.recordId),
            "disbursement.receiptUploadedAt": session.submittedAt,
            "disbursement.receiptEvidenceSessionId": String(session._id),
          },
        }
      );
      const fr = await FundingRequests.findById(session.fundingRequestId).select("campaignId").lean();
      if (fr) await require("../services/donorUpdates").enqueue("receipt", fr._id, fr.campaignId);
    } else {
      const camp = await Campaign.findById(session.campaignId).select("organizer").lean();
      await Campaign.updateOne(
        { _id: session.campaignId },
        {
          $push: {
            updates: {
              story: caption,
              datePosted: session.submittedAt,
              image: photo ? mediaPath(photo.recordId) : "",
              video: video ? mediaPath(video.recordId) : "",
              addedBy: camp?.organizer || "Organiser",
              evidenceSessionId: String(session._id),
              evidenceIds: session.records.map((r) => r.recordId),
            },
          },
        }
      );
    }
    return res.status(200).json({ status: 200, data: sessionView(session) });
  } catch (error) {
    logger.error({ err: error }, "submitSession failed");
    return bad(res, 500, "Server error.");
  }
};

// ── Reading records ────────────────────────────────────────────────────────
// Owner or admin. Admin views of private (identity) files are written to the
// admin activity log, so access to someone's ID is always traceable.
async function canSeePrivate(req, record, { logAs = "" } = {}) {
  const decoded = await authenticate(req);
  if (!decoded) return false;
  const uid = String(getAuthUserId(decoded));
  if (uid === String(record.userId)) return true;
  const user = await Users.findById(uid).select("role firstName lastName email").lean();
  if (user?.role !== "admin") return false;
  if (logAs) {
    recordAdminAction({ admin: user }, logAs, { targetType: "evidence", targetId: String(record._id), details: { slot: record.slot, owner: String(record.userId) } });
  }
  return true;
}

// GET /api/evidence/records/:id
exports.getRecord = async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) return bad(res, 400, "Invalid record id");
    const record = await EvidenceRecord.findById(req.params.id).lean();
    if (!record) return bad(res, 404, "Record not found");
    if (record.visibility !== "public" && !(await canSeePrivate(req, record))) return bad(res, 404, "Record not found");
    const key = ev.loadSigningKey();
    const signatureValid = key && key.keyId === record.keyId ? ev.verifySignature(record.recordHash, record.signature, key.publicKey) : null;
    return res.status(200).json({
      status: 200,
      data: {
        record: ev.publicRecord(record),
        checks: {
          recordHashMatches: ev.recordHashOf(record) === record.recordHash,
          linkHashMatches: ev.chainHashOf(record) === record.hash,
          signatureValid,
        },
        mediaUrl: record.mediaDeletedAt ? null : mediaPath(record._id),
      },
    });
  } catch (error) {
    logger.error({ err: error }, "getRecord failed");
    return bad(res, 500, "Server error.");
  }
};

// GET /api/evidence/records/:id/media   (supports Range, which Safari needs for video)
exports.getMedia = async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) return bad(res, 400, "Invalid record id");
    const record = await EvidenceRecord.findById(req.params.id).select("visibility userId slot storageId mime sha256 mediaDeletedAt").lean();
    if (!record) return bad(res, 404, "Not found");
    const isPublic = record.visibility === "public";
    if (!isPublic && !(await canSeePrivate(req, record, { logAs: "view private evidence" }))) return bad(res, 404, "Not found");
    if (record.mediaDeletedAt) return bad(res, 410, "This file was deleted under our retention policy; its fingerprint remains on the record.");
    const file = await media.store.get(record.storageId);
    if (!file) return bad(res, 404, "Not found");

    const buf = file.buffer;
    res.setHeader("Content-Type", record.mime);
    res.setHeader("ETag", `"${record.sha256}"`);
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("X-Content-SHA256", record.sha256);
    res.setHeader("Cache-Control", isPublic ? "public, max-age=31536000, immutable" : "private, no-store");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    if (!isPublic) res.setHeader("Content-Disposition", "inline");
    if (req.headers["if-none-match"] === `"${record.sha256}"`) return res.status(304).end();

    const range = /^bytes=(\d*)-(\d*)$/.exec(String(req.headers.range || ""));
    if (range && (range[1] || range[2])) {
      let start = range[1] ? Number(range[1]) : buf.length - Number(range[2]);
      let end = range[1] && range[2] ? Number(range[2]) : buf.length - 1;
      start = Math.max(0, start);
      end = Math.min(end, buf.length - 1);
      if (start > end) {
        res.setHeader("Content-Range", `bytes */${buf.length}`);
        return res.status(416).end();
      }
      res.setHeader("Content-Range", `bytes ${start}-${end}/${buf.length}`);
      res.setHeader("Content-Length", end - start + 1);
      return res.status(206).end(buf.subarray(start, end + 1));
    }
    res.setHeader("Content-Length", buf.length);
    return res.status(200).end(buf);
  } catch (error) {
    logger.error({ err: error }, "getMedia failed");
    return bad(res, 500, "Server error.");
  }
};

// GET /api/evidence/campaign/:campaignId  — public sealed evidence for a campaign
exports.campaignEvidence = async (req, res) => {
  try {
    if (!isObjectId(req.params.campaignId)) return bad(res, 400, "Invalid campaign id");
    const records = await EvidenceRecord.find({ campaignId: req.params.campaignId, visibility: "public" })
      .sort({ seq: -1 })
      .limit(100)
      .lean()
      .maxTimeMS(3000);
    const sessionIds = [...new Set(records.map((r) => r.sessionId))];
    const sessions = await CaptureSession.find({ _id: { $in: sessionIds }, status: "submitted" }).select("caption submittedAt purpose").lean();
    const bySession = new Map(sessions.map((s) => [String(s._id), s]));
    const data = records
      .filter((r) => bySession.has(r.sessionId))
      .map((r) => ({ ...ev.publicRecord(r), caption: bySession.get(r.sessionId).caption || "", mediaUrl: r.mediaDeletedAt ? null : mediaPath(r._id) }));
    return res.status(200).json({ status: 200, data });
  } catch (error) {
    logger.error({ err: error }, "campaignEvidence failed");
    return bad(res, 500, "Server error.");
  }
};

// GET /api/evidence/chain?after=0&limit=500  — chain links only (no content)
exports.chain = async (req, res) => {
  try {
    const after = Math.max(0, Number(req.query.after) || 0);
    const limit = Math.min(5000, Math.max(1, Number(req.query.limit) || 500));
    const links = await EvidenceRecord.find({ seq: { $gt: after } })
      .sort({ seq: 1 })
      .limit(limit)
      .select("seq prevHash recordHash hash receivedAt -_id")
      .lean()
      .maxTimeMS(5000);
    return res.status(200).json({ status: 200, data: { links, next: links.length === limit ? links[links.length - 1].seq : null } });
  } catch (error) {
    logger.error({ err: error }, "evidence chain failed");
    return bad(res, 500, "Server error.");
  }
};

// GET /api/evidence/public-key
exports.publicKey = (req, res) => {
  const key = ev.loadSigningKey();
  if (!key) return bad(res, 503, "Evidence signing key is not configured");
  return res.status(200).json({ status: 200, data: { algorithm: "Ed25519", keyId: key.keyId, publicKeyPem: key.publicPem } });
};

// ── Admin: identity review ────────────────────────────────────────────────
// GET /api/evidence/admin/identity?status=submitted
exports.identityQueue = async (req, res) => {
  try {
    const status = ["submitted", "approved", "rejected"].includes(req.query.status) ? req.query.status : "submitted";
    const sessions = await CaptureSession.find({ kind: "identity", status }).sort({ submittedAt: 1 }).limit(100).lean().maxTimeMS(5000);
    const users = await Users.find({ _id: { $in: sessions.map((s) => s.userId).filter(isObjectId) } })
      .select("firstName lastName email country city identityVerification")
      .lean();
    const byId = new Map(users.map((u) => [String(u._id), u]));
    const recordIds = sessions.flatMap((s) => s.records.map((r) => r.recordId));
    const records = await EvidenceRecord.find({ _id: { $in: recordIds } }).lean();
    const recById = new Map(records.map((r) => [String(r._id), r]));
    const data = sessions.map((s) => {
      const u = byId.get(String(s.userId)) || {};
      return {
        ...sessionView(s),
        submittedAt: s.submittedAt,
        review: s.review,
        user: { id: String(s.userId), name: `${u.firstName || ""} ${u.lastName || ""}`.trim(), email: u.email, country: u.country, city: u.city },
        // Government database lookup (Smile ID), if the organiser ran one. No ID number, only the result.
        databaseCheck: u.identityVerification?.databaseCheck?.checkedAt
          ? (({ idHash, jobId, ...rest }) => ({ ...rest, duplicates: (rest.duplicateOf || []).length }))(u.identityVerification.databaseCheck)
          : null,
        items: s.records.map((r) => {
          const rec = recById.get(r.recordId);
          if (!rec) return { slot: r.slot, recordId: r.recordId, missing: true };
          let precise = null;
          try {
            precise = rec.preciseLocationEnc ? JSON.parse(decrypt(rec.preciseLocationEnc)) : null;
          } catch {
            precise = null;
          }
          return {
            ...ev.publicRecord(rec),
            preciseLocation: precise ? { lat: precise.lat, lng: precise.lng, accuracy: precise.accuracy } : null,
            mediaUrl: rec.mediaDeletedAt ? null : mediaPath(rec._id),
            intact: ev.recordHashOf(rec) === rec.recordHash && ev.chainHashOf(rec) === rec.hash,
          };
        }),
      };
    });
    return res.status(200).json({ status: 200, data });
  } catch (error) {
    logger.error({ err: error }, "identityQueue failed");
    return bad(res, 500, "Server error.");
  }
};

const CHECK_KEYS = ["codeSpoken", "promptsFollowed", "faceMatchesId", "documentLooksGenuine", "nameMatchesAccount"];

// POST /api/evidence/admin/identity/:id/decision  { decision, reason, nameOnId, checks }
exports.decideIdentity = async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) return bad(res, 400, "Invalid session id");
    const decision = String(req.body?.decision || "");
    if (!["approve", "reject"].includes(decision)) return bad(res, 400, "decision must be approve or reject");
    const reason = String(req.body?.reason || "").trim().slice(0, 500);
    const nameOnId = String(req.body?.nameOnId || "").trim().slice(0, 120);
    const checks = Object.fromEntries(CHECK_KEYS.map((k) => [k, req.body?.checks?.[k] === true]));

    const session = await CaptureSession.findOne({ _id: req.params.id, kind: "identity" });
    if (!session) return bad(res, 404, "Identity submission not found");
    if (session.status !== "submitted") return bad(res, 409, `Already ${session.status}`);
    if (String(session.userId) === String(req.admin._id)) return bad(res, 403, "You can't review your own identity");

    if (decision === "approve") {
      const failed = CHECK_KEYS.filter((k) => !checks[k]);
      if (failed.length) return bad(res, 422, "Every check must pass to approve", { failed });
      if (!nameOnId) return bad(res, 422, "Type the name exactly as it appears on the ID");
      const records = await EvidenceRecord.find({ sessionId: String(session._id) }).lean();
      const broken = records.filter((r) => ev.recordHashOf(r) !== r.recordHash || ev.chainHashOf(r) !== r.hash);
      if (broken.length || records.length < session.slots.length) return bad(res, 409, "Sealed records are incomplete or altered; can't approve");
    } else if (reason.length < 10) {
      return bad(res, 422, "Tell the organiser what to fix (10+ characters)");
    }

    const now = new Date();
    const adminName = `${req.admin.firstName || ""} ${req.admin.lastName || ""}`.trim();
    session.status = decision === "approve" ? "approved" : "rejected";
    session.review = { decidedAt: now, adminId: String(req.admin._id), adminName, decision, reason, nameOnId, checks };
    await session.save();

    const user = await Users.findById(session.userId);
    if (user) {
      const prev = user.identityVerification?.toObject?.() || user.identityVerification || {};
      user.identityVerification =
        decision === "approve"
          ? {
              ...prev,
              status: "verified",
              method: "in_app",
              sessionId: String(session._id),
              verifiedAt: now,
              idDocumentType: session.docType,
              idCountry: session.docCountry,
              nameOnId,
              facialLivenessMatched: true,
              reviewedBy: adminName,
              rejectionReason: "",
            }
          : { ...prev, status: "requires_input", method: "in_app", sessionId: String(session._id), rejectionReason: reason, facialLivenessMatched: false };
      user.adminActivities = user.adminActivities || [];
      user.adminActivities.push({ date: now, AdminId: String(req.admin._id), AdminName: adminName, action: `In-app identity ${decision}d` });
      await user.save();
    }
    return res.status(200).json({ status: 200, data: { id: String(session._id), status: session.status } });
  } catch (error) {
    logger.error({ err: error }, "decideIdentity failed");
    return bad(res, 500, "Server error.");
  }
};

// ── Retention: delete identity FILES (never the sealed records) ───────────
async function purgeIdentityMedia({ days = Number(process.env.ID_MEDIA_RETENTION_DAYS || 0), now = new Date() } = {}) {
  if (!(days > 0)) return { purged: 0, skipped: "ID_MEDIA_RETENTION_DAYS not set" };
  const cutoff = new Date(now.getTime() - days * 86400000);
  const sessions = await CaptureSession.find({ kind: "identity", status: { $in: ["approved", "rejected"] }, "review.decidedAt": { $lt: cutoff } })
    .select("_id")
    .lean();
  const records = await EvidenceRecord.find({ sessionId: { $in: sessions.map((s) => String(s._id)) }, mediaDeletedAt: null }).select("storageId").lean();
  for (const r of records) {
    await media.store.remove(r.storageId);
    await EvidenceRecord.updateOne({ _id: r._id }, { $set: { mediaDeletedAt: now, mediaDeletedReason: `retention ${days}d` } });
  }
  return { purged: records.length };
}
exports.purgeIdentityMedia = purgeIdentityMedia;
