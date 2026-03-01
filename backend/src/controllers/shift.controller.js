const pool = require("../config/db");
const { eq, and, desc, sql, gte, lte, inArray } = require("drizzle-orm");
const { shifts, sales, users, roles, permissions, rolePermissions } = require("../db/schema");
const { logActivity } = require("../utils/logger");

const db = pool.db;

// GET /api/shifts/current
exports.getCurrentShift = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRoles = (req.user.roles || []).map(r => r.toLowerCase());
        const isCashier = userRoles.includes("cashier");

        if (!isCashier) return res.json(null);

        const [activeShift] = await db.select()
            .from(shifts)
            .where(and(eq(shifts.userId, userId), eq(shifts.status, 'active')))
            .limit(1);

        if (!activeShift) return res.json(null);

        // Fetch current totals for this active shift
        const [salesSummary] = await db.select({
            total: sql`COALESCE(SUM(${sales.total} - ${sales.returnedAmount})::numeric, 0)`,
            cashTotal: sql`COALESCE(SUM(CASE WHEN LOWER(${sales.paymentMethod}) = 'cash' THEN ${sales.total} - ${sales.returnedAmount} ELSE 0 END)::numeric, 0)`
        })
            .from(sales)
            .where(eq(sales.shiftId, activeShift.id));

        res.json({
            ...activeShift,
            currentSales: parseFloat(salesSummary.total),
            currentCashSales: parseFloat(salesSummary.cashTotal),
            expectedCash: parseFloat(activeShift.openingBalance) + parseFloat(salesSummary.cashTotal)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// POST /api/shifts/start
exports.startShift = async (req, res) => {
    try {
        const userId = req.user.id;
        const { openingBalance } = req.body;
        const userRoles = (req.user.roles || []).map(r => r.toLowerCase());
        const isCashier = userRoles.includes("cashier");

        if (!isCashier) {
            return res.status(403).json({ error: "Only cashiers can manage shifts" });
        }

        // Check for existing active shift
        const [existing] = await db.select()
            .from(shifts)
            .where(and(eq(shifts.userId, userId), eq(shifts.status, 'active')))
            .limit(1);

        if (existing) {
            return res.status(400).json({ error: "You already have an active shift" });
        }

        const [newShift] = await db.insert(shifts)
            .values({
                userId,
                openingBalance: String(Math.max(0, parseFloat(openingBalance || 0))),
                status: 'active',
                startTime: new Date()
            })
            .returning();

        await logActivity({
            userId: req.user.id,
            userName: req.user.name,
            userRole: req.user.roles,
            action: 'CREATE',
            module: 'SHIFTS',
            details: `Started shift with opening balance: ${openingBalance}`,
            ipAddress: req.ip
        });

        res.status(201).json(newShift);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// POST /api/shifts/end
exports.endShift = async (req, res) => {
    try {
        const userId = req.user.id;
        const { closingBalance, note } = req.body;
        const userRoles = (req.user.roles || []).map(r => r.toLowerCase());
        const isCashier = userRoles.includes("cashier");

        if (!isCashier) {
            return res.status(403).json({ error: "Only cashiers can manage shifts" });
        }

        const [activeShift] = await db.select()
            .from(shifts)
            .where(and(eq(shifts.userId, userId), eq(shifts.status, 'active')))
            .limit(1);

        if (!activeShift) {
            return res.status(404).json({ error: "No active shift found" });
        }

        // Calculate total sales and cash sales during this shift
        const [salesSummary] = await db.select({
            total: sql`COALESCE(SUM(${sales.total} - ${sales.returnedAmount})::numeric, 0)`,
            cashTotal: sql`COALESCE(SUM(CASE WHEN LOWER(${sales.paymentMethod}) = 'cash' THEN ${sales.total} - ${sales.returnedAmount} ELSE 0 END)::numeric, 0)`
        })
            .from(sales)
            .where(eq(sales.shiftId, activeShift.id));

        const totalSales = parseFloat(salesSummary.total);
        const cashSales = parseFloat(salesSummary.cashTotal);
        const expectedCash = parseFloat(activeShift.openingBalance) + cashSales;

        const [updatedShift] = await db.update(shifts)
            .set({
                closingBalance: String(closingBalance),
                totalSales: String(totalSales),
                expectedCash: String(expectedCash),
                endTime: new Date(),
                status: 'closed',
                note: note || null
            })
            .where(eq(shifts.id, activeShift.id))
            .returning();

        await logActivity({
            userId: req.user.id,
            userName: req.user.name,
            userRole: req.user.roles,
            action: 'UPDATE',
            module: 'SHIFTS',
            details: `Ended shift #${activeShift.id}. Sales: ${totalSales}, Expected: ${expectedCash}, Actual: ${closingBalance}`,
            ipAddress: req.ip
        });

        res.json(updatedShift);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /api/shifts (Admin History)
exports.getAllShifts = async (req, res) => {
    try {
        const originalRoles = req.user.roles || [];
        const lowerRoles = originalRoles.map(r => r.toLowerCase());
        const isSuperAdmin = lowerRoles.includes("super admin");
        const isAdmin = lowerRoles.includes("admin");

        // Check for 'manage_shifts' permission in DB if not super admin
        let hasManageShifts = isSuperAdmin || isAdmin;
        if (!hasManageShifts && originalRoles.length > 0) {
            const [permResult] = await db.select({ roleId: rolePermissions.roleId })
                .from(rolePermissions)
                .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
                .innerJoin(roles, eq(rolePermissions.roleId, roles.id))
                .where(and(
                    eq(permissions.name, 'manage_shifts'),
                    inArray(roles.name, originalRoles)
                ))
                .limit(1);
            if (permResult) hasManageShifts = true;
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        let query = db.select({
            id: shifts.id,
            userId: shifts.userId,
            userName: users.name,
            openingBalance: shifts.openingBalance,
            closingBalance: shifts.closingBalance,
            totalSales: shifts.totalSales,
            expectedCash: shifts.expectedCash,
            startTime: shifts.startTime,
            endTime: shifts.endTime,
            status: shifts.status,
            note: shifts.note
        })
            .from(shifts)
            .leftJoin(users, eq(shifts.userId, users.id))
            .orderBy(desc(shifts.id));

        // If no manage permission, only see own shifts
        if (!hasManageShifts) {
            query = query.where(eq(shifts.userId, req.user.id));
        }

        const result = await query.limit(limit).offset(offset);

        // Get total count
        let countQuery = db.select({ count: sql`count(*)::int` }).from(shifts);
        if (!hasManageShifts) {
            countQuery = countQuery.where(eq(shifts.userId, req.user.id));
        }
        const [countResult] = await countQuery;
        const total = countResult.count;

        res.json({
            data: result,
            pagination: {
                total,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                limit
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
