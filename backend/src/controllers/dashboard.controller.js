const pool = require("../config/db");

exports.getStats = async (req, res) => {
    try {
        // 1. Total & Low Stock Products
        const products = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE stock <= 10) as low_stock
      FROM products
    `);

        // 2. Today's Sales
        const todaySales = await pool.query(`
      SELECT COALESCE(SUM(total), 0) as revenue
      FROM sales
      WHERE created_at >= CURRENT_DATE
    `);

        // 3. Total Customers
        const customers = await pool.query("SELECT COUNT(*) as total FROM customers");

        // 4. Revenue Chart (Last 7 Days)
        const revenueChart = await pool.query(`
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
        const topProducts = await pool.query(`
      SELECT p.name, SUM(si.qty) as sales
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      GROUP BY p.name
      ORDER BY sales DESC
      LIMIT 5
    `);

        res.json({
            kpis: {
                totalProducts: products.rows[0].total,
                lowStock: products.rows[0].low_stock,
                todayRevenue: todaySales.rows[0].revenue,
                totalCustomers: customers.rows[0].total
            },
            revenueData: revenueChart.rows,
            topProducts: topProducts.rows
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
