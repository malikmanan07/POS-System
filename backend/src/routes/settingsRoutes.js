const express = require("express");
const router = express.Router();
const settingsController = require("../controllers/settingsController");
const { requireAuth } = require("../middleware/auth");

// All settings routes protected by auth
router.use(requireAuth);


router.get("/", settingsController.getSettings);
router.get("/:key", settingsController.getSettings);
router.post("/:key", settingsController.updateSetting); // Using POST as update/create

module.exports = router;
