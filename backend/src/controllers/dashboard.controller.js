const pool = require("../config/db");
const { sql, eq, and, gte, lte, desc } = require("drizzle-orm");
const { products, sales, customers, saleItems } = require("../db/schema");

const db = pool.db;

exports.getStats = async (req, res) => {
  try {
    const isCashier = req.user?.roles?.some(r => r.toLowerCase() === "cashier");
    const userId = req.user?.id;

    // 1. Total & Low Stock Products (Global)
    const [productStats] = await db.select({
      total: sql`count(*)::int`,
      low_stock: sql`count(*) FILTER (WHERE ${products.stock} <= 10)::int`
    }).from(products);

    // 2. Today's Revenue
    const todayRevenueQuery = db.select({
      revenue: sql`COALESCE(SUM(${sales.total}), 0)`
    })
      .from(sales)
      .where(gte(sales.createdAt, sql`CURRENT_DATE`));

    if (isCashier) {
      todayRevenueQuery.where(and(gte(sales.createdAt, sql`CURRENT_DATE`), eq(sales.userId, userId)));
    }
    const [todayRevenue] = await todayRevenueQuery;

    // 3. Total Customers
    const [customerStats] = await db.select({ total: sql`count(*)::int` }).from(customers);

    // 4. Revenue Chart (Last 7 Days)
    const revenueChart = isCashier
      ? await db.execute(sql`
          SELECT 
            TO_CHAR(d, 'Mon') || ' ' || TO_CHAR(d, 'DD') as name,
            COALESCE(SUM(s.total), 0) as revenue
          FROM (
            SELECT CURRENT_DATE - i as d
            FROM generate_series(0, 6) i
          ) dates
          LEFT JOIN sales s ON DATE(s.created_at) = dates.d AND s.user_id = ${userId}
          GROUP BY d
          ORDER BY d ASC
        `)
      : await db.execute(sql`
          SELECT 
            TO_CHAR(d, 'Mon') || ' ' || TO_CHAR(d, 'DD') as name,
            COALESCE(SUM(s.total), 0) as revenue
          FROM (
            SELECT CURRENT_DATE - i as d
            FROM generate_series(0, 6) i
          ) dates
          LEFT JOIN sales s ON DATE(s.created_at) = dates.d
          GROUP BY d
          ORDER BY d ASC
        `);

    // 5. Top Products
    const topProducts = isCashier
      ? await db.execute(sql`
          SELECT p.name, SUM(si.qty) as sales
          FROM sale_items si
          JOIN products p ON si.product_id = p.id
          JOIN sales s ON si.sale_id = s.id
          WHERE s.user_id = ${userId}
          GROUP BY p.name
          ORDER BY sales DESC
          LIMIT 5
        `)
      : await db.execute(sql`
          SELECT p.name, SUM(si.qty) as sales
          FROM sale_items si
          JOIN products p ON si.product_id = p.id
          GROUP BY p.name
          ORDER BY sales DESC
          LIMIT 5
        `);

    res.json({
      kpis: {
        totalProducts: productStats.total,
        lowStock: productStats.low_stock,
        todayRevenue: todayRevenue.revenue,
        totalCustomers: customerStats.total
      },
      revenueData: revenueChart.rows,
      topProducts: topProducts.rows
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
