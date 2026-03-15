const pool = require("../config/db");
const { eq, and, sql } = require("drizzle-orm");
const { businesses, userBranches, users, userRoles, roles } = require("../db/schema");
const { logActivity } = require("../utils/logger");

const db = pool.db;

// Get all branches across the system (Super Admin)
exports.getAllBranches = async (req, res) => {
    try {
        const { sales } = require("../db/schema");
        const page = parseInt(req.query.page) || 1;
        const limit = req.query.limit === 'all' ? null : (parseInt(req.query.limit) || 10);
        const offset = limit ? (page - 1) * limit : null;

        let query = db.select({
            id: businesses.id,
            name: businesses.name,
            isSuspended: businesses.isSuspended,
            createdAt: businesses.createdAt,
            totalSales: sql`count(${sales.id})::int`,
            totalRevenue: sql`COALESCE(SUM(${sales.total}), 0) - COALESCE(SUM(${sales.returnedAmount}), 0)`
        })
            .from(businesses)
            .leftJoin(sales, eq(businesses.id, sales.businessId))
            .where(eq(businesses.tenantId, req.user.tenantId))
            .groupBy(businesses.id);

        if (limit) {
            query = query.limit(limit).offset(offset);
        }

        const result = await query;

        // Get total count
        const [countRes] = await db.select({ count: sql`count(*)::int` })
            .from(businesses)
            .where(eq(businesses.tenantId, req.user.tenantId));

        const total = countRes.count;

        res.json({
            data: result,
            pagination: {
                total,
                totalPages: limit ? Math.ceil(total / limit) : 1,
                currentPage: page,
                limit: limit || total
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Create a new branch
exports.createBranch = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: "Branch name is required" });

        const [newBranch] = await db.insert(businesses).values({
            name,
            tenantId: req.user.tenantId
        }).returning();

        // Log Activity
        await logActivity({
            userId: req.user.id,
            businessId: req.user.businessId,
            userName: req.user.name,
            userRole: req.user.roles,
            action: 'CREATE',
            module: 'BRANCHES',
            details: `Created new branch: ${name}`,
            ipAddress: req.ip
        });

        res.status(201).json(newBranch);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update branch
exports.updateBranch = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, isSuspended } = req.body;

        const [updated] = await db.update(businesses)
            .set({ name, isSuspended, updatedAt: new Date() })
            .where(eq(businesses.id, id))
            .returning();

        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Assign User to Branch
exports.assignUserToBranch = async (req, res) => {
    try {
        const { userId, businessId } = req.body;
        if (!userId || !businessId) return res.status(400).json({ error: "userId and businessId are required" });

        await db.insert(userBranches).values({ userId, businessId }).onConflictDoNothing();

        res.json({ message: "User assigned to branch successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Remove User from Branch
exports.removeUserFromBranch = async (req, res) => {
    try {
        const { userId, businessId } = req.params;
        await db.delete(userBranches).where(and(eq(userBranches.userId, userId), eq(userBranches.businessId, businessId)));
        res.json({ message: "User removed from branch" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get branch assignments for a user
exports.getUserAssignments = async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await db
            .select({
                id: businesses.id,
                name: businesses.name
            })
            .from(userBranches)
            .innerJoin(businesses, eq(userBranches.businessId, businesses.id))
            .where(eq(userBranches.userId, userId));

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
