const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

/**
 * Helper: create role if not exists, return role_id
 */
async function ensureRole(roleName) {
  const r = await pool.query("SELECT id FROM roles WHERE name=$1", [roleName]);
  if (r.rowCount > 0) return r.rows[0].id;

  const created = await pool.query(
    "INSERT INTO roles (name) VALUES ($1) RETURNING id",
    [roleName]
  );
  return created.rows[0].id;
}

/**
 * Helper: create permission if not exists, return permission_id
 */
async function ensurePermission(permName) {
  const p = await pool.query("SELECT id FROM permissions WHERE name=$1", [permName]);
  if (p.rowCount > 0) return p.rows[0].id;

  const created = await pool.query(
    "INSERT INTO permissions (name) VALUES ($1) RETURNING id",
    [permName]
  );
  return created.rows[0].id;
}

/**
 * Helper: attach permission to role (ignore duplicates)
 */
async function grantPermissionToRole(roleId, permId) {
  await pool.query(
    `INSERT INTO role_permissions (role_id, permission_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [roleId, permId]
  );
}

/**
 * Helper: attach role to user (ignore duplicates)
 */
async function assignRoleToUser(userId, roleId) {
  await pool.query(
    `INSERT INTO user_roles (user_id, role_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [userId, roleId]
  );
}

/**
 * Helper: get user roles
 */
async function getUserRoles(userId) {
  const rolesRes = await pool.query(
    `SELECT r.name
     FROM user_roles ur
     JOIN roles r ON r.id = ur.role_id
     WHERE ur.user_id = $1`,
    [userId]
  );
  return rolesRes.rows.map((r) => r.name);
}

/**
 * Helper: get user permissions
 */
async function getUserPermissions(userId) {
  const permsRes = await pool.query(
    `SELECT DISTINCT p.name
     FROM user_roles ur
     JOIN role_permissions rp ON rp.role_id = ur.role_id
     JOIN permissions p ON p.id = rp.permission_id
     WHERE ur.user_id = $1`,
    [userId]
  );
  return permsRes.rows.map((p) => p.name);
}

/**
 * DEV helper: seed default roles + permissions
 * You can expand this list later.
 */
async function seedDefaults() {
  // Roles
  const adminRoleId = await ensureRole("admin");
  const cashierRoleId = await ensureRole("cashier");

  // Permissions (you can add more later)
  const perms = [
    "view_dashboard",
    "manage_products",
    "manage_categories",
    "manage_customers",
    "view_sales",
    "create_sale",
    "manage_users",
  ];

  // Create permissions and attach to roles
  for (const perm of perms) {
    const permId = await ensurePermission(perm);

    // Admin gets everything
    await grantPermissionToRole(adminRoleId, permId);

    // Cashier limited permissions
    if (["view_sales", "create_sale"].includes(perm)) {
      await grantPermissionToRole(cashierRoleId, permId);
    }
  }

  return { adminRoleId, cashierRoleId };
}

/**
 * GET /api/auth/has-admin
 * returns { hasAdmin: true/false }
 */
exports.hasAdmin = async (req, res) => {
  try {
    const r = await pool.query("SELECT id FROM users LIMIT 1");
    res.json({ hasAdmin: r.rowCount > 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/auth/signup-admin
 * Only allowed when NO users exist (first time setup)
 */
exports.signupAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: "name, email, password required" });

    // if any user exists -> block public signup
    const any = await pool.query("SELECT id FROM users LIMIT 1");
    if (any.rowCount > 0) {
      return res.status(403).json({ error: "Admin already exists. Please login." });
    }

    // seed roles + permissions
    const { adminRoleId } = await seedDefaults();

    // create user
    const hash = await bcrypt.hash(password, 10);
    const createdUser = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [name, email, hash]
    );

    const user = createdUser.rows[0];

    // assign admin role
    await assignRoleToUser(user.id, adminRoleId);

    res.status(201).json({
      user: { id: user.id, name: user.name, email: user.email, roles: ["admin"] },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/auth/login
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "email and password are required" });

    const userRes = await pool.query(
      "SELECT id, name, email, password_hash FROM users WHERE email=$1",
      [email]
    );

    if (userRes.rowCount === 0)
      return res.status(401).json({ error: "Invalid credentials" });

    const user = userRes.rows[0];

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const roles = await getUserRoles(user.id);
    const permissions = await getUserPermissions(user.id);

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: "JWT_SECRET not set in .env" });
    }

    const token = jwt.sign(
      { id: user.id, roles },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, roles },
      permissions,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};