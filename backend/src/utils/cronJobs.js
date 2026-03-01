const cron = require("node-cron");
const pool = require("../config/db");
const { activityLogs } = require("../db/schema");
const { lt, or, and, sql, inArray } = require("drizzle-orm");

const db = pool.db;

/**
 * Log Retention Policy:
 * 1. Login/Logout logs: Delete after 30 days
 * 2. Other logs (Sales, Stock, etc.): Delete after 90 days
 */
const cleanupActivityLogs = async () => {
    try {
        console.log("🧹 Running Activity Log Cleanup Job...");

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        // 1. Delete Login/Logout logs older than 30 days
        const loginLogoutDeleted = await db.delete(activityLogs)
            .where(
                and(
                    inArray(activityLogs.action, ["LOGIN", "LOGOUT"]),
                    lt(activityLogs.createdAt, thirtyDaysAgo)
                )
            )
            .returning();

        // 2. Delete all other logs older than 90 days
        const othersDeleted = await db.delete(activityLogs)
            .where(
                and(
                    sql`NOT (${activityLogs.action} IN ('LOGIN', 'LOGOUT'))`,
                    lt(activityLogs.createdAt, ninetyDaysAgo)
                )
            )
            .returning();

        console.log(`✅ Cleanup Complete:`);
        console.log(`   - Login/Logout logs removed: ${loginLogoutDeleted.length}`);
        console.log(`   - Other module logs removed: ${othersDeleted.length}`);

    } catch (err) {
        console.error("❌ Activity Log Cleanup Failed:", err.message);
    }
};

// Schedule Job: Run every day at 00:00 (Midnight)
const initCronJobs = () => {
    cron.schedule("0 0 * * *", () => {
        cleanupActivityLogs();
    });

    // Optionally run once on startup
    // cleanupActivityLogs();

    console.log("⏰ Cron Jobs Initialized (Daily at 00:00)");
};

module.exports = { initCronJobs };
