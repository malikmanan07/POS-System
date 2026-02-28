const pool = require("../config/db");
const { eq, desc, sql, and, gte, lte, ilike } = require("drizzle-orm");
const { activityLogs, users } = require("../db/schema");

const db = pool.db;

// GET /api/activity
exports.getAll = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const offset = (page - 1) * limit;

        const { module, userName, startDate, endDate } = req.query;

        let whereClauses = [];

        if (module) {
            whereClauses.push(eq(activityLogs.module, module.toUpperCase()));
        }
        if (userName) {
            whereClauses.push(ilike(activityLogs.userName, `%${userName}%`));
        }
        if (startDate) {
            whereClauses.push(gte(activityLogs.createdAt, new Date(startDate)));
        }
        if (endDate) {
            // End of day
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            whereClauses.push(lte(activityLogs.createdAt, end));
        }

        const where = whereClauses.length > 0 ? and(...whereClauses) : undefined;

        const results = await db.select()
            .from(activityLogs)
            .where(where)
            .orderBy(desc(activityLogs.createdAt))
            .limit(limit)
            .offset(offset);

        const [countRes] = await db.select({ count: sql`count(*)::int` })
            .from(activityLogs)
            .where(where);

        res.json({
            data: results,
            pagination: {
                total: countRes.count,
                page,
                limit,
                pages: Math.ceil(countRes.count / limit)
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /api/activity/export
exports.exportCsv = async (req, res) => {
    try {
        const { module, userName, startDate, endDate } = req.query;

        let whereClauses = [];
        if (module) whereClauses.push(eq(activityLogs.module, module.toUpperCase()));
        if (userName) whereClauses.push(ilike(activityLogs.userName, `%${userName}%`));
        if (startDate) whereClauses.push(gte(activityLogs.createdAt, new Date(startDate)));
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            whereClauses.push(lte(activityLogs.createdAt, end));
        }

        const where = whereClauses.length > 0 ? and(...whereClauses) : undefined;

        const logs = await db.select()
            .from(activityLogs)
            .where(where)
            .orderBy(desc(activityLogs.createdAt));

        // Create CSV string
        let csv = "ID,Time,User,Role,Module,Action,Details,IP Address\n";
        logs.forEach(log => {
            const time = new Date(log.createdAt).toLocaleString().replace(/,/g, '');
            const details = (log.details || "").replace(/"/g, '""');
            csv += `${log.id},"${time}","${log.userName}","${log.userRole}","${log.module}","${log.action}","${details}","${log.ipAddress || ''}"\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=activity_logs.csv');
        res.status(200).send(csv);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /api/activity/modules
exports.getModules = async (req, res) => {
    try {
        const results = await db.select({
            module: activityLogs.module
        })
            .from(activityLogs)
            .groupBy(activityLogs.module)
            .orderBy(activityLogs.module);

        res.json(results.map(r => r.module));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
