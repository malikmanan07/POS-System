const pool = require("../config/db");
const { sql, eq, and, gte, lte, desc } = require("drizzle-orm");
const { products, sales, customers, saleItems } = require("../db/schema");

const db = pool.db;

exports.getStats = async (req, res) => {
  try {
    const roles = req.user?.roles || [];
    const isCashier = roles.some(r => r.toLowerCase().includes("cashier"));
    const isInventoryManager = roles.some(r => r.toLowerCase().includes("inventory"));
    const isAccountant = roles.some(r => r.toLowerCase().includes("accountant"));
    const isBranchManager = roles.some(r => r.toLowerCase().includes("manager"));
    const isAdmin = roles.some(r => ["super admin", "admin"].includes(r.toLowerCase()));

    const userId = req.user?.id;

    // 1. Total & Low Stock Products (Global)
    const [productStats] = await db.select({
      total: sql`count(*)::int`,
      low_stock: sql`count(*) FILTER (WHERE ${products.stock} <= ${products.alertQuantity})::int`
    }).from(products)
      .where(eq(products.businessId, req.businessId));

    // 2. Today's Revenue
    const todayRevenueQuery = db.select({
      revenue: sql`COALESCE(SUM(${sales.total}), 0) - COALESCE(SUM(${sales.returnedAmount}), 0)`
    })
      .from(sales)
      .where(and(
        gte(sales.createdAt, sql`CURRENT_DATE`),
        eq(sales.businessId, req.businessId)
      ));

    if (isCashier) {
      todayRevenueQuery.where(and(
        gte(sales.createdAt, sql`CURRENT_DATE`),
        eq(sales.userId, userId),
        eq(sales.businessId, req.businessId)
      ));
    } else if (isInventoryManager) {
      // Inventory managers don't usually see revenue stats
      todayRevenueQuery.where(sql`1=0`);
    }
    const [todayRevenue] = await todayRevenueQuery;

    // 3. Total Customers
    let customerStatsRes = { total: 0 };
    if (!isInventoryManager) {
      const [res] = await db.select({ total: sql`count(*)::int` })
        .from(customers)
        .where(eq(customers.businessId, req.businessId));
      customerStatsRes = res;
    }

    // 4. Revenue Chart (Last 7 Days)
    let revenueChartRows = [];
    if (!isInventoryManager) {
      const revenueQuery = isCashier
        ? sql`
            SELECT 
              TO_CHAR(d, 'Mon') || ' ' || TO_CHAR(d, 'DD') as name,
              COALESCE(SUM(s.total), 0) - COALESCE(SUM(s.returned_amount), 0) as revenue
            FROM (
              SELECT CURRENT_DATE - i as d
              FROM generate_series(0, 6) i
            ) dates
            LEFT JOIN sales s ON DATE(s.created_at) = dates.d AND s.user_id = ${userId} AND s.business_id = ${req.businessId}
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
            LEFT JOIN sales s ON DATE(s.created_at) = dates.d AND s.business_id = ${req.businessId}
            GROUP BY d
            ORDER BY d ASC
          `;
      const res = await db.execute(revenueQuery);
      revenueChartRows = res.rows;
    }

    // 5. Top Products
    let topProductsRows = [];
    if (!isAccountant) {
      const topProductsQuery = (isCashier)
        ? sql`
            SELECT p.name, SUM(si.qty) as sales
            FROM sale_items si
            JOIN products p ON si.product_id = p.id
            JOIN sales s ON si.sale_id = s.id
            WHERE s.user_id = ${userId} AND s.business_id = ${req.businessId} AND si.business_id = ${req.businessId}
            GROUP BY p.name
            ORDER BY sales DESC
            LIMIT 5
          `
        : sql`
            SELECT p.name, SUM(si.qty) as sales
            FROM sale_items si
            JOIN products p ON si.product_id = p.id
            WHERE p.business_id = ${req.businessId} AND si.business_id = ${req.businessId}
            GROUP BY p.name
            ORDER BY sales DESC
            LIMIT 5
          `;
      const res = await db.execute(topProductsQuery);
      topProductsRows = res.rows;
    }

    res.json({
      kpis: {
        totalProducts: (isAccountant) ? 0 : productStats.total,
        lowStock: (isAccountant) ? 0 : productStats.low_stock,
        todayRevenue: (isInventoryManager) ? 0 : todayRevenue.revenue,
        totalCustomers: (isInventoryManager) ? 0 : customerStatsRes.total
      },
      revenueData: revenueChartRows,
      topProducts: topProductsRows
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
