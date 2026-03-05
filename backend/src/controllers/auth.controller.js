const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { eq, sql } = require("drizzle-orm");
const { users, userRoles, roles, rolePermissions, permissions, businesses } = require("../db/schema");
const { logActivity } = require("../utils/logger");
const { REQUIRED_PERMISSIONS } = require("../utils/permission.sync");

const db = pool.db;

/**
 * Helper: get user roles
 */
async function getUserRoles(userId) {
  const result = await db
    .select({ name: roles.name })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userId));

  return result.map((r) => r.name);
}

/**
 * Helper: get user permissions
 */
async function getUserPermissions(userId) {
  const result = await db
    .selectDistinct({ name: permissions.name })
    .from(userRoles)
    .innerJoin(rolePermissions, eq(userRoles.roleId, rolePermissions.roleId))
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(userRoles.userId, userId));

  return result.map((p) => p.name);
}


/**
 * POST /api/auth/login
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "email and password are required" });

    const [user] = await db
      .select({
        id: users.id,
        businessId: users.businessId,
        name: users.name,
        email: users.email,
        passwordHash: users.passwordHash,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user)
      return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const rolesList = await getUserRoles(user.id);
    const permissionsList = await getUserPermissions(user.id);

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: "JWT_SECRET not set in .env" });
    }

    const token = jwt.sign(
      { id: user.id, businessId: user.businessId, name: user.name, email: user.email, roles: rolesList },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Activity Log
    await logActivity({
      userId: user.id,
      businessId: user.businessId,
      userName: user.name,
      userRole: rolesList,
      action: 'LOGIN',
      module: 'AUTH',
      details: `User logged in from ${req.ip || 'unknown'}`,
      ipAddress: req.ip
    });

    res.json({
      token,
      user: { id: user.id, businessId: user.businessId, name: user.name, email: user.email, roles: rolesList },
      permissions: permissionsList,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/auth/signup (Public)
 */
exports.signup = async (req, res) => {
  try {
    const { businessName, email, password, name } = req.body;

    if (!businessName || !email || !password || !name) {
      return res.status(400).json({ error: "businessName, email, password, and name are required" });
    }

    // Check if user already exists (Email is unique globally)
    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing) {
      return res.status(400).json({ error: "Email is already registered" });
    }

    // Start Transaction
    const redirectData = await db.transaction(async (tx) => {
      // 1. Create Business
      const [newBusiness] = await tx.insert(businesses).values({
        name: businessName
      }).returning();

      // 2. Seed Default Roles
      const defaultRoleNames = ["Super Admin", "Admin", "Manager", "Cashier"];
      const createdRoles = {};

      for (const roleName of defaultRoleNames) {
        const [r] = await tx.insert(roles).values({
          businessId: newBusiness.id,
          name: roleName
        }).returning();
        createdRoles[roleName.toLowerCase()] = r.id;
      }

      // 3. Seed Permissions and Link to Super Admin
      for (const permName of REQUIRED_PERMISSIONS) {
        const [p] = await tx.insert(permissions).values({
          businessId: newBusiness.id,
          name: permName
        }).returning();

        // Grant ALL to Super Admin
        await tx.insert(rolePermissions).values({
          roleId: createdRoles["super admin"],
          permissionId: p.id
        });
      }

      // 4. Create Owner (User)
      const hashedPassword = await bcrypt.hash(password, 10);
      const [newOwner] = await tx.insert(users).values({
        businessId: newBusiness.id,
        name,
        email,
        passwordHash: hashedPassword
      }).returning();

      // 5. Assign Super Admin Role to Owner
      await tx.insert(userRoles).values({
        userId: newOwner.id,
        roleId: createdRoles["super admin"]
      });

      return { businessId: newBusiness.id, userId: newOwner.id };
    });

    // Log Activity
    await logActivity({
      userId: redirectData.userId,
      businessId: redirectData.businessId,
      userName: name,
      userRole: ["Super Admin"],
      action: 'CREATE',
      module: 'AUTH',
      details: `New business registered: ${businessName}`,
      ipAddress: req.ip
    });

    res.status(201).json({ message: "Registration successful. Please login." });

  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: err.message });
  }
};
