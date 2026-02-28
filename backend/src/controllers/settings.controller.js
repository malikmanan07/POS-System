const pool = require("../config/db");
const { eq, sql } = require("drizzle-orm");
const { settings } = require("../db/schema");

const db = pool.db;

// Get all settings or specific key
exports.getSettings = async (req, res) => {
    try {
        const { key } = req.params;

        if (key) {
            const [setting] = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
            if (!setting) return res.status(404).json({ error: "Setting not found" });
            return res.json(setting);
        }

        const result = await db.select().from(settings);
        const settingsMap = {};
        result.forEach(row => {
            settingsMap[row.key] = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
        });
        res.json(settingsMap);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update or create setting
exports.updateSetting = async (req, res) => {
    try {
        const { key } = req.params;
        let value = req.body;

        // Restriction: Only Super Admin can update settings
        const userRoles = req.user?.roles || [];
        if (!userRoles.some(r => r.toLowerCase() === "super admin")) {
            return res.status(403).json({ error: "Only Super Admin can update system settings" });
        }

        // Force current user's email if updating business settings
        if (key === "business" && req.user?.email) {
            value = { ...value, email: req.user.email };
        }

        const [result] = await db.insert(settings)
            .values({ key, value })
            .onConflictDoUpdate({
                target: settings.key,
                set: { value, updatedAt: new Date() }
            })
            .returning();

        res.json({ message: "Setting updated successfully", data: result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
