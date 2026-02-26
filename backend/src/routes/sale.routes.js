const express = require("express");
const router = express.Router();
const sale = require("../controllers/sale.controller");

const { requireAuth } = require("../middleware/auth");

router.get("/", requireAuth, sale.getAll);
router.get("/:id", requireAuth, sale.getById);
router.post("/", requireAuth, sale.create);

module.exports = router;
