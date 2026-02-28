const express = require("express");
const router = express.Router();
const activity = require("../controllers/activity.controller");
const { requireAuth } = require("../middleware/auth");

// Middleware to restrict to Super Admin
const requireSuperAdmin = (req, res, next) => {
    const roles = req.user?.roles || [];
    if (!roles.some(r => r.toLowerCase() === "super admin")) {
        return res.status(403).json({ error: "Access denied. Only Super Admin can view activity logs." });
    }
    next();
};

router.get("/modules", requireAuth, requireSuperAdmin, activity.getModules);
router.get("/", requireAuth, requireSuperAdmin, activity.getAll);
router.get("/export", requireAuth, requireSuperAdmin, activity.exportCsv);

module.exports = router;
