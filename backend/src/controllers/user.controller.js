const pool = require("../config/db");
const bcrypt = require("bcrypt");

// Get all users
exports.getAllUsers = async (req, res) => {
    try {
        const usersRes = await pool.query(`
      SELECT u.id, u.name, u.email, u.created_at, 
             COALESCE(json_agg(r.name) FILTER (WHERE r.name IS NOT NULL), '[]') as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON r.id = ur.role_id
      GROUP BY u.id
      ORDER BY u.id DESC
    `);
        res.json(usersRes.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Create a new user with roles
exports.createUser = async (req, res) => {
    try {
        const { name, email, password, roles } = req.body; // roles should be an array of role_ids or role names
        if (!name || !email || !password) {
            return res.status(400).json({ error: "Name, email and password are required" });
        }

        // Check if email already exists
        const emailExists = await pool.query("SELECT id FROM users WHERE email=$1", [email]);
        if (emailExists.rowCount > 0) {
            return res.status(400).json({ error: "Email already registered" });
        }

        const hash = await bcrypt.hash(password, 10);
        const createdUser = await pool.query(
            "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, created_at",
            [name, email, hash]
        );

        const userId = createdUser.rows[0].id;

        // Insert roles if provided
        if (roles && Array.isArray(roles) && roles.length > 0) {
            for (let roleId of roles) {
                await pool.query(
                    "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
                    [userId, roleId]
                );
            }
        }

        res.status(201).json(createdUser.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update an existing user
exports.updateUser = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { name, email, password, roleId } = req.body;

        if (!name || !email) {
            return res.status(400).json({ error: "Name and email are required" });
        }

        const emailExists = await pool.query("SELECT id FROM users WHERE email=$1 AND id != $2", [email, id]);
        if (emailExists.rowCount > 0) {
            return res.status(400).json({ error: "Email is already in use by another account" });
        }

        await client.query('BEGIN');

        let updateQuery = "UPDATE users SET name=$1, email=$2";
        let queryParams = [name, email];
        let paramIndex = 3;

        // Optionally update password if provided
        if (password) {
            const hash = await bcrypt.hash(password, 10);
            updateQuery += `, password_hash=$${paramIndex}`;
            queryParams.push(hash);
            paramIndex++;
        }

        updateQuery += ` WHERE id=$${paramIndex} RETURNING id, name, email`;
        queryParams.push(id);

        const updatedUser = await client.query(updateQuery, queryParams);

        if (updatedUser.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: "User not found" });
        }

        // Handle role update
        if (roleId) {
            // Drop existing roles and recreate
            await client.query("DELETE FROM user_roles WHERE user_id=$1", [id]);
            await client.query("INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)", [id, roleId]);
        }

        await client.query('COMMIT');

        res.json(updatedUser.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
};

// Delete a user
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Optional: protect admin from deletion here if needed
        const theUser = await pool.query("SELECT id FROM users WHERE id=$1", [id]);
        if (theUser.rowCount === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        await pool.query("DELETE FROM users WHERE id=$1", [id]);
        res.json({ message: "User deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
