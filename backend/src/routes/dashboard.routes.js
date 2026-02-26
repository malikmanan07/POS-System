const express = require("express");
const router = express.Router();
const dashboard = require("../controllers/dashboard.controller");

const { requireAuth } = require("../middleware/auth");

router.get("/stats", requireAuth, dashboard.getStats);

module.exports = router;
