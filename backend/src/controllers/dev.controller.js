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
        const { search = "", sortBy = "revenue", page = 1, limit = 2 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const searchTerm = `%${search}%`;

        // 1. Get total count for pagination
        const countQuery = sql`
            SELECT COUNT(DISTINCT b.id)::int as total
            FROM businesses b
            LEFT JOIN users u ON u.business_id = b.id
            WHERE b.name ILIKE ${searchTerm} 
               OR u.name ILIKE ${searchTerm} 
               OR u.email ILIKE ${searchTerm}
        `;
        const countRes = await db.execute(countQuery);
        const total = countRes.rows[0].total;

        // 2. Fetch paginated, sorted, and filtered businesses
        let orderBy;
        switch (sortBy) {
            case "users": orderBy = sql`"usersCount" DESC`; break;
            case "sales": orderBy = sql`"salesCount" DESC`; break;
            case "date": orderBy = sql`b.created_at DESC`; break;
            default: orderBy = sql`"revenue" DESC`;
        }

        const query = sql`
      SELECT 
        b.id,
        b.name,
        b.created_at as "createdAt",
        (SELECT u.name FROM users u 
         JOIN user_roles ur ON u.id = ur.user_id 
         JOIN roles r ON ur.role_id = r.id 
         WHERE u.business_id = b.id AND LOWER(r.name) = 'super admin' 
         LIMIT 1) as "adminName",
        (SELECT u.email FROM users u 
         JOIN user_roles ur ON u.id = ur.user_id 
         JOIN roles r ON ur.role_id = r.id 
         WHERE u.business_id = b.id AND LOWER(r.name) = 'super admin' 
         LIMIT 1) as "adminEmail",
        (SELECT (s.value->>'currency') FROM settings s WHERE s.business_id = b.id AND s.key = 'business' LIMIT 1) as "currency",
        (SELECT COUNT(*)::int FROM users u WHERE u.business_id = b.id) as "usersCount",
        (SELECT COUNT(*)::int FROM products p WHERE p.business_id = b.id) as "productsCount",
        (SELECT COUNT(*)::int FROM sales s WHERE s.business_id = b.id) as "salesCount",
        COALESCE((SELECT SUM(s.total) FROM sales s WHERE s.business_id = b.id), 0) - 
        COALESCE((SELECT SUM(s.returned_amount) FROM sales s WHERE s.business_id = b.id), 0) as "revenue",
        (SELECT COUNT(*)::int FROM sales s WHERE s.business_id = b.id AND DATE(s.created_at) = CURRENT_DATE) as "todaySalesCount",
        COALESCE((SELECT SUM(s.total) FROM sales s WHERE s.business_id = b.id AND DATE(s.created_at) = CURRENT_DATE), 0) - 
        COALESCE((SELECT SUM(s.returned_amount) FROM sales s WHERE s.business_id = b.id AND DATE(s.created_at) = CURRENT_DATE), 0) as "todayRevenue"
      FROM businesses b
      WHERE b.name ILIKE ${searchTerm}
         OR EXISTS (SELECT 1 FROM users u WHERE u.business_id = b.id AND (u.name ILIKE ${searchTerm} OR u.email ILIKE ${searchTerm}))
      ORDER BY ${orderBy}
      LIMIT ${parseInt(limit)}
      OFFSET ${offset}
    `;

        const businessesRes = await db.execute(query);
        const rows = businessesRes.rows;

        // 2. Fetch last 7 days sales for each business
        // To optimize, we could do this in one query but let's keep it simple for now or fetch it separately
        const businessesWithCharts = await Promise.all(rows.map(async (b) => {
            const chartQuery = sql`
        SELECT 
          TO_CHAR(d, 'Mon DD') as name,
          COALESCE(SUM(s.total), 0) - COALESCE(SUM(s.returned_amount), 0) as revenue
        FROM (
          SELECT CURRENT_DATE - i as d
          FROM generate_series(0, 6) i
        ) dates
        LEFT JOIN sales s ON DATE(s.created_at) = dates.d AND s.business_id = ${b.id}
        GROUP BY d
        ORDER BY d ASC
      `;
            const chartRes = await db.execute(chartQuery);
            return { ...b, chartData: chartRes.rows };
        }));

        res.json({
            businesses: businessesWithCharts,
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalItems: total
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.impersonateBusiness = async (req, res) => {
    const { businessId } = req.body;

    try {
        // Find the super admin for this business
        const query = sql`
      SELECT u.id, u.name, u.email, u.business_id as "businessId"
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE u.business_id = ${businessId} AND LOWER(r.name) = 'super admin'
      LIMIT 1
    `;
        const [admin] = (await db.execute(query)).rows;

        if (!admin) {
            return res.status(404).json({ error: "Super Admin not found for this business" });
        }

        // Get user roles
        const rolesQuery = sql`
      SELECT r.id, r.name FROM roles r
      JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = ${admin.id}
    `;
        const rolesRes = await db.execute(rolesQuery);
        const roleIds = rolesRes.rows.map(r => r.id);
        const userRoleNames = rolesRes.rows.map(r => r.name);

        // Get actual permissions
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

        // Generate a 5-minute token
        const token = jwt.sign(
            {
                id: admin.id,
                businessId: admin.businessId,
                name: admin.name,
                roles: userRoleNames
            },
            process.env.JWT_SECRET,
            { expiresIn: "5m" }
        );

        res.json({
            token,
            user: { ...admin, roles: userRoleNames },
            permissions: permissionNames
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
