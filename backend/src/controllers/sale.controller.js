const pool = require("../config/db");
const { eq, desc, sql, like, or, cast, gte, lte, ilike, and } = require("drizzle-orm");
const { sales, saleItems, products, stockMovements, users, customers } = require("../db/schema");
const { logActivity } = require("../utils/logger");

const db = pool.db;

// POST /api/sales
exports.create = async (req, res) => {
    try {
        const {
            customer_id,
            items,
            subtotal,
            discount,
            tax,
            total,
            payment_method,
            paid_amount,
            change_amount,
            payment_reference
        } = req.body;

        const user_id = req.user?.id || 1;

        if (!items || items.length === 0) {
            return res.status(400).json({ error: "No items in sale" });
        }

        // Validate payment reference for non-cash payments
        const method = (payment_method || 'cash').toLowerCase();
        if ((method === 'card' || method === 'online') && !payment_reference) {
            return res.status(400).json({ error: `Reference / Transaction ID is required for ${payment_method} payments` });
        }

        const saleResult = await db.transaction(async (tx) => {
            // 1. Insert Sale record
            const [newSale] = await tx.insert(sales)
                .values({
                    userId: user_id,
                    customerId: customer_id || null,
                    subtotal: String(subtotal),
                    discount: String(discount || 0),
                    tax: String(tax || 0),
                    total: String(total),
                    paymentMethod: payment_method || 'cash',
                    paidAmount: String(paid_amount),
                    changeAmount: String(change_amount),
                    paymentReference: payment_reference || null,
                })
                .returning();

            // 2. Insert Sale Items & Update Stock
            for (const item of items) {
                // Insert item
                await tx.insert(saleItems)
                    .values({
                        saleId: newSale.id,
                        productId: item.product_id,
                        qty: item.qty,
                        price: String(item.price),
                        lineTotal: String(item.line_total),
                    });

                // Update stock using raw expression for atomic decrement
                const [updatedProduct] = await tx.update(products)
                    .set({
                        stock: sql`${products.stock} - ${item.qty}`,
                    })
                    .where(eq(products.id, item.product_id))
                    .returning({ stock: products.stock });

                if (!updatedProduct) {
                    throw new Error(`Product ID ${item.product_id} not found`);
                }

                // Log stock movement
                await tx.insert(stockMovements)
                    .values({
                        productId: item.product_id,
                        type: 'out',
                        qty: item.qty,
                        reference: `SALE#${newSale.id}`,
                        note: 'Point of sale',
                    });
            }

            return newSale;
        });

        // Activity Log
        await logActivity({
            userId: user_id,
            userName: req.user?.name,
            userRole: req.user?.roles,
            action: 'CREATE',
            module: 'SALES',
            details: `${req.user?.roles?.[0] || 'User'} (${req.user?.name}) processed sale #${saleResult.id} for amount ${total}`,
            ipAddress: req.ip
        });

        res.status(201).json(saleResult);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /api/sales
exports.getAll = async (req, res) => {
    try {
        const isCashier = req.user?.roles?.some(r => r.toLowerCase() === "cashier");
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = req.query.search || "";
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;

        let query = db.select({
            id: sales.id,
            userId: sales.userId,
            customerId: sales.customerId,
            subtotal: sales.subtotal,
            discount: sales.discount,
            tax: sales.tax,
            total: sales.total,
            payment_method: sales.paymentMethod,
            paid_amount: sales.paidAmount,
            change_amount: sales.changeAmount,
            payment_reference: sales.paymentReference,
            created_at: sales.createdAt,
            user_name: users.name,
            customer_name: customers.name,
        })
            .from(sales)
            .leftJoin(users, eq(sales.userId, users.id))
            .leftJoin(customers, eq(sales.customerId, customers.id));

        const conditions = [];

        if (isCashier) {
            conditions.push(eq(sales.userId, req.user.id));
        }

        if (search) {
            const searchPattern = `%${search}%`;
            const searchConditions = [
                ilike(customers.name, searchPattern),
                ilike(sales.paymentReference, searchPattern)
            ];

            // If search is a number, try matching ID
            if (!isNaN(parseInt(search))) {
                searchConditions.push(sql`${sales.id}::text ILIKE ${searchPattern}`);
            }

            conditions.push(or(...searchConditions));
        }

        if (startDate) {
            conditions.push(gte(sales.createdAt, new Date(startDate)));
        }

        if (endDate) {
            // Add one day to endDate to include the full day
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            conditions.push(lte(sales.createdAt, end));
        }

        const where = conditions.length > 0 ? and(...conditions) : undefined;

        const result = await query
            .where(where)
            .orderBy(desc(sales.createdAt))
            .limit(limit)
            .offset(offset);

        // Get total count for pagination
        let countQuery = db.select({ count: sql`count(*)::int` }).from(sales)
            .leftJoin(customers, eq(sales.customerId, customers.id))
            .where(where);

        const [totalCount] = await countQuery;

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

// GET /api/sales/:id
exports.getById = async (req, res) => {
    try {
        const { id } = req.params;
        const saleId = parseInt(id);

        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const [sale] = await db.select({
            id: sales.id,
            userId: sales.userId,
            customerId: sales.customerId,
            subtotal: sales.subtotal,
            discount: sales.discount,
            tax: sales.tax,
            total: sales.total,
            payment_method: sales.paymentMethod,
            payment_reference: sales.paymentReference,
            paid_amount: sales.paidAmount,
            change_amount: sales.changeAmount,
            created_at: sales.createdAt,
            user_name: users.name,
            customer_name: customers.name,
        })
            .from(sales)
            .leftJoin(users, eq(sales.userId, users.id))
            .leftJoin(customers, eq(sales.customerId, customers.id))
            .where(eq(sales.id, saleId));

        if (!sale) {
            return res.status(404).json({ error: "Sale not found" });
        }

        if (req.user.roles?.some(r => r.toLowerCase() === "cashier") && sale.userId !== req.user.id) {
            return res.status(403).json({ error: "Access denied" });
        }

        const items = await db.select({
            id: saleItems.id,
            saleId: saleItems.saleId,
            productId: saleItems.productId,
            qty: saleItems.qty,
            price: saleItems.price,
            line_total: saleItems.lineTotal,
            product_name: products.name,
            sku: products.sku,
        })
            .from(saleItems)
            .innerJoin(products, eq(saleItems.productId, products.id))
            .where(eq(saleItems.saleId, saleId));

        res.json({
            ...sale,
            items
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
