const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

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

    // create user
    const hash = await bcrypt.hash(password, 10);
    const createdUser = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [name, email, hash]
    );

    const user = createdUser.rows[0];

    // Assign 'super admin' role to first user
    const roleRes = await pool.query("SELECT id FROM roles WHERE LOWER(name) = 'super admin'");
    if (roleRes.rowCount > 0) {
      await pool.query(
        "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [user.id, roleRes.rows[0].id]
      );
    }

    res.status(201).json({
      user: { id: user.id, name: user.name, email: user.email, roles: ["super admin"] },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/auth/signup
 * General registration for staff
 */
exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: "name, email, password required" });

    const exists = await pool.query("SELECT id FROM users WHERE email=$1", [email]);
    if (exists.rowCount > 0) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const hash = await bcrypt.hash(password, 10);
    const createdUser = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [name, email, hash]
    );

    const user = createdUser.rows[0];

    // Default role for new signups is 'cashier'
    const roleRes = await pool.query("SELECT id FROM roles WHERE LOWER(name) = 'cashier'");
    if (roleRes.rowCount > 0) {
      await pool.query(
        "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [user.id, roleRes.rows[0].id]
      );
    }

    res.status(201).json({
      user: { id: user.id, name: user.name, email: user.email, roles: ["cashier"] },
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