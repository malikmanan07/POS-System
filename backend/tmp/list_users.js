const pool = require('../src/config/db');
const { users } = require('../src/db/schema');

async function listUsers() {
    try {
        const allUsers = await pool.db.select().from(users);
        console.log(JSON.stringify(allUsers, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

listUsers();
