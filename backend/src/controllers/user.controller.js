const pool = require("../config/db");
const bcrypt = require("bcrypt");
const { eq, sql, desc, notInArray, and } = require("drizzle-orm");
const { users, userRoles, roles, businesses, permissions, rolePermissions } = require("../db/schema");
const { logActivity } = require("../utils/logger");
const { REQUIRED_PERMISSIONS } = require("../utils/permission.sync");

const db = pool.db;

// Get all users
exports.getAllUsers = async (req, res) => {
    try {
        const result = await db.query.users.findMany({
            where: eq(users.tenantId, req.user.tenantId),
            with: {
                roles: {
                    with: {
                        role: true
                    }
                },
                branches: {
                    with: {
                        branch: true
                    }
                }
            },
            orderBy: [desc(users.id)]
        });

        const formatted = result.map(u => ({
            ...u,
            roles: u.roles.map(ur => ur.role),
            assignedBranches: u.branches?.map(ub => ub.branch) || []
        }));

        res.json(formatted);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Create a new user with roles
exports.createUser = async (req, res) => {
    try {
        const { name, email, password, role_ids } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: "Name, email and password are required" });
        }

        const [emailExists] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
        if (emailExists) {
            return res.status(400).json({ error: "Email already registered" });
        }

        const hash = await bcrypt.hash(password, 10);

        const [newUser] = await db.transaction(async (tx) => {
            const [createdUser] = await tx.insert(users)
                .values({
                    businessId: req.businessId,
                    tenantId: req.user.tenantId, // Inherit from creator
                    name,
                    email,
                    passwordHash: hash
                })
                .returning();

            if (role_ids && Array.isArray(role_ids) && role_ids.length > 0) {
                await tx.insert(userRoles).values(
                    role_ids.map(rid => ({ userId: createdUser.id, roleId: rid }))
                ).onConflictDoNothing();
            }

            if (req.body.branch_ids && Array.isArray(req.body.branch_ids)) {
                const { userBranches } = require("../db/schema");
                await tx.insert(userBranches).values(
                    req.body.branch_ids.map(bid => ({ userId: createdUser.id, businessId: bid }))
                ).onConflictDoNothing();
            }
            return [createdUser];
        });

        // Fetch role names for logging
        let roleNames = 'No Role';
        if (role_ids && role_ids.length > 0) {
            const selectedRoles = await db.select({ name: roles.name })
                .from(roles)
                .where(and(
                    sql`${roles.id} IN (${sql.join(role_ids, sql`, `)})`,
                    eq(roles.businessId, req.businessId)
                ));
            roleNames = selectedRoles.map(r => r.name).join(', ');
        }

        // Activity Log
        await logActivity({
            userId: req.user?.id,
            businessId: req.businessId,
            userName: req.user?.name,
            userRole: req.user?.roles,
            action: 'CREATE',
            module: 'USERS',
            details: `${req.user?.roles?.[0] || 'User'} (${req.user?.name}) created new ${roleNames}: ${newUser.name} (${newUser.email})`,
            ipAddress: req.ip
        });

        res.status(201).json(newUser);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update an existing user
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, password, role_ids } = req.body;

        if (!name || !email) {
            return res.status(400).json({ error: "Name and email are required" });
        }

        const [emailExists] = await db.select({ id: users.id })
            .from(users)
            .where(sql`${users.email} = ${email} AND ${users.id} != ${id}`)
            .limit(1);

        if (emailExists) {
            return res.status(400).json({ error: "Email is already in use" });
        }

        const [updatedUser] = await db.transaction(async (tx) => {
            const updateData = { name, email, updatedAt: new Date() };
            if (password) {
                updateData.passwordHash = await bcrypt.hash(password, 10);
            }

            const [resUser] = await tx.update(users)
                .set(updateData)
                .where(and(
                    eq(users.id, id),
                    eq(users.tenantId, req.user.tenantId)
                ))
                .returning();

            if (!resUser) {
                throw new Error("User not found");
            }

            if (role_ids && Array.isArray(role_ids)) {
                await tx.delete(userRoles).where(eq(userRoles.userId, id));
                if (role_ids.length > 0) {
                    await tx.insert(userRoles).values(
                        role_ids.map(rid => ({ userId: id, roleId: rid }))
                    );
                }
            }

            if (req.body.branch_ids && Array.isArray(req.body.branch_ids)) {
                const { userBranches } = require("../db/schema");
                await tx.delete(userBranches).where(eq(userBranches.userId, id));
                if (req.body.branch_ids.length > 0) {
                    await tx.insert(userBranches).values(
                        req.body.branch_ids.map(bid => ({ userId: id, businessId: bid }))
                    ).onConflictDoNothing();
                }
            }
            return [resUser];
        });

        // Activity Log
        await logActivity({
            userId: req.user?.id,
            businessId: req.businessId,
            userName: req.user?.name,
            userRole: req.user?.roles,
            action: 'UPDATE',
            module: 'USERS',
            details: `${req.user?.roles?.[0] || 'User'} (${req.user?.name}) updated user: ${updatedUser.name} (#${updatedUser.id})`,
            ipAddress: req.ip
        });

        res.json(updatedUser);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const targetId = parseInt(id);

        // 1. Fetch victim with roles before deletion for detailed logging
        const victim = await db.query.users.findFirst({
            where: and(
                eq(users.id, targetId),
                eq(users.tenantId, req.user.tenantId)
            ),
            with: {
                roles: {
                    with: {
                        role: true
                    }
                }
            }
        });

        if (!victim) return res.status(404).json({ error: "User not found" });

        const victimName = victim.name;
        const victimRole = victim.roles?.map(r => r.role.name).join(', ') || 'No Role';

        // Prevent deletion of Super Admin
        const isSuperAdmin = victim.roles?.some(r => r.role?.name?.toLowerCase() === 'super admin');
        if (isSuperAdmin) {
            return res.status(403).json({ error: "Super Admin cannot be deleted." });
        }

        // 2. Perform deletion
        await db.delete(users).where(and(
            eq(users.id, targetId),
            eq(users.tenantId, req.user.tenantId)
        ));

        // 3. Activity Log
        await logActivity({
            userId: req.user?.id,
            businessId: req.businessId,
            userName: req.user?.name,
            userRole: req.user?.roles,
            action: 'DELETE',
            module: 'USERS',
            details: `${req.user?.roles?.[0] || 'User'} (${req.user?.name}) deleted ${victimRole} (${victimName})`,
            ipAddress: req.ip
        });

        res.json({ message: "User deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
