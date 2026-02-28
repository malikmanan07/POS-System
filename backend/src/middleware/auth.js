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

    if (!payload.name) {
      const [u] = await pool.db.select({ name: users.name })
        .from(users)
        .where(eq(users.id, payload.id))
        .limit(1);
      if (u) payload.name = u.name;
    }

    req.user = {
      id: payload.id,
      name: payload.name,
      roles: payload.roles || []
    };
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
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .innerJoin(rolesTable, eq(rolePermissions.roleId, rolesTable.id))
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