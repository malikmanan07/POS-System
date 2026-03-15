require("dotenv").config();
const pool = require("../config/db");
const bcrypt = require("bcrypt");
const { sql, eq } = require("drizzle-orm");
const {
    users,
    roles,
    userRoles,
    permissions,
    rolePermissions,
    settings,
    businesses
} = require("./schema");

const db = pool.db;

async function seed() {
    console.log("🌱 Starting database seeding...");

    try {
        // 0. Ensure Default Business
        console.log("Ensuring default business...");
        let [business] = await db.select().from(businesses).where(eq(businesses.name, "Default Business")).limit(1);
        if (!business) {
            [business] = await db.insert(businesses).values({ name: "Default Business" }).returning();
            await db.update(businesses).set({ tenantId: business.id }).where(eq(businesses.id, business.id));
            business.tenantId = business.id;
        }

        const roleNames = ['super admin', 'admin', 'cashier'];
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
            "system_settings",
            "manage_inventory",
            "view_activity_logs",
            "manage_branches"
        ];

        // 1. Ensure Roles
        console.log("Creating roles...");
        const roleIds = {};
        for (const name of roleNames) {
            const res = await db.insert(roles)
                .values({ name, businessId: business.id })
                .onConflictDoNothing()
                .returning({ id: roles.id });

            if (res.length > 0) {
                roleIds[name] = res[0].id;
            } else {
                const [existing] = await db.select().from(roles).where(and(eq(roles.name, name), eq(roles.businessId, business.id))).limit(1);
                roleIds[name] = existing.id;
            }
        }

        // 2. Ensure Permissions
        console.log("Creating permissions...");
        const permIds = {};
        for (const name of allPerms) {
            const res = await db.insert(permissions)
                .values({ name, businessId: business.id })
                .onConflictDoNothing()
                .returning({ id: permissions.id });

            if (res.length > 0) {
                permIds[name] = res[0].id;
            } else {
                const [existing] = await db.select().from(permissions).where(and(eq(permissions.name, name), eq(permissions.businessId, business.id))).limit(1);
                permIds[name] = existing.id;
            }
        }

        // 3. Grant Permissions to Super Admin (EVERYTHING)
        console.log("Granting permissions to Super Admin...");
        for (const perm of allPerms) {
            await db.insert(rolePermissions)
                .values({ roleId: roleIds['super admin'], permissionId: permIds[perm] })
                .onConflictDoNothing();
        }

        // 4. Grant Permissions to Admin
        console.log("Granting permissions to Admin...");
        const adminExcluded = ["manage_roles", "system_settings"];
        const adminPerms = allPerms.filter(p => !adminExcluded.includes(p));
        for (const perm of adminPerms) {
            await db.insert(rolePermissions)
                .values({ roleId: roleIds['admin'], permissionId: permIds[perm] })
                .onConflictDoNothing();
        }

        // 5. Grant Permissions to Cashier
        console.log("Granting permissions to Cashier...");
        const cashierPerms = ["view_sales", "create_sale"];
        for (const perm of cashierPerms) {
            await db.insert(rolePermissions)
                .values({ roleId: roleIds['cashier'], permissionId: permIds[perm] })
                .onConflictDoNothing();
        }

        // 6. Default Settings
        console.log("Initializing default settings...");
        const defaultSettings = [
            { key: 'business', value: { storeName: 'My POS System', address: '', phone: '', email: '', currency: 'USD' } },
            { key: 'tax', value: { taxName: 'GST', taxRate: 0, enableTax: false } },
            { key: 'invoice', value: { prefix: 'INV-', suffix: '', footerNote: 'Thank you!' } },
            { key: 'payment', value: { acceptedMethods: ['Cash'], defaultMethod: 'Cash', enableChangeCalculation: true } }
        ];

        for (const s of defaultSettings) {
            await db.insert(settings)
                .values({ businessId: business.id, key: s.key, value: s.value })
                .onConflictDoNothing();
        }

        // 7. Create Default Super Admin (PROFESSIONAL POS FLOW)
        console.log("Checking for Super Admin user...");
        const adminEmail = 'admin@pos.com';
        const adminPassword = 'admin123';

        const [existingAdmin] = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);

        if (!existingAdmin) {
            console.log(`Creating default Super Admin: ${adminEmail}`);
            const hashedPassword = await bcrypt.hash(adminPassword, 10);

            const [newAdmin] = await db.insert(users)
                .values({
                    businessId: business.id,
                    tenantId: business.id,
                    name: 'Super Admin',
                    email: adminEmail,
                    passwordHash: hashedPassword,
                })
                .returning();

            await db.insert(userRoles)
                .values({
                    userId: newAdmin.id,
                    roleId: roleIds['super admin'],
                });

            console.log("-----------------------------------------");
            console.log("🚀 DEFAULT ADMIN CREATED");
            console.log(`📧 Email: ${adminEmail}`);
            console.log(`🔑 Password: ${adminPassword}`);
            console.log("-----------------------------------------");
        } else {
            console.log("ℹ️ Super Admin already exists.");
        }

        console.log("✅ Seeding completed successfully.");
        process.exit(0);
    } catch (err) {
        console.error("❌ Seeding failed:", err.message);
        process.exit(1);
    }
}

seed();
