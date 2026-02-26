const express = require("express");
const router = express.Router();
const roleController = require("../controllers/role.controller");

const { requireAuth } = require("../middleware/auth");

router.get("/", requireAuth, roleController.getAllRoles);
router.post("/", requireAuth, roleController.createRole);
router.put("/:id", requireAuth, roleController.updateRole);
router.delete("/:id", requireAuth, roleController.deleteRole);

// Permissions
router.get("/permissions", requireAuth, roleController.getAllPermissions);
router.get("/:id/permissions", requireAuth, roleController.getRolePermissions);
router.put("/:id/permissions", requireAuth, roleController.updateRolePermissions);

module.exports = router;
