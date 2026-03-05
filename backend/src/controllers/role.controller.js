const pool = require("../config/db");
const { eq, asc, sql, and, ne } = require("drizzle-orm");
const { roles, userRoles, permissions, rolePermissions } = require("../db/schema");
const { logActivity } = require("../utils/logger");

const db = pool.db;

// Get all roles
exports.getAllRoles = async (req, res) => {
    try {
        const result = await db.select()
            .from(roles)
            .where(eq(roles.businessId, req.businessId))
            .orderBy(asc(roles.id));
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Create a simple role
exports.createRole = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: "Role name is required" });

        // Ensure role doesn't exist within the same business
        const [exists] = await db.select({ id: roles.id })
            .from(roles)
            .where(and(
                eq(roles.name, name),
                eq(roles.businessId, req.businessId)
            ))
            .limit(1);
        if (exists) {
            return res.status(400).json({ error: "Role already exists" });
        }

        const [created] = await db.insert(roles).values({
            name,
            businessId: req.businessId
        }).returning();

        // Activity Log
        await logActivity({
            userId: req.user?.id,
            businessId: req.businessId,
            userName: req.user?.name,
            userRole: req.user?.roles,
            action: 'CREATE',
            module: 'ROLES',
            details: `${req.user?.roles?.[0] || 'User'} (${req.user?.name}) created new role: ${name}`,
            ipAddress: req.ip
        });

        res.status(201).json(created);
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
        const [exists] = await db.select({ id: roles.id })
            .from(roles)
            .where(and(
                eq(roles.name, name),
                ne(roles.id, id),
                eq(roles.businessId, req.businessId)
            ))
            .limit(1);

        if (exists) {
            return res.status(400).json({ error: "Another role with this name already exists" });
        }

        const [updated] = await db.update(roles)
            .set({ name, updatedAt: new Date() })
            .where(and(
                eq(roles.id, id),
                eq(roles.businessId, req.businessId)
            ))
            .returning();

        if (!updated) {
            return res.status(404).json({ error: "Role not found" });
        }

        // Activity Log
        await logActivity({
            userId: req.user?.id,
            businessId: req.businessId,
            userName: req.user?.name,
            userRole: req.user?.roles,
            action: 'UPDATE',
            module: 'ROLES',
            details: `${req.user?.roles?.[0] || 'User'} (${req.user?.name}) updated role: ${name} (ID: ${id})`,
            ipAddress: req.ip
        });

        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete a role
exports.deleteRole = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if role is assigned to any users before deleting
        const [inUse] = await db.select({ id: userRoles.userId }).from(userRoles).where(eq(userRoles.roleId, id)).limit(1);
        if (inUse) {
            return res.status(400).json({ error: "Role cannot be deleted while assigned to users" });
        }

        const [deleted] = await db.delete(roles).where(eq(roles.id, id)).returning();
        if (!deleted) {
            return res.status(404).json({ error: "Role not found" });
        }

        // Activity Log
        await logActivity({
            userId: req.user?.id,
            businessId: req.businessId,
            userName: req.user?.name,
            userRole: req.user?.roles,
            action: 'DELETE',
            module: 'ROLES',
            details: `${req.user?.roles?.[0] || 'User'} (${req.user?.name}) deleted role: ${deleted.name} (ID: ${id})`,
            ipAddress: req.ip
        });

        res.json({ message: "Role deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get all available system permissions
exports.getAllPermissions = async (req, res) => {
    try {
        const result = await db.select()
            .from(permissions)
            .where(eq(permissions.businessId, req.businessId))
            .orderBy(asc(permissions.id));
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get permissions for a specific role
exports.getRolePermissions = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.select({ permissionId: rolePermissions.permissionId })
            .from(rolePermissions)
            .innerJoin(roles, eq(rolePermissions.roleId, roles.id))
            .where(and(
                eq(rolePermissions.roleId, id),
                eq(roles.businessId, req.businessId)
            ));

        const permIds = result.map(r => r.permissionId);
        res.json(permIds);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update permissions for a specific role
exports.updateRolePermissions = async (req, res) => {
    try {
        const { id } = req.params;
        const { permissions: permIds } = req.body; // Array of permission IDs

        await db.transaction(async (tx) => {
            // Ensure the role belongs to this business
            const [role] = await tx.select().from(roles).where(and(eq(roles.id, id), eq(roles.businessId, req.businessId))).limit(1);
            if (!role) throw new Error("Role not found");

            await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, id));

            if (permIds && Array.isArray(permIds) && permIds.length > 0) {
                // Also ensure those permissions belong to this business
                const validPerms = await tx.select({ id: permissions.id })
                    .from(permissions)
                    .where(and(
                        sql`${permissions.id} IN (${sql.join(permIds, sql`, `)})`,
                        eq(permissions.businessId, req.businessId)
                    ));
                const validIds = validPerms.map(p => p.id);

                if (validIds.length > 0) {
                    await tx.insert(rolePermissions).values(
                        validIds.map(pid => ({ roleId: id, permissionId: pid }))
                    );
                }
            }
        });

        const [roleObj] = await db.select({ name: roles.name })
            .from(roles)
            .where(and(
                eq(roles.id, id),
                eq(roles.businessId, req.businessId)
            ))
            .limit(1);

        // Activity Log
        await logActivity({
            userId: req.user?.id,
            businessId: req.businessId,
            userName: req.user?.name,
            userRole: req.user?.roles,
            action: 'UPDATE',
            module: 'ACCESS',
            details: `${req.user?.roles?.[0] || 'User'} (${req.user?.name}) updated permissions for role: ${roleObj?.name || 'ID ' + id}`,
            ipAddress: req.ip
        });

        res.json({ message: "Permissions updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
