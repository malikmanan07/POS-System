const express = require("express");
const router = express.Router();
const stock = require("../controllers/stock.controller");
const { requireAuth } = require("../middleware/auth");

router.get("/", requireAuth, stock.getStockStatus);
router.post("/adjust", requireAuth, stock.adjustStock);
router.get("/history", requireAuth, stock.getMovementHistory);

module.exports = router;
