const ReportsService = require("../services/reports.service");

/**
 * GET /api/reports/analytics
 */
exports.getAnalytics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const businessId = req.businessId;
        const filters = { startDate, endDate };

        const [summary, chartData, topProducts, customerStats] = await Promise.all([
            ReportsService.getSummary(filters, businessId),
            ReportsService.getDailyRevenue(filters, businessId),
            ReportsService.getTopProducts(filters, businessId),
            ReportsService.getCustomerStats(filters, businessId)
        ]);

        res.json({
            summary,
            chartData,
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
        const businessId = req.businessId;
        const topProducts = await ReportsService.getTopProducts({ startDate, endDate }, businessId, 50);

        let csv = "Product Name,Qty Sold,Total Revenue\n";
        topProducts.forEach(p => {
            csv += `${p.name},${p.qtySold},${p.revenue}\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=sales_report.csv');
        res.send(csv);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

