const express = require("express");
const router = express.Router();
const { objectIdParam } = require("../utility/validate");

const reportsController = require("../controller/reports");
const { requireAdmin } = require("../utility/auth");

// Reject malformed ObjectIds with 400 before any handler runs.
router.param("id", objectIdParam("Report ID"));

router.post("/", reportsController.createReport);
router.get("/", requireAdmin, reportsController.getAllReportsMessages);
router.get("/reports/:id", requireAdmin, reportsController.getSingleReportMessage);
router.delete(
  "/reports/delete/:id",
  requireAdmin,
  reportsController.deleteSingleReportMessage
);
// router.post("/respond/:id", reportsController.getSingleCategory);

module.exports = router;
