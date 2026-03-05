const pool = require("../config/db");
const { eq, and, sql, asc, desc } = require("drizzle-orm");
const { products, categories, stockMovements } = require("../db/schema");
const { logActivity } = require("../utils/logger");

const db = pool.db;

// GET /api/stock
exports.getStockStatus = async (req, res) => {
    try {
        const businessId = req.businessId;
        const result = await db.select({
            id: products.id,
            name: products.name,
            sku: products.sku,
            stock: products.stock,
            price: products.price,
            alert_quantity: products.alertQuantity,
            category_name: categories.name
        })
            .from(products)
            .leftJoin(categories, and(
                eq(products.categoryId, categories.id),
                eq(categories.businessId, businessId)
            ))
            .where(eq(products.businessId, businessId))
            .orderBy(asc(products.stock));

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// POST /api/stock/adjust
exports.adjustStock = async (req, res) => {
    try {
        const { product_id, type, qty, note, reference } = req.body;

        if (!product_id || !type || qty === undefined) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const result = await db.transaction(async (tx) => {
            // 1. Get current stock
            const [prod] = await tx.select({ stock: products.stock })
                .from(products)
                .where(and(
                    eq(products.id, product_id),
                    eq(products.businessId, req.businessId)
                ))
                .limit(1);

            if (!prod) {
                throw new Error("Product not found");
            }

            const currentStock = prod.stock;
            let newStock = currentStock;
            let movementQty = parseInt(qty);

            if (type === "increase" || type === "return") {
                newStock += movementQty;
            } else if (type === "decrease" || type === "damaged") {
                newStock -= movementQty;
            } else if (type === "adjustment") {
                newStock = movementQty;
                movementQty = newStock - currentStock; // Calculate the delta for history
            } else {
                throw new Error("Invalid adjustment type");
            }

            // 2. Update product stock
            await tx.update(products).set({ stock: newStock }).where(and(eq(products.id, product_id), eq(products.businessId, req.businessId)));

            // 3. Record movement
            await tx.insert(stockMovements).values({
                businessId: req.businessId,
                productId: product_id,
                type,
                qty: movementQty,
                reference: reference || "Manual Adjustment",
                note: note || ""
            });

            return newStock;
        });

        // Fetch product name for logging
        const [prodInfo] = await db.select({ name: products.name })
            .from(products)
            .where(and(
                eq(products.id, product_id),
                eq(products.businessId, req.businessId)
            ))
            .limit(1);

        // Activity Log
        await logActivity({
            userId: req.user?.id,
            businessId: req.businessId,
            userName: req.user?.name,
            userRole: req.user?.roles,
            action: 'UPDATE',
            module: 'INVENTORY',
            details: `${req.user?.roles?.[0] || 'User'} (${req.user?.name}) adjusted stock for ${prodInfo?.name || 'Product #' + product_id} (${type}: ${qty})`,
            ipAddress: req.ip
        });

        res.json({ message: "Stock adjusted successfully", newStock: result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /api/stock/history
exports.getMovementHistory = async (req, res) => {
    try {
        const limitArg = req.query.limit;
        const page = parseInt(req.query.page) || 1;
        const limit = limitArg === 'all' ? null : (parseInt(limitArg) || 10);
        const offset = limit ? (page - 1) * limit : null;

        let query = db.select({
            id: stockMovements.id,
            productId: stockMovements.productId,
            type: stockMovements.type,
            qty: stockMovements.qty,
            reference: stockMovements.reference,
            note: stockMovements.note,
            created_at: stockMovements.createdAt,
            product_name: products.name,
            sku: products.sku
        })
            .from(stockMovements)
            .innerJoin(products, and(eq(stockMovements.productId, products.id), eq(products.businessId, req.businessId)))
            .where(eq(stockMovements.businessId, req.businessId))
            .orderBy(desc(stockMovements.createdAt));

        if (limit) {
            query = query.limit(limit).offset(offset);
        }

        const result = await query;

        if (!limit) {
            return res.json(result);
        }

        // Get total count for pagination
        const [totalCount] = await db.select({ count: sql`count(*)::int` })
            .from(stockMovements)
            .where(eq(stockMovements.businessId, req.businessId));

        res.json({
            data: result,
            pagination: {
                total: totalCount.count,
                page,
                limit,
                pages: Math.ceil(totalCount.count / limit)
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
