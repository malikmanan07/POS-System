const pool = require('../src/config/db');
const { sql } = require('drizzle-orm');
const dotenv = require('dotenv');
dotenv.config();

async function clearUsers() {
    try {
        console.log("Cleaning up users...");
        // Disable foreign keys temporarily if needed, or delete in order
        // For Postgres, we can use TRUNCATE CASCADE if we want to wipe everything 
        // linked to users, but let's be safer and just delete users.

        await pool.db.execute(sql`TRUNCATE TABLE users CASCADE`);
        console.log("All users deleted successfully.");

    } catch (err) {
        console.error("Error deleting users:", err.message);
    } finally {
        process.exit();
    }
}

clearUsers();
