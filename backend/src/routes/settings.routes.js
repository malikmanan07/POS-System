const express = require("express");
const router = express.Router();
const settingsController = require("../controllers/settings.controller");
const { requireAuth } = require("../middleware/auth");

const upload = require("../middleware/upload");

// All settings routes protected by auth
router.use(requireAuth);

router.get("/", settingsController.getSettings);
router.get("/:key", settingsController.getSettings);

// Handle business logo upload
router.post("/business", upload.single("logo"), (req, res, next) => {
    req.params.key = "business";
    next();
}, settingsController.updateSetting);
router.post("/:key", settingsController.updateSetting); // Other settings

module.exports = router;
