const pool = require("../config/db");
const { sql, eq, and, gte, lte, desc } = require("drizzle-orm");
const { products, sales, customers, saleItems, businesses, userBranches } = require("../db/schema");

const db = pool.db;

exports.getStats = async (req, res) => {
  try {
    const { global } = req.query;
    const roles = req.user?.roles || [];
    const isSuperAdmin = roles.some(r => r.toLowerCase() === "super admin");
    const isCashier = roles.some(r => r.toLowerCase().includes("cashier"));
    const isAdmin = roles.some(r => ["super admin", "admin"].includes(r.toLowerCase()));

    // Determine the set of business IDs the user can see
    let targetBusinessIds = [req.businessId];
    if (global === "true" && isAdmin) {
      if (isSuperAdmin) {
        const allBus = await db.select({ id: businesses.id }).from(businesses).where(eq(businesses.tenantId, req.user.tenantId));
        targetBusinessIds = allBus.map(b => b.id);
      } else {
        // Find assigned branches for Admin
        const assigned = await db.select({ id: userBranches.businessId }).from(userBranches).where(eq(userBranches.userId, req.user.id));
        targetBusinessIds = [req.user.businessId, ...assigned.map(a => a.id)];
      }
    }

    const businessIn = sql`${sql.join(targetBusinessIds, sql`, `)}`;

    const userId = req.user?.id;

    // 1. Total & Low Stock Products (Global)
    const [productStats] = await db.select({
      total: sql`count(*)::int`,
      low_stock: sql`count(*) FILTER (WHERE ${products.stock} <= ${products.alertQuantity})::int`
    }).from(products)
      .where(sql`${products.businessId} IN (${businessIn})`);

    // 2. Today's Revenue
    const todayRevenueQuery = db.select({
      revenue: sql`COALESCE(SUM(${sales.total}), 0) - COALESCE(SUM(${sales.returnedAmount}), 0)`
    })
      .from(sales)
      .where(and(
        gte(sales.createdAt, sql`CURRENT_DATE`),
        sql`${sales.businessId} IN (${businessIn})`
      ));

    if (isCashier) {
      todayRevenueQuery.where(and(
        gte(sales.createdAt, sql`CURRENT_DATE`),
        eq(sales.userId, userId),
        sql`${sales.businessId} IN (${businessIn})`
      ));
    }
    const [todayRevenue] = await todayRevenueQuery;

    // 3. Total Customers
    const [customerStatsRes] = await db.select({ total: sql`count(*)::int` })
      .from(customers)
      .where(sql`${customers.businessId} IN (${businessIn})`);

    let revenueChartRows = [];
    const revenueQuery = isCashier
      ? sql`
          SELECT 
            TO_CHAR(d, 'Mon') || ' ' || TO_CHAR(d, 'DD') as name,
            COALESCE(SUM(s.total), 0) - COALESCE(SUM(s.returned_amount), 0) as revenue
          FROM (
            SELECT CURRENT_DATE - i as d
            FROM generate_series(0, 6) i
          ) dates
          LEFT JOIN sales s ON DATE(s.created_at) = dates.d AND s.user_id = ${userId} AND s.business_id IN (${businessIn})
          GROUP BY d
          ORDER BY d ASC
        `
      : sql`
          SELECT 
            TO_CHAR(d, 'Mon') || ' ' || TO_CHAR(d, 'DD') as name,
            COALESCE(SUM(s.total), 0) - COALESCE(SUM(s.returned_amount), 0) as revenue
          FROM (
            SELECT CURRENT_DATE - i as d
            FROM generate_series(0, 6) i
          ) dates
          LEFT JOIN sales s ON DATE(s.created_at) = dates.d AND s.business_id IN (${businessIn})
          GROUP BY d
          ORDER BY d ASC
        `;
    const chartRes = await db.execute(revenueQuery);
    revenueChartRows = chartRes.rows;

    let topProductsRows = [];
    const topProductsQuery = (isCashier)
      ? sql`
          SELECT p.name, SUM(si.qty) as sales
          FROM sale_items si
          JOIN products p ON si.product_id = p.id
          JOIN sales s ON si.sale_id = s.id
          WHERE s.user_id = ${userId} AND s.business_id IN (${businessIn}) AND si.business_id IN (${businessIn})
          GROUP BY p.name
          ORDER BY sales DESC
          LIMIT 5
        `
      : sql`
          SELECT p.name, SUM(si.qty) as sales
          FROM sale_items si
          JOIN products p ON si.product_id = p.id
          WHERE p.business_id IN (${businessIn}) AND si.business_id IN (${businessIn})
          GROUP BY p.name
          ORDER BY sales DESC
          LIMIT 5
        `;
    const tpRes = await db.execute(topProductsQuery);
    topProductsRows = tpRes.rows;

    // 6. Branch Comparison (Revenue per Branch)
    let branchComparison = [];
    if (targetBusinessIds.length > 1) {
      const branchQuery = sql`
        SELECT b.name, COALESCE(SUM(s.total), 0) - COALESCE(SUM(s.returned_amount), 0) as revenue
        FROM businesses b
        LEFT JOIN sales s ON b.id = s.business_id
        WHERE b.id IN (${businessIn})
        GROUP BY b.id, b.name
        ORDER BY revenue DESC
      `;
      const bcRes = await db.execute(branchQuery);
      branchComparison = bcRes.rows;
    }

    res.json({
      kpis: {
        totalProducts: productStats.total,
        lowStock: productStats.low_stock,
        todayRevenue: todayRevenue.revenue,
        totalCustomers: customerStatsRes.total
      },
      revenueData: revenueChartRows,
      topProducts: topProductsRows,
      branchComparison: branchComparison
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
