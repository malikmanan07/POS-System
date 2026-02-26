require('dotenv').config();
const pool = require('./src/config/db');

async function migrate() {
    try {
        await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS alert_quantity INTEGER DEFAULT 5");
        console.log("Successfully added alert_quantity column.");
    } catch (err) {
        console.error("Migration failed:", err.message);
    } finally {
        await pool.end();
    }
}

migrate();
