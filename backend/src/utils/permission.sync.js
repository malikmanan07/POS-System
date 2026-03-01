const pool = require("../config/db");
const { sql, eq } = require("drizzle-orm");
const { permissions, rolePermissions, roles } = require("../db/schema");

const db = pool.db;

/**
 * List of ALL permissions in the system.
 * Add new page/feature permissions here, and they will automatically 
 * be synced to the database and granted to Super Admin.
 */
const REQUIRED_PERMISSIONS = [
    "view_dashboard",
    "manage_products",
    "manage_categories",
    "manage_customers",
    "view_sales",
    "create_sale",
    "manage_users",
    "view_reports", // <--- Make sure this is here!
    "manage_roles",
    "system_settings",
    "manage_inventory",
    "manage_suppliers", // <-- New permission
    "manage_discounts", // <-- Discount permission
    "view_activity_logs"
];

exports.syncPermissions = async () => {
    try {
        console.log("🔄 Syncing system permissions...");

        // 1. Get or Create Super Admin Role
        let [superAdminRole] = await db.select().from(roles).where(eq(roles.name, 'super admin')).limit(1);
        if (!superAdminRole) {
            [superAdminRole] = await db.insert(roles).values({ name: 'super admin' }).returning();
        }

        for (const name of REQUIRED_PERMISSIONS) {
            // 2. Ensure permission exists
            let [perm] = await db.select().from(permissions).where(eq(permissions.name, name)).limit(1);

            if (!perm) {
                console.log(`➕ Adding missing permission: ${name}`);
                [perm] = await db.insert(permissions).values({ name }).returning();
            }

            // 3. Ensure Super Admin has this permission
            if (superAdminRole && perm) {
                await db.insert(rolePermissions)
                    .values({
                        roleId: superAdminRole.id,
                        permissionId: perm.id
                    })
                    .onConflictDoNothing();
            }
        }

        console.log("✅ Permissions synced successfully.");
    } catch (err) {
        console.error("❌ Permission sync failed:", err.message);
    }
};
