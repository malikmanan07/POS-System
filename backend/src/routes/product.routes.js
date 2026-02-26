const express = require("express");
const router = express.Router();

const product = require("../controllers/product.controller");

const { requireAuth } = require("../middleware/auth");

router.get("/", requireAuth, product.getAll);
router.post("/", requireAuth, product.create);
router.put("/:id", requireAuth, product.update);
router.delete("/:id", requireAuth, product.remove);

module.exports = router;