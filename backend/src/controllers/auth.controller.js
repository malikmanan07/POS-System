const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
<<<<<<< HEAD
const { eq, sql } = require("drizzle-orm");
const { users, userRoles, roles, rolePermissions, permissions, businesses } = require("../db/schema");
=======
const { eq, sql, and } = require("drizzle-orm");
const { users, userRoles, roles, rolePermissions, permissions, businesses, userBranches } = require("../db/schema");
>>>>>>> 790210fce64f26269098e10d3d46cfa0442c96eb
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

<<<<<<< HEAD
=======
/**
 * Helper: get accessible branches for a user
 */
async function getAccessibleBranches(userId, userEmail, rolesList, tenantId) {
  const isSuperAdmin = rolesList.some(r => r.toLowerCase() === 'super admin');

  if (isSuperAdmin) {
    // Super Admins see ALL businesses in their TENANT group
    return await db.select({ id: businesses.id, name: businesses.name })
      .from(businesses)
      .where(eq(businesses.tenantId, tenantId));
  }

  // Admins see assigned branches from userBranches table + their home business
  const assigned = await db
    .select({ id: businesses.id, name: businesses.name })
    .from(businesses)
    .innerJoin(users, eq(users.businessId, businesses.id))
    .where(eq(users.id, userId)); // Home business

  const extra = await db
    .select({ id: businesses.id, name: businesses.name })
    .from(userBranches)
    .innerJoin(businesses, eq(userBranches.businessId, businesses.id))
    .where(eq(userBranches.userId, userId));

  // Merge and deduplicate
  const all = [...assigned, ...extra];
  const unique = Array.from(new Map(all.map(b => [b.id, b])).values());
  return unique;
}

>>>>>>> 790210fce64f26269098e10d3d46cfa0442c96eb

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
<<<<<<< HEAD
=======
        tenantId: users.tenantId,
>>>>>>> 790210fce64f26269098e10d3d46cfa0442c96eb
        name: users.name,
        email: users.email,
        passwordHash: users.passwordHash,
        isSuspended: businesses.isSuspended,
      })
      .from(users)
      .innerJoin(businesses, eq(users.businessId, businesses.id))
      .where(eq(users.email, email))
      .limit(1);

    if (!user)
      return res.status(401).json({ error: "Invalid credentials" });

    if (user.isSuspended) {
      return res.status(403).json({ error: "Your account has been suspended. Please contact support." });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const rolesList = await getUserRoles(user.id);
    const permissionsList = await getUserPermissions(user.id);
<<<<<<< HEAD
=======
    const branchesList = await getAccessibleBranches(user.id, user.email, rolesList, user.tenantId);
>>>>>>> 790210fce64f26269098e10d3d46cfa0442c96eb

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: "JWT_SECRET not set in .env" });
    }

    const token = jwt.sign(
<<<<<<< HEAD
      { id: user.id, businessId: user.businessId, name: user.name, email: user.email, roles: rolesList },
=======
      {
        id: user.id,
        businessId: user.businessId,
        tenantId: user.tenantId,
        name: user.name,
        email: user.email,
        roles: rolesList
      },
>>>>>>> 790210fce64f26269098e10d3d46cfa0442c96eb
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
<<<<<<< HEAD
=======
      branches: branchesList
>>>>>>> 790210fce64f26269098e10d3d46cfa0442c96eb
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

<<<<<<< HEAD
=======
      // 1.1 Set tenantId for the business (it's the first business, so it's the root)
      await tx.update(businesses).set({ tenantId: newBusiness.id }).where(eq(businesses.id, newBusiness.id));
      newBusiness.tenantId = newBusiness.id;

>>>>>>> 790210fce64f26269098e10d3d46cfa0442c96eb
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
<<<<<<< HEAD
=======
        tenantId: newBusiness.id, // Inherit from business
>>>>>>> 790210fce64f26269098e10d3d46cfa0442c96eb
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
<<<<<<< HEAD
=======

>>>>>>> 790210fce64f26269098e10d3d46cfa0442c96eb
