require('dotenv').config();
const pool = require('./src/config/db');

const permissionsList = [
    'view_dashboard',
    'manage_products',
    'manage_categories',
    'manage_customers',
    'view_sales',
    'manage_roles',
    'manage_users',
    'view_activity_logs',
    'view_reports',
    'manage_inventory',
    'manage_suppliers',
    'manage_discounts',
    'manage_shifts',
    'create_sale',
    'system_settings'
];

async function seed() {
    try {
        console.log("Starting Master Permissions Seed...");

        // 1. Ensure all permissions exist in the database
        for (const name of permissionsList) {
            await pool.query(
                "INSERT INTO permissions (name) VALUES ($1) ON CONFLICT (name) DO NOTHING",
                [name]
            );
        }
        console.log(`✅ Registered ${permissionsList.length} permissions in the database.`);

        // 2. Grant all permissions to Super Admin and Admin roles
        const rolesRes = await pool.query("SELECT id, name FROM roles");
        const roles = rolesRes.rows;

        for (const role of roles) {
            const roleName = role.name.toLowerCase();
            if (roleName === 'super admin' || roleName === 'admin') {
                console.log(`Granting all permissions to: ${role.name}...`);

                // Get all permission IDs
                const permsRes = await pool.query("SELECT id FROM permissions");
                const permIds = permsRes.rows;

                for (const perm of permIds) {
                    await pool.query(
                        "INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
                        [role.id, perm.id]
                    );
                }
            }
        }

        console.log("🚀 Master Seed completed successfully!");
    } catch (err) {
        console.error("❌ Seed failed:", err.message);
    } finally {
        await pool.end();
    }
}

seed();
