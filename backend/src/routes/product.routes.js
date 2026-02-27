const express = require("express");
const router = express.Router();

const product = require("../controllers/product.controller");

const upload = require("../middleware/upload");
const { requireAuth } = require("../middleware/auth");

router.get("/", requireAuth, product.getAll);
router.post("/", requireAuth, upload.single("image"), product.create);
router.put("/:id", requireAuth, upload.single("image"), product.update);
router.delete("/:id", requireAuth, product.remove);

module.exports = router;