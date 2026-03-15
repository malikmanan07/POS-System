const express = require("express");
const router = express.Router();
const branchController = require("../controllers/branch.controller");
const { requireAuth, requireSuperAdmin } = require("../middleware/auth");

// All branch routes require Super Admin for now as per requirements
router.get("/", requireAuth, requireSuperAdmin, branchController.getAllBranches);
router.post("/", requireAuth, requireSuperAdmin, branchController.createBranch);
router.put("/:id", requireAuth, requireSuperAdmin, branchController.updateBranch);

router.post("/assign", requireAuth, requireSuperAdmin, branchController.assignUserToBranch);
router.delete("/assign/:userId/:businessId", requireAuth, requireSuperAdmin, branchController.removeUserFromBranch);
router.get("/user/:userId", requireAuth, branchController.getUserAssignments);

module.exports = router;
