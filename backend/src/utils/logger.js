const pool = require("../config/db");
const { activityLogs } = require("../db/schema");

const db = pool.db;

/**
 * Log a system activity
 * @param {Object} data 
 * @param {number} data.userId 
 * @param {string} data.userName 
 * @param {string} data.userRole 
 * @param {string} data.action - e.g., 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'
 * @param {string} data.module - e.g., 'SALES', 'STOCK', 'USERS', 'AUTH'
 * @param {string} data.details - JSON string or descriptive text
 * @param {string} [data.ipAddress]
 */
exports.logActivity = async ({ userId, businessId, userName, userRole, action, module, details, ipAddress }) => {
    try {
        await db.insert(activityLogs).values({
            userId,
            businessId,
            userName: userName || 'Unknown User',
            userRole: userRole ? (Array.isArray(userRole) ? userRole[0] : userRole) : 'User',
            action: action.toUpperCase(),
            module: module.toUpperCase(),
            details,
            ipAddress: ipAddress || null
        });
    } catch (err) {
        console.error("Failed to log activity:", err.message);
    }
};
