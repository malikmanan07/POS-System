require('dotenv').config();
const pool = require('./src/config/db');

async function check() {
    try {
        const roles = await pool.query("SELECT id FROM roles WHERE name = 'super admin'");
        if (roles.rowCount === 0) {
            console.log("Super Admin role NOT FOUND");
            return;
        }
        const roleId = roles.rows[0].id;

        const perms = await pool.query(`
      SELECT p.name 
      FROM permissions p 
      JOIN role_permissions rp ON p.id = rp.permission_id 
      WHERE rp.role_id = $1
    `, [roleId]);

        console.log("Current Permissions for Super Admin:");
        console.log(perms.rows.map(r => r.name));

        // Also check if manage_inventory exists at all
        const exists = await pool.query("SELECT id FROM permissions WHERE name = 'manage_inventory'");
        console.log("manage_inventory existence in permissions table:", exists.rowCount > 0);

    } catch (err) {
        console.error("Query failed:", err.message);
    } finally {
        await pool.end();
    }
}

check();
