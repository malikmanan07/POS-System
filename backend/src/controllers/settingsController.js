const pool = require("../config/db");

// Get all settings or specific key
exports.getSettings = async (req, res) => {
    try {
        const { key } = req.params;
        console.log("Fetching settings for key:", key || "ALL");

        if (key) {
            const result = await pool.query("SELECT * FROM settings WHERE key = $1", [key]);
            if (result.rows.length === 0) return res.status(404).json({ error: "Setting not found" });
            return res.json(result.rows[0]);
        }

        const result = await pool.query("SELECT * FROM settings");
        const settingsMap = {};
        result.rows.forEach(row => {
            settingsMap[row.key] = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
        });
        console.log("Fetched settingsMap:", settingsMap);
        res.json(settingsMap);
    } catch (err) {
        console.error("Error in getSettings:", err.message);
        res.status(500).json({ error: err.message });
    }
};

// Update or create setting
exports.updateSetting = async (req, res) => {
    try {
        const { key } = req.params;
        const value = req.body;
        console.log(`Updating setting for key: ${key}`, value);

        const result = await pool.query(
            "INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP RETURNING *",
            [key, JSON.stringify(value)]
        );

        console.log("Update result:", result.rows[0]);
        res.json({ message: "Setting updated successfully", data: result.rows[0] });
    } catch (err) {
        console.error("Error in updateSetting:", err.message);
        res.status(500).json({ error: err.message });
    }
};
