const express = require("express");
const router = express.Router();

const supportController = require("../controller/support");
const { requireAdmin } = require("../utility/auth");

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
