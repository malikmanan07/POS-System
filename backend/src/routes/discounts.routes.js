const express = require("express");
const router = express.Router();
const discountController = require("../controllers/discounts.controller");
const { requireAuth, requirePermission } = require("../middleware/auth");

router.get("/", requireAuth, discountController.getAll);
router.post("/", requireAuth, requirePermission("manage_discounts"), discountController.create);
router.put("/:id", requireAuth, requirePermission("manage_discounts"), discountController.update);
router.delete("/:id", requireAuth, requirePermission("manage_discounts"), discountController.remove);

module.exports = router;
