const express = require("express");
const router = express.Router();
const customer = require("../controllers/customer.controller");

const { requireAuth } = require("../middleware/auth");

router.get("/", requireAuth, customer.getAll);
router.get("/:id/history", requireAuth, customer.getHistory);
router.post("/", requireAuth, customer.create);
router.put("/:id", requireAuth, customer.update);
router.delete("/:id", requireAuth, customer.remove);

module.exports = router;
