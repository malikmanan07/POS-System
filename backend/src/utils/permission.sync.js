const pool = require("../config/db");
const { sql, eq, and } = require("drizzle-orm");
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
    "manage_discounts",
    "manage_shifts",
    "view_activity_logs"
];

exports.REQUIRED_PERMISSIONS = REQUIRED_PERMISSIONS;

exports.syncPermissions = async () => {
    try {
        console.log("🔄 Syncing system permissions for all businesses...");

        const allBusinesses = await db.select().from(require("../db/schema").businesses);

        for (const business of allBusinesses) {
            // 1. Get or Create Super Admin Role for this business
            let [superAdminRole] = await db.select().from(roles)
                .where(and(eq(roles.name, 'Super Admin'), eq(roles.businessId, business.id)))
                .limit(1);

            if (!superAdminRole) {
                [superAdminRole] = await db.insert(roles).values({
                    name: 'Super Admin',
                    businessId: business.id
                }).returning();
            }

            for (const name of REQUIRED_PERMISSIONS) {
                // 2. Ensure permission exists for this business
                let [perm] = await db.select().from(permissions)
                    .where(and(eq(permissions.name, name), eq(permissions.businessId, business.id)))
                    .limit(1);

                if (!perm) {
                    console.log(`➕ [Bus ${business.id}] Adding missing permission: ${name}`);
                    [perm] = await db.insert(permissions).values({
                        name,
                        businessId: business.id
                    }).returning();
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
        }

        console.log(`✅ Permissions synced successfully for ${allBusinesses.length} businesses.`);
    } catch (err) {
        console.error("❌ Permission sync failed:", err.message);
    }
};
