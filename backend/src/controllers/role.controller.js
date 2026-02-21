const pool = require("../config/db");

// Get all roles
exports.getAllRoles = async (req, res) => {
    try {
        const roles = await pool.query("SELECT * FROM roles ORDER BY id ASC");
        res.json(roles.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Create a simple role
exports.createRole = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: "Role name is required" });

        // Ensure role doesn't exist
        const exists = await pool.query("SELECT id FROM roles WHERE name=$1", [name]);
        if (exists.rowCount > 0) {
            return res.status(400).json({ error: "Role already exists" });
        }

        const created = await pool.query(
            "INSERT INTO roles (name) VALUES ($1) RETURNING *",
            [name]
        );

        res.status(201).json(created.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update a role
exports.updateRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!name) return res.status(400).json({ error: "Role name is required" });

        // Ensure it's not conflicting with another role's name
        const exists = await pool.query("SELECT id FROM roles WHERE name=$1 AND id != $2", [name, id]);
        if (exists.rowCount > 0) {
            return res.status(400).json({ error: "Another role with this name already exists" });
        }

        const updated = await pool.query(
            "UPDATE roles SET name=$1 WHERE id=$2 RETURNING *",
            [name, id]
        );

        if (updated.rowCount === 0) {
            return res.status(404).json({ error: "Role not found" });
        }

        res.json(updated.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete a role
exports.deleteRole = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if role is assigned to any users before deleting
        const inUse = await pool.query("SELECT * FROM user_roles WHERE role_id=$1", [id]);
        if (inUse.rowCount > 0) {
            return res.status(400).json({ error: "Role cannot be deleted while assigned to users" });
        }

        const deleted = await pool.query("DELETE FROM roles WHERE id=$1 RETURNING *", [id]);

        if (deleted.rowCount === 0) {
            return res.status(404).json({ error: "Role not found" });
        }

        res.json({ message: "Role deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get all available system permissions
exports.getAllPermissions = async (req, res) => {
    try {
        const perms = await pool.query("SELECT * FROM permissions ORDER BY id ASC");
        res.json(perms.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get permissions for a specific role
exports.getRolePermissions = async (req, res) => {
    try {
        const { id } = req.params;
        const perms = await pool.query("SELECT permission_id FROM role_permissions WHERE role_id=$1", [id]);
        const permIds = perms.rows.map(r => r.permission_id);
        res.json(permIds);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update permissions for a specific role
exports.updateRolePermissions = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { permissions } = req.body; // Array of permission IDs

        await client.query('BEGIN');

        // Remove old permissions map
        await client.query("DELETE FROM role_permissions WHERE role_id=$1", [id]);

        // Insert new permissions maps
        if (permissions && Array.isArray(permissions) && permissions.length > 0) {
            for (const permId of permissions) {
                await client.query(
                    "INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)",
                    [id, permId]
                );
            }
        }

        await client.query('COMMIT');
        res.json({ message: "Permissions updated successfully" });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
};
