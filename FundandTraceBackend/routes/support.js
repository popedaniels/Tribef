const express = require("express");
const router = express.Router();
const { objectIdParam } = require("../utility/validate");

const supportController = require("../controller/support");
const { requireAdmin } = require("../utility/auth");

// Reject malformed ObjectIds with 400 before any handler runs.
router.param("id", objectIdParam("Support message ID"));

router.post("/", supportController.createSupport);
router.get("/", requireAdmin, supportController.getAllSupportMessages);
router.get("/support/:id", requireAdmin, supportController.getSingleSupportMessage);
router.delete(
  "/support/delete/:id",
  requireAdmin,
  supportController.deleteSingleSupportMessage
);
router.post("/support/reply/:id", requireAdmin, supportController.replyToSupportMessage);

module.exports = router;
