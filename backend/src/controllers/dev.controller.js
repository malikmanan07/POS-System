const pool = require("../config/db");
const { sql, eq, and, desc } = require("drizzle-orm");
const { businesses, users, products, sales, roles, userRoles } = require("../db/schema");
const jwt = require("jsonwebtoken");

const db = pool.db;

exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (email === process.env.DEV_EMAIL && password === process.env.DEV_PASSWORD) {
        const token = jwt.sign(
            { id: 0, email: email, role: "dev", name: "Master Developer" },
            process.env.JWT_SECRET,
            { expiresIn: "10h" }
        );
        return res.json({ token, user: { name: "Master Developer", email, role: "dev" } });
    }

    return res.status(401).json({ error: "Invalid developer credentials" });
};

exports.getDashboardStats = async (req, res) => {
    try {
        const { search = "", sortBy = "revenue", page = 1, limit = 3, dateRange = "7days" } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;
        const searchTerm = `%${search}%`;

        // Date Filter Logic
        let dateFilter = sql``;
        let chartDays = 6;
        if (dateRange === "today") {
            dateFilter = sql`AND s.created_at >= CURRENT_DATE`;
            chartDays = 0; // Just today
        } else if (dateRange === "30days") {
            dateFilter = sql`AND s.created_at >= CURRENT_DATE - INTERVAL '30 days'`;
            chartDays = 29;
        } else if (dateRange === "thisMonth") {
            dateFilter = sql`AND s.created_at >= DATE_TRUNC('month', CURRENT_DATE)`;
            const now = new Date();
            chartDays = now.getDate() - 1;
        } else {
            dateFilter = sql`AND s.created_at >= CURRENT_DATE - INTERVAL '7 days'`;
            chartDays = 6;
        }

        // Base where clause to keep it consistent
        const whereClause = sql`
            b.name ILIKE ${searchTerm}
            OR EXISTS (SELECT 1 FROM users u WHERE u.business_id = b.id AND (u.name ILIKE ${searchTerm} OR u.email ILIKE ${searchTerm}))
        `;

        // 1. Get total count for pagination
        const countQuery = sql`
            SELECT COUNT(*)::int as total
            FROM businesses b
            WHERE ${whereClause}
        `;
        const countRes = await db.execute(countQuery);
        const total = countRes.rows[0].total;

        // 2. Fetch paginated businesses with optimized joins
        let orderBy;
        switch (sortBy) {
            case "users": orderBy = sql`"usersCount" DESC`; break;
            case "sales": orderBy = sql`"salesCount" DESC`; break;
            case "date": orderBy = sql`b.created_at DESC`; break;
            default: orderBy = sql`revenue DESC`;
        }

        const query = sql`
            WITH business_stats AS (
                SELECT 
                    business_id,
                    COUNT(*)::int as s_count,
                    (SUM(total) - SUM(returned_amount))::float as s_revenue,
                    MAX(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Karachi') as last_sale
                FROM sales s
                WHERE 1=1 ${dateFilter}
                GROUP BY business_id
            ),
            today_stats AS (
                SELECT 
                    business_id,
                    COUNT(*)::int as s_count_today,
                    (SUM(total) - SUM(returned_amount))::float as s_revenue_today
                FROM sales s
                WHERE DATE(s.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Karachi') = CURRENT_DATE
                GROUP BY business_id
            ),
            admin_users AS (
                SELECT DISTINCT ON (business_id)
                    u.business_id, u.name, u.email
                FROM users u
                JOIN user_roles ur ON u.id = ur.user_id
                JOIN roles r ON ur.role_id = r.id
                WHERE LOWER(r.name) = 'super admin'
                ORDER BY u.business_id, u.created_at ASC
            ),
            user_counts AS (
                SELECT business_id, COUNT(*)::int as count FROM users GROUP BY business_id
            ),
            product_counts AS (
                SELECT business_id, COUNT(*)::int as count FROM products GROUP BY business_id
            )
            SELECT 
                b.id, b.name, 
                b.is_suspended as "isSuspended",
                b.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Karachi' as "createdAt",
                au.name as "adminName", au.email as "adminEmail",
                COALESCE(st.value->>'currency', '$') as currency,
                COALESCE(uc.count, 0) as "usersCount",
                COALESCE(pc.count, 0) as "productsCount",
                COALESCE(bs.s_count, 0) as "salesCount",
                COALESCE(bs.s_revenue, 0) as "revenue",
                COALESCE(ts.s_count_today, 0) as "todaySalesCount",
                COALESCE(ts.s_revenue_today, 0) as "todayRevenue",
                bs.last_sale as "lastSaleAt"
            FROM businesses b
            LEFT JOIN business_stats bs ON b.id = bs.business_id
            LEFT JOIN today_stats ts ON b.id = ts.business_id
            LEFT JOIN admin_users au ON b.id = au.business_id
            LEFT JOIN user_counts uc ON b.id = uc.business_id
            LEFT JOIN product_counts pc ON b.id = pc.business_id
            LEFT JOIN settings st ON b.id = st.business_id AND st.key = 'business'
            WHERE ${whereClause}
            ORDER BY ${orderBy}
            LIMIT ${limitNum}
            OFFSET ${offset}
        `;

        const { rows } = await db.execute(query);
        const businessIds = rows.map(r => r.id);

        // 3. Batch fetch chart data for all returned businesses (Continuous Timeline)
        let businessesWithCharts = rows.map(r => ({ ...r, chartData: [] }));
        if (businessIds.length > 0) {
            const batchChartQuery = sql`
                WITH date_series AS (
                    SELECT CURRENT_DATE - i as d
                    FROM generate_series(0, ${chartDays}) i
                ),
                business_ids AS (
                    SELECT unnest(array[${sql.join(businessIds, sql`, `)}])::int as bid
                )
                SELECT 
                    ids.bid as business_id,
                    TO_CHAR(ds.d, 'Mon DD') as name,
                    COALESCE(SUM(s.total) - SUM(s.returned_amount), 0)::float as revenue
                FROM date_series ds
                CROSS JOIN business_ids ids
                LEFT JOIN sales s ON DATE(s.created_at) = ds.d AND s.business_id = ids.bid
                GROUP BY ids.bid, ds.d
                ORDER BY ds.d ASC
            `;
            const chartRes = await db.execute(batchChartQuery);
            const chartDataByBusiness = chartRes.rows.reduce((acc, curr) => {
                if (!acc[curr.business_id]) acc[curr.business_id] = [];
                acc[curr.business_id].push({ name: curr.name, revenue: curr.revenue });
                return acc;
            }, {});

            businessesWithCharts = rows.map(r => ({
                ...r,
                chartData: chartDataByBusiness[r.id] || []
            }));
        }

        // 4. Signup Trend (optimized)
        const signupTrendRes = await db.execute(sql`
            SELECT 
                TO_CHAR(dates.d, 'Mon DD') as name,
                COUNT(b.id)::int as count
            FROM (
                SELECT CURRENT_DATE - i as d
                FROM generate_series(0, ${chartDays}) i
            ) dates
            LEFT JOIN businesses b ON DATE(b.created_at) = dates.d
            GROUP BY dates.d
            ORDER BY dates.d ASC
        `);
        const signupTrend = signupTrendRes.rows;

        // 5. Latest Registration
        const latestRegRes = await db.execute(sql`SELECT name FROM businesses ORDER BY created_at DESC LIMIT 1`);
        const latestRegistration = latestRegRes.rows[0] || null;

        // 6. Network Revenue Breakdown
        const networkRevenueRes = await db.execute(sql`
            SELECT 
                COALESCE(st.value->>'currency', 'Unknown') as currency,
                SUM(COALESCE(s.total, 0) - COALESCE(s.returned_amount, 0))::float as revenue
            FROM settings st
            JOIN sales s ON st.business_id = s.business_id
            WHERE st.key = 'business' ${dateFilter}
            GROUP BY st.value->>'currency'
        `);

        // 7. Top Performers (Batch charts - Continuous)
        const topPerformersRes = await db.execute(sql`
            SELECT 
                b.id, b.name,
                SUM(COALESCE(s.total, 0) - COALESCE(s.returned_amount, 0))::float as revenue
            FROM businesses b
            JOIN sales s ON b.id = s.business_id
            WHERE 1=1 ${dateFilter}
            GROUP BY b.id, b.name
            ORDER BY revenue DESC
            LIMIT 5
        `);

        const topIds = topPerformersRes.rows.map(r => r.id);
        let topPerformingBusinesses = topPerformersRes.rows.map(r => ({ ...r, chartData: [] }));

        if (topIds.length > 0) {
            const topChartsRes = await db.execute(sql`
                WITH date_series AS (
                    SELECT CURRENT_DATE - i as d
                    FROM generate_series(0, ${chartDays}) i
                ),
                top_ids AS (
                    SELECT unnest(array[${sql.join(topIds, sql`, `)}])::int as bid
                )
                SELECT 
                    ids.bid as business_id,
                    TO_CHAR(ds.d, 'Mon DD') as name,
                    COALESCE(SUM(s.total) - SUM(s.returned_amount), 0)::float as revenue
                FROM date_series ds
                CROSS JOIN top_ids ids
                LEFT JOIN sales s ON DATE(s.created_at) = ds.d AND s.business_id = ids.bid
                GROUP BY ids.bid, ds.d
                ORDER BY ds.d ASC
            `);

            const topChartMap = topChartsRes.rows.reduce((acc, curr) => {
                if (!acc[curr.business_id]) acc[curr.business_id] = [];
                acc[curr.business_id].push({ name: curr.name, revenue: curr.revenue });
                return acc;
            }, {});

            topPerformingBusinesses = topPerformersRes.rows.map(r => ({
                ...r,
                chartData: topChartMap[r.id] || []
            }));
        }

        res.json({
            businesses: businessesWithCharts,
            topPerformingBusinesses,
            networkRevenueBreakdown: networkRevenueRes.rows,
            signupTrend,
            latestRegistration,
            currentPage: pageNum,
            totalPages: Math.ceil(total / limitNum),
            totalItems: total
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getBusinessDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            salesPage = 1, productsPage = 1, usersPage = 1, shiftsPage = 1,
            limit = 10
        } = req.query;

        const sLimit = parseInt(limit);
        const sOffset = (parseInt(salesPage) - 1) * sLimit;
        const pOffset = (parseInt(productsPage) - 1) * sLimit;
        const uOffset = (parseInt(usersPage) - 1) * sLimit;
        const shOffset = (parseInt(shiftsPage) - 1) * sLimit;

        // 1. Total Counts for Pagination
        const counts = await db.execute(sql`
            SELECT 
                (SELECT COUNT(*)::int FROM sales WHERE business_id = ${id}) as "salesTotal",
                (SELECT COUNT(*)::int FROM products WHERE business_id = ${id}) as "productsTotal",
                (SELECT COUNT(*)::int FROM users WHERE business_id = ${id}) as "usersTotal",
                (SELECT COUNT(*)::int FROM shifts WHERE business_id = ${id}) as "shiftsTotal"
        `);
        const { salesTotal, productsTotal, usersTotal, shiftsTotal } = counts.rows[0];

        // 2. Recent Sales
        const salesRes = await db.execute(sql`
            SELECT 
                s.id, s.total, s.status, 
                s.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Karachi' as "createdAt",
                u.name as "userName", 
                c.name as "customerName"
            FROM sales s
            LEFT JOIN users u ON s.user_id = u.id
            LEFT JOIN customers c ON s.customer_id = c.id
            WHERE s.business_id = ${id}
            ORDER BY s.created_at DESC
            LIMIT ${sLimit} OFFSET ${sOffset}
        `);

        // 3. Top Products
        const productsRes = await db.execute(sql`
            SELECT p.name, SUM(si.qty)::int as "totalQty", SUM(si.line_total)::float as "totalRevenue"
            FROM sale_items si
            JOIN products p ON si.product_id = p.id
            WHERE si.business_id = ${id}
            GROUP BY p.id, p.name
            ORDER BY "totalQty" DESC
            LIMIT ${sLimit} OFFSET ${pOffset}
        `);

        // 4. Active Users
        const usersRes = await db.execute(sql`
            SELECT u.id, u.name, u.email, 
                   u.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Karachi' as "createdAt",
                   (SELECT r.name FROM roles r JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = u.id LIMIT 1) as role
            FROM users u
            WHERE u.business_id = ${id}
            ORDER BY u.created_at DESC
            LIMIT ${sLimit} OFFSET ${uOffset}
        `);

        // 5. Shift History
        const shiftsRes = await db.execute(sql`
            SELECT 
                s.id, s.status,
                s.start_time AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Karachi' as "startTime", 
                s.end_time AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Karachi' as "endTime",
                s.total_sales as "totalSales",
                u.name as "userName"
            FROM shifts s
            LEFT JOIN users u ON s.user_id = u.id
            WHERE s.business_id = ${id}
            ORDER BY s.start_time DESC
            LIMIT ${sLimit} OFFSET ${shOffset}
        `);

        res.json({
            recentSales: salesRes.rows,
            topProducts: productsRes.rows,
            users: usersRes.rows,
            shifts: shiftsRes.rows,
            pagination: {
                salesTotal, salesTotalPages: Math.ceil(salesTotal / sLimit),
                productsTotal, productsTotalPages: Math.ceil(productsTotal / sLimit),
                usersTotal, usersTotalPages: Math.ceil(usersTotal / sLimit),
                shiftsTotal, shiftsTotalPages: Math.ceil(shiftsTotal / sLimit)
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.exportDashboardStats = async (req, res) => {
    try {
        const { dateRange = "7days" } = req.query;

        // Date Filter Logic
        let dateFilter = sql``;
        if (dateRange === "today") {
            dateFilter = sql`AND s.created_at >= CURRENT_DATE`;
        } else if (dateRange === "30days") {
            dateFilter = sql`AND s.created_at >= CURRENT_DATE - INTERVAL '30 days'`;
        } else if (dateRange === "thisMonth") {
            dateFilter = sql`AND s.created_at >= DATE_TRUNC('month', CURRENT_DATE)`;
        } else {
            dateFilter = sql`AND s.created_at >= CURRENT_DATE - INTERVAL '7 days'`;
        }

        const query = sql`
            SELECT 
                b.name,
                (SELECT u.email FROM users u 
                 JOIN user_roles ur ON u.id = ur.user_id 
                 JOIN roles r ON ur.role_id = r.id 
                 WHERE u.business_id = b.id AND LOWER(r.name) = 'super admin' 
                 LIMIT 1) as "adminEmail",
                (SELECT COUNT(*)::int FROM users u WHERE u.business_id = b.id) as "usersCount",
                (SELECT COUNT(*)::int FROM products p WHERE p.business_id = b.id) as "productsCount",
                (SELECT COUNT(*)::int FROM sales s WHERE s.business_id = b.id ${dateFilter}) as "salesCount",
                COALESCE((SELECT SUM(s.total) FROM sales s WHERE s.business_id = b.id ${dateFilter}), 0) - 
                COALESCE((SELECT SUM(s.returned_amount) FROM sales s WHERE s.business_id = b.id ${dateFilter}), 0) as "revenue",
                COALESCE((SELECT (s.value->>'currency') FROM settings s WHERE s.business_id = b.id AND s.key = 'business' LIMIT 1), 'Unknown') as "currency",
                (SELECT MAX(created_at) FROM sales WHERE business_id = b.id) as "lastSaleAt",
                b.created_at as "registeredDate"
            FROM businesses b
            ORDER BY "revenue" DESC
        `;

        const { rows } = await db.execute(query);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.impersonateBusiness = async (req, res) => {
    const { businessId } = req.body;
    try {
        const query = sql`
            SELECT u.id, u.name, u.email, u.business_id as "businessId"
            FROM users u
            JOIN user_roles ur ON u.id = ur.user_id
            JOIN roles r ON ur.role_id = r.id
            WHERE u.business_id = ${businessId} AND LOWER(r.name) = 'super admin'
            LIMIT 1
        `;
        const [admin] = (await db.execute(query)).rows;
        if (!admin) return res.status(404).json({ error: "Super Admin not found" });

        const rolesQuery = sql`
            SELECT r.id, r.name FROM roles r
            JOIN user_roles ur ON r.id = ur.role_id
            WHERE ur.user_id = ${admin.id}
        `;
        const rolesRes = await db.execute(rolesQuery);
        const roleIds = rolesRes.rows.map(r => r.id);
        const userRoleNames = rolesRes.rows.map(r => r.name);

        let permissionNames = [];
        if (roleIds.length > 0) {
            const permsQuery = sql`
                SELECT DISTINCT p.name 
                FROM permissions p
                JOIN role_permissions rp ON p.id = rp.permission_id
                WHERE rp.role_id IN (${sql.join(roleIds, sql`, `)})
            `;
            const permsRes = await db.execute(permsQuery);
            permissionNames = permsRes.rows.map(p => p.name);
        }

        const token = jwt.sign(
            { id: admin.id, businessId: admin.businessId, name: admin.name, roles: userRoleNames },
            process.env.JWT_SECRET,
            { expiresIn: "5m" }
        );

        res.json({ token, user: { ...admin, roles: userRoleNames }, permissions: permissionNames });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.toggleBusinessStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isSuspended } = req.body;

        await db.execute(sql`
            UPDATE businesses 
            SET is_suspended = ${isSuspended} 
            WHERE id = ${id}
        `);

        res.json({ message: `Business ${isSuspended ? 'suspended' : 'activated'} successfully` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
