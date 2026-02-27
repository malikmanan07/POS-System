const pool = require("../config/db");
const { eq, desc, sql } = require("drizzle-orm");
const { sales, saleItems, products, stockMovements, users, customers } = require("../db/schema");

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
            change_amount
        } = req.body;

        const user_id = req.user?.id || 1;

        if (!items || items.length === 0) {
            return res.status(400).json({ error: "No items in sale" });
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
            created_at: sales.createdAt,
            user_name: users.name,
            customer_name: customers.name,
        })
            .from(sales)
            .leftJoin(users, eq(sales.userId, users.id))
            .leftJoin(customers, eq(sales.customerId, customers.id));

        if (isCashier) {
            query = query.where(eq(sales.userId, req.user.id));
        }

        const result = await query.orderBy(desc(sales.createdAt)).limit(limit).offset(offset);

        // Get total count for pagination
        let countQuery = db.select({ count: sql`count(*)::int` }).from(sales);
        if (isCashier) {
            countQuery = countQuery.where(eq(sales.userId, req.user.id));
        }
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
