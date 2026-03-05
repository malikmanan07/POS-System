const pool = require("../config/db");
const { eq, and, inArray } = require("drizzle-orm");
const { users, roles: rolesTable, rolePermissions, permissions } = require("../db/schema");
const jwt = require("jsonwebtoken");

exports.requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (!payload.name || !payload.businessId) {
      const [u] = await pool.db.select({ name: users.name, businessId: users.businessId })
        .from(users)
        .where(eq(users.id, payload.id))
        .limit(1);
      if (u) {
        payload.name = u.name;
        payload.businessId = u.businessId;
      }
    }

    req.user = {
      id: payload.id,
      businessId: payload.businessId,
      name: payload.name,
      roles: payload.roles || []
    };
    req.businessId = payload.businessId; // Convenience attachment
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