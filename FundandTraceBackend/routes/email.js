// Email preferences: signed one-click unsubscribe from donor updates.
//
// - The link in the email body opens the website's /unsubscribe page, which
//   asks for confirmation and then POSTs here (mail scanners prefetch links,
//   so opening a link never changes anything).
// - The List-Unsubscribe header points here directly; mail providers send
//   the RFC 8058 one-click POST, and a plain GET is redirected to the page.
const express = require("express");
const mongoose = require("mongoose");
const { verifyUnsubscribe, optOut } = require("../services/donorUpdates");
const logger = require("../utility/logger");

const router = express.Router();

function params(req) {
  const src = { ...(req.query || {}), ...(req.body || {}) };
  const e = String(src.e || "").toLowerCase().slice(0, 254);
  const s = String(src.s || "");
  const t = String(src.t || "");
  const scopeOk = s === "all" || mongoose.Types.ObjectId.isValid(s);
  return { e, s, t, ok: scopeOk && verifyUnsubscribe(e, s, t) };
}

router.get("/unsubscribe", (req, res) => {
  const { e, s, t } = params(req);
  const main = (process.env.MAINURL || "").replace(/\/$/, "");
  return res.redirect(302, `${main}/unsubscribe?${new URLSearchParams({ e, s, t })}`);
});

router.post("/unsubscribe", async (req, res) => {
  const { e, s, ok } = params(req);
  if (!ok) return res.status(400).json({ status: 400, error: "This unsubscribe link is incomplete or has been changed." });
  try {
    await optOut(e, s);
    return res.status(200).json({ status: 200, data: { email: e, scope: s } });
  } catch (err) {
    logger.error({ err }, "Unsubscribe failed");
    return res.status(500).json({ status: 500, error: "Server error." });
  }
});

module.exports = router;
