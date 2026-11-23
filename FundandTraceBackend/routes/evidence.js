const express = require("express");
const router = express.Router();
const evidence = require("../controller/evidence");
const { requireAuth, requireAdmin } = require("../utility/auth");
const { auditAdminMutations } = require("../utility/adminAudit");

// Captured files arrive as the raw request body (no multipart parsing, no
// temp files). The per-slot size limit is enforced again in the controller.
const rawMedia = express.raw({ type: () => true, limit: "31mb" });

router.get("/public-key", evidence.publicKey);
router.get("/chain", evidence.chain);
router.get("/campaign/:campaignId", evidence.campaignEvidence);
router.get("/records/:id", evidence.getRecord);
router.get("/records/:id/media", evidence.getMedia);

router.post("/sessions", requireAuth, evidence.createSession);
// Session routes accept either the signed-in owner or the session's capture
// token (phone hand-off), so they authenticate inside the controller.
router.get("/sessions/:id", evidence.getSession);
router.post("/sessions/:id/media/:slot", rawMedia, evidence.uploadMedia);
router.post("/sessions/:id/submit", evidence.submitSession);

router.get("/admin/identity", requireAdmin, evidence.identityQueue);
router.post("/admin/identity/:id/decision", requireAdmin, auditAdminMutations, evidence.decideIdentity);

module.exports = router;
