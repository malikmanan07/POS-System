const express = require("express");
const router = express.Router();

const auth = require("../controllers/auth.controller");
const { requireAuth } = require("../middleware/auth");

router.post("/login", auth.login);
router.post("/signup", auth.signup);

module.exports = router;