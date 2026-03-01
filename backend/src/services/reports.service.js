const pool = require("../config/db");
const { sql, eq, and, desc } = require("drizzle-orm");
const { sales, saleItems, products, customers } = require("../db/schema");
const { buildDateFilter } = require("../utils/date.util");

const db = pool.db;

const ReportsService = {
    /**
     * Gets summary metrics (total sales, revenue, average order value, unique customers)
     */
    getSummary: async (filters) => {
        const filter = buildDateFilter(sales.createdAt, filters.startDate, filters.endDate);
        const [summary] = await db.select({
            totalSales: sql`COUNT(${sales.id})::int`,
            totalRevenue: sql`COALESCE(SUM(${sales.total})::numeric, 0) - COALESCE(SUM(${sales.returnedAmount})::numeric, 0)`,
            totalCustomers: sql`COUNT(DISTINCT ${sales.customerId})::int`,
            avgOrderValue: sql`COALESCE(AVG(${sales.total} - ${sales.returnedAmount})::numeric, 0)`
        })
            .from(sales)
            .where(filter);
        return summary;
    },

    /**
     * Gets daily revenue data for charts
     */
    getDailyRevenue: async (filters) => {
        const filter = buildDateFilter(sales.createdAt, filters.startDate, filters.endDate);
        const dailyRevenue = await db.select({
            date: sql`DATE(${sales.createdAt})`,
            revenue: sql`SUM(${sales.total} - ${sales.returnedAmount})::numeric`
        })
            .from(sales)
            .where(filter)
            .groupBy(sql`DATE(${sales.createdAt})`)
            .orderBy(sql`DATE(${sales.createdAt})`);

        return dailyRevenue.map(d => ({
            date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            revenue: parseFloat(d.revenue)
        }));
    },

    /**
     * Gets top 10 best selling products
     */
    getTopProducts: async (filters, limit = 10) => {
        const filter = buildDateFilter(sales.createdAt, filters.startDate, filters.endDate);
        return await db.select({
            id: products.id,
            name: products.name,
            qtySold: sql`SUM(${saleItems.qty} - ${saleItems.returnedQty})::int`,
            revenue: sql`SUM((${saleItems.qty} - ${saleItems.returnedQty}) * ${saleItems.price})::numeric`
        })
            .from(saleItems)
            .innerJoin(sales, eq(saleItems.saleId, sales.id))
            .innerJoin(products, eq(saleItems.productId, products.id))
            .where(filter)
            .groupBy(products.id, products.name)
            .orderBy(desc(sql`SUM(${saleItems.lineTotal})`))
            .limit(limit);
    },

    /**
     * Hits customer spend stats
     */
    getCustomerStats: async (filters, limit = 10) => {
        const filter = buildDateFilter(sales.createdAt, filters.startDate, filters.endDate);
        return await db.select({
            id: customers.id,
            name: customers.name,
            totalOrders: sql`COUNT(${sales.id})::int`,
            totalSpent: sql`SUM(${sales.total} - ${sales.returnedAmount})::numeric`
        })
            .from(sales)
            .innerJoin(customers, eq(sales.customerId, customers.id))
            .where(filter)
            .groupBy(customers.id, customers.name)
            .orderBy(desc(sql`SUM(${sales.total})`))
            .limit(limit);
    }
};

module.exports = ReportsService;
