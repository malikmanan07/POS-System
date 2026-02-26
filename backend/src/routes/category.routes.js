const express = require("express");
const router = express.Router();
const category = require("../controllers/category.controller");

const { requireAuth } = require("../middleware/auth");

router.get("/", requireAuth, category.getAll);
router.post("/", requireAuth, category.create);
router.put("/:id", requireAuth, category.update);
router.delete("/:id", requireAuth, category.remove);

module.exports = router;
