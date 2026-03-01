const express = require("express");
const router = express.Router();
const supplierController = require("../controllers/suppliers.controller");
const { requireAuth, requirePermission } = require("../middleware/auth");

router.get("/", requireAuth, supplierController.getAll);
router.get("/:id/products", requireAuth, supplierController.getProducts); // <-- Get linked products
router.post("/", requireAuth, requirePermission("manage_suppliers"), supplierController.create);
router.put("/:id", requireAuth, requirePermission("manage_suppliers"), supplierController.update);
router.delete("/:id", requireAuth, requirePermission("manage_suppliers"), supplierController.remove);

module.exports = router;
