const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function nukeDatabase() {
    const client = await pool.connect();
    try {
        console.log("NUKING DATABASE...");
        // This will delete everything in cascade
        await client.query('TRUNCATE TABLE businesses CASCADE');
        console.log("Database cleared! (Businesses and all related data deleted)");
    } catch (err) {
        console.error("Error nuking database:", err.message);
    } finally {
        client.release();
        process.exit();
    }
}

nukeDatabase();
