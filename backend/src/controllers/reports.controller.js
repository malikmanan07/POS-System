const pool = require("../config/db");
const { sql, eq, and, gte, lte, desc } = require("drizzle-orm");
const { sales, saleItems, products, customers } = require("../db/schema");

const db = pool.db;

/**
 * GET /api/reports/analytics
 */
exports.getAnalytics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let whereClause = [];

        if (startDate) {
            whereClause.push(gte(sales.createdAt, new Date(startDate)));
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            whereClause.push(lte(sales.createdAt, end));
        }

        const filter = and(...whereClause);

        // 1. Summary Metrics
        const [summary] = await db.select({
            totalSales: sql`COUNT(${sales.id})::int`,
            totalRevenue: sql`COALESCE(SUM(${sales.total})::numeric, 0)`,
            totalCustomers: sql`COUNT(DISTINCT ${sales.customerId})::int`,
            avgOrderValue: sql`COALESCE(AVG(${sales.total})::numeric, 0)`
        })
            .from(sales)
            .where(filter);

        // 2. Chart Data (Daily Revenue)
        const dailyRevenue = await db.select({
            date: sql`DATE(${sales.createdAt})`,
            revenue: sql`SUM(${sales.total})::numeric`
        })
            .from(sales)
            .where(filter)
            .groupBy(sql`DATE(${sales.createdAt})`)
            .orderBy(sql`DATE(${sales.createdAt})`);

        // 3. Best Selling Products
        const topProducts = await db.select({
            id: products.id,
            name: products.name,
            qtySold: sql`SUM(${saleItems.qty})::int`,
            revenue: sql`SUM(${saleItems.lineTotal})::numeric`
        })
            .from(saleItems)
            .innerJoin(sales, eq(saleItems.saleId, sales.id))
            .innerJoin(products, eq(saleItems.productId, products.id))
            .where(filter)
            .groupBy(products.id, products.name)
            .orderBy(desc(sql`SUM(${saleItems.lineTotal})`))
            .limit(10);

        // 4. Customer Breakdown
        const customerStats = await db.select({
            id: customers.id,
            name: customers.name,
            totalOrders: sql`COUNT(${sales.id})::int`,
            totalSpent: sql`SUM(${sales.total})::numeric`
        })
            .from(sales)
            .innerJoin(customers, eq(sales.customerId, customers.id))
            .where(filter)
            .groupBy(customers.id, customers.name)
            .orderBy(desc(sql`SUM(${sales.total})`))
            .limit(10);

        res.json({
            summary,
            chartData: dailyRevenue.map(d => ({
                date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                revenue: parseFloat(d.revenue)
            })),
            topProducts,
            customerStats
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

/**
 * GET /api/reports/export-csv
 */
exports.exportCsv = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        // Simplified export for top products as example
        let whereClause = [];
        if (startDate) whereClause.push(gte(sales.createdAt, new Date(startDate)));
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            whereClause.push(lte(sales.createdAt, end));
        }

        const topProducts = await db.select({
            name: products.name,
            qty: sql`SUM(${saleItems.qty})::int`,
            revenue: sql`SUM(${saleItems.lineTotal})::numeric`
        })
            .from(saleItems)
            .innerJoin(sales, eq(saleItems.saleId, sales.id))
            .innerJoin(products, eq(saleItems.productId, products.id))
            .where(and(...whereClause))
            .groupBy(products.name)
            .orderBy(desc(sql`SUM(${saleItems.lineTotal})`));

        let csv = "Product Name,Qty Sold,Total Revenue\n";
        topProducts.forEach(p => {
            csv += `${p.name},${p.qty},${p.revenue}\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=sales_report.csv');
        res.send(csv);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
