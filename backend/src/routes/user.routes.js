const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");

const { requireAuth } = require("../middleware/auth");

router.get("/", requireAuth, userController.getAllUsers);
router.post("/", requireAuth, userController.createUser);
router.put("/:id", requireAuth, userController.updateUser);
router.delete("/:id", requireAuth, userController.deleteUser);

module.exports = router;
