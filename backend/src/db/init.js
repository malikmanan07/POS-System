const pool = require("../config/db");

async function initDB() {
  try {
    // 1️⃣ USERS
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(120) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2️⃣ ROLES
    await pool.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL
      );
    `);

    // 3️⃣ PERMISSIONS
    await pool.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL
      );
    `);

    // 4️⃣ ROLE_PERMISSIONS
    await pool.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
        permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
        PRIMARY KEY (role_id, permission_id)
      );
    `);

    // 5️⃣ USER_ROLES
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_roles (
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
        PRIMARY KEY (user_id, role_id)
      );
    `);

    // 6️⃣ CATEGORIES
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 7️⃣ CUSTOMERS
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        phone VARCHAR(30) UNIQUE,
        email VARCHAR(120),
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 8️⃣ PRODUCTS
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        sku VARCHAR(50) UNIQUE,
        category_id INTEGER REFERENCES categories(id),
        cost_price NUMERIC(10,2) NOT NULL DEFAULT 0,
        price NUMERIC(10,2) NOT NULL DEFAULT 0,
        stock INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 9️⃣ SALES
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sales (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        customer_id INTEGER REFERENCES customers(id),
        subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
        discount NUMERIC(10,2) NOT NULL DEFAULT 0,
        tax NUMERIC(10,2) NOT NULL DEFAULT 0,
        total NUMERIC(10,2) NOT NULL DEFAULT 0,
        payment_method VARCHAR(20) NOT NULL DEFAULT 'cash',
        paid_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
        change_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 10️⃣ SALE_ITEMS
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sale_items (
        id SERIAL PRIMARY KEY,
        sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id),
        qty INTEGER NOT NULL,
        price NUMERIC(10,2) NOT NULL,
        line_total NUMERIC(10,2) NOT NULL
      );
    `);

    // 11️⃣ STOCK_MOVEMENTS
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stock_movements (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id),
        type VARCHAR(10) NOT NULL,
        qty INTEGER NOT NULL,
        reference VARCHAR(50),
        note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 🔟 Seed Roles & Permissions if they don't exist
    await seedData();

    console.log("✅ DB schema and seed data initialized successfully.");
  } catch (err) {
    console.error("❌ DB init failed:", err.message);
  }
}

async function seedData() {
  const roles = ['super admin', 'admin', 'cashier'];
  const allPerms = [
    "view_dashboard",
    "manage_products",
    "manage_categories",
    "manage_customers",
    "view_sales",
    "create_sale",
    "manage_users",
    "view_reports",
    "manage_roles",
    "system_settings"
  ];

  // 1. Ensure Roles
  const roleIds = {};
  for (const role of roles) {
    const res = await pool.query("INSERT INTO roles (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name RETURNING id", [role]);
    roleIds[role] = res.rows[0].id;
  }

  // 2. Ensure Permissions
  const permIds = {};
  for (const perm of allPerms) {
    const res = await pool.query("INSERT INTO permissions (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name RETURNING id", [perm]);
    permIds[perm] = res.rows[0].id;
  }

  // 3. Grant Permissions to Super Admin (EVERYTHING)
  for (const perm of allPerms) {
    await pool.query("INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [roleIds['super admin'], permIds[perm]]);
  }

  // 4. Grant Permissions to Admin (Almost everything except super admin only perms)
  const adminExcluded = ["manage_roles", "system_settings"];
  const adminPerms = allPerms.filter(p => !adminExcluded.includes(p));
  for (const perm of adminPerms) {
    await pool.query("INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [roleIds['admin'], permIds[perm]]);
  }

  // 5. Grant Permissions to Cashier (Limited)
  const cashierPerms = ["view_sales", "create_sale"];
  for (const perm of cashierPerms) {
    await pool.query("INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [roleIds['cashier'], permIds[perm]]);
  }
}

module.exports = initDB;