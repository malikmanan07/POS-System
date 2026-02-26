require('dotenv').config();
const pool = require('./src/config/db');

async function sync() {
    try {
        console.log("Syncing permissions...");

        // 1. Ensure manage_inventory exists
        await pool.query("INSERT INTO permissions (name) VALUES ('manage_inventory') ON CONFLICT (name) DO NOTHING");
        const permRes = await pool.query("SELECT id FROM permissions WHERE name = 'manage_inventory'");
        const permId = permRes.rows[0].id;

        // 2. Get role IDs
        const rolesRes = await pool.query("SELECT id, name FROM roles");
        const roles = rolesRes.rows;

        for (const role of roles) {
            if (role.name.toLowerCase() === 'super admin' || role.name.toLowerCase() === 'admin') {
                console.log(`Granting manage_inventory to ${role.name}...`);
                await pool.query(
                    "INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
                    [role.id, permId]
                );
            }
        }

        console.log("Successfully synced permissions.");
    } catch (err) {
        console.error("Sync failed:", err.message);
    } finally {
        await pool.end();
    }
}

sync();
