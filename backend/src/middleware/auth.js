const pool = require("../config/db");
const { eq, and, inArray } = require("drizzle-orm");
const { users, roles: rolesTable, rolePermissions, permissions, businesses } = require("../db/schema");
const jwt = require("jsonwebtoken");

exports.requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Get Active Business ID from Header or Token
    const headerBusinessId = req.headers["x-business-id"];
    const activeBusinessId = headerBusinessId ? parseInt(headerBusinessId) : payload.businessId;

    const userRoles = payload.roles || [];
    const isSuperAdmin = userRoles.some(r => r.toLowerCase() === "super admin");

    // Verify Business Ownership (Circle of Trust)
    const [targetBusiness] = await pool.db
      .select({ id: businesses.id, tenantId: businesses.tenantId })
      .from(businesses)
      .where(eq(businesses.id, activeBusinessId))
      .limit(1);

    if (!targetBusiness || targetBusiness.tenantId !== payload.tenantId) {
      return res.status(403).json({ error: "Access denied. Business not in your group." });
    }

    if (!isSuperAdmin) {
      // Verify if Admin/Staff has access to this specific branch
      if (activeBusinessId !== payload.businessId) {
        const [assignment] = await pool.db
          .select()
          .from(require("../db/schema").userBranches)
          .where(and(
            eq(require("../db/schema").userBranches.userId, payload.id),
            eq(require("../db/schema").userBranches.businessId, activeBusinessId)
          ))
          .limit(1);

        if (!assignment) {
          return res.status(403).json({ error: "Access denied. You are not assigned to this branch." });
        }
      }
    }

    req.user = {
      id: payload.id,
      businessId: payload.businessId, // home business
      tenantId: payload.tenantId,
      activeBusinessId: activeBusinessId,
      name: payload.name,
      roles: userRoles
    };
    req.businessId = activeBusinessId;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

exports.requireSuperAdmin = (req, res, next) => {
  const roles = req.user?.roles || [];
  if (!roles.some(r => r.toLowerCase() === "super admin")) {
    return res.status(403).json({ error: "Access denied. Super Admin role required." });
  }
  next();
};

exports.requirePermission = (permission) => async (req, res, next) => {
  const userRoles = req.user?.roles || [];
  if (userRoles.some(r => r.toLowerCase() === "super admin")) return next();

  try {
    const [hasIt] = await pool.db
      .select({ name: permissions.name })
      .from(rolePermissions)
      .innerJoin(permissions, and(
        eq(rolePermissions.permissionId, permissions.id),
        eq(permissions.businessId, req.businessId)
      ))
      .innerJoin(rolesTable, and(
        eq(rolePermissions.roleId, rolesTable.id),
        eq(rolesTable.businessId, req.businessId)
      ))
      .where(and(
        eq(permissions.name, permission),
        inArray(rolesTable.name, userRoles)
      ))
      .limit(1);

    if (hasIt) return next();
    return res.status(403).json({ error: `Access denied. ${permission} permission required.` });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};