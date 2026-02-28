const express = require("express");
const router = express.Router();
const reports = require("../controllers/reports.controller");
const { requireAuth, requirePermission } = require("../middleware/auth");

// Only users with view_reports permission (or Super Admin)
router.get("/analytics", requireAuth, requirePermission("view_reports"), reports.getAnalytics);
router.get("/export-csv", requireAuth, requirePermission("view_reports"), reports.exportCsv);

module.exports = router;
