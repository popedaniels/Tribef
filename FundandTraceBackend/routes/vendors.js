const express = require("express");
const router = express.Router();
const vendors = require("../controller/vendors");
const { requireAuth } = require("../utility/auth");
const { rateLimiter } = require("../utility/security");

router.get("/", vendors.listVerified);
router.get("/:id", vendors.getVerified);
router.post("/", requireAuth, rateLimiter({ windowMs: 24 * 60 * 60 * 1000, max: 10, name: "vendor-apply" }), vendors.apply);

module.exports = router;
