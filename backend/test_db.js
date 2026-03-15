const pool = require("./src/config/db");
const { users } = require("./src/db/schema");
require("dotenv").config();

async function checkUsers() {
    try {
        const res = await pool.db.select().from(users);
        console.log("Users in DB:", res.length);
        if (res.length > 0) {
            console.log("First user email:", res[0].email);
        }
    } catch (err) {
        console.error("Query failed:", err.message);
    } finally {
        process.exit();
    }
}

checkUsers();
