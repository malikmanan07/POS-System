const { gte, lte, and } = require("drizzle-orm");

/**
 * Builds a Drizzle where clause for a date range on a specific column
 * @param {Object} column - The Drizzle table column (e.g., sales.createdAt)
 * @param {String} startDate - "YYYY-MM-DD"
 * @param {String} endDate - "YYYY-MM-DD"
 * @returns {Object} - Drizzle filtering clause
 */
exports.buildDateFilter = (column, startDate, endDate) => {
    let internalWhere = [];

    if (startDate) {
        internalWhere.push(gte(column, new Date(startDate)));
    }

    if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        internalWhere.push(lte(column, end));
    }

    return internalWhere.length > 0 ? and(...internalWhere) : undefined;
};
