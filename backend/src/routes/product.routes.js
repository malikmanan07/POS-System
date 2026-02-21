const express = require("express");
const router = express.Router();

const product = require("../controllers/product.controller");

router.get("/", product.getAll);
router.post("/", product.create);
router.put("/:id", product.update);
router.delete("/:id", product.remove);

module.exports = router;