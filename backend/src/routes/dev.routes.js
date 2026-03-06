const express = require("express");
const router = express.Router();
const devController = require("../controllers/dev.controller");
const jwt = require("jsonwebtoken");

// Middleware to check for developer token
const requireDev = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        if (payload.role !== "dev") {
            return res.status(403).json({ error: "Forbidden: Developer access required" });
        }
        req.devUser = payload;
        next();
    } catch (err) {
        return res.status(401).json({ error: "Invalid developer token" });
    }
};

router.post("/login", devController.login);
router.get("/dashboard-stats", requireDev, devController.getDashboardStats);
router.get("/export-stats", requireDev, devController.exportDashboardStats);
router.get("/business/:id", requireDev, devController.getBusinessDetails);
router.post("/impersonate", requireDev, devController.impersonateBusiness);
router.patch("/business/:id/toggle-status", requireDev, devController.toggleBusinessStatus);

module.exports = router;
