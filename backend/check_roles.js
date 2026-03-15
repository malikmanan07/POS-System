const pool = require("./src/config/db");
const { roles } = require("./src/db/schema");
require("dotenv").config();

async function checkRoles() {
    try {
        const res = await pool.db.select().from(roles);
        console.log("Roles in DB:", res.map(r => r.name));
    } catch (err) {
        console.error("Query failed:", err.message);
    } finally {
        process.exit();
    }
}

checkRoles();
