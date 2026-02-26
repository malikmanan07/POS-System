const express = require("express");
const router = express.Router();

const auth = require("../controllers/auth.controller");

router.get("/has-admin", auth.hasAdmin);
router.post("/signup-admin", auth.signupAdmin);
router.post("/signup", auth.signup);
router.post("/login", auth.login);

// DEV ONLY: create first admin
// router.post("/seed-admin", auth.seedAdmin);

module.exports = router;