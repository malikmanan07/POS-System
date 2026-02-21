const express = require("express");
const router = express.Router();
const roleController = require("../controllers/role.controller");

router.get("/", roleController.getAllRoles);
router.post("/", roleController.createRole);
router.put("/:id", roleController.updateRole);
router.delete("/:id", roleController.deleteRole);

// Permissions
router.get("/permissions/all", roleController.getAllPermissions);
router.get("/:id/permissions", roleController.getRolePermissions);
router.post("/:id/permissions", roleController.updateRolePermissions);

module.exports = router;
