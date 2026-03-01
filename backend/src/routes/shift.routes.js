const express = require("express");
const router = express.Router();
const shiftController = require("../controllers/shift.controller");
const { requireAuth } = require("../middleware/auth");

// All routes are protected
router.use(requireAuth);

router.get("/current", shiftController.getCurrentShift);
router.post("/start", shiftController.startShift);
router.post("/end", shiftController.endShift);
router.get("/", shiftController.getAllShifts);

module.exports = router;
