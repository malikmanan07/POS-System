const pool = require("../config/db");
const { eq, desc, sql, like, or, cast, gte, lte, ilike, and } = require("drizzle-orm");
const { sales, saleItems, products, stockMovements, users, customers, shifts } = require("../db/schema");
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
            payment_reference,
            discount_id // <-- Extract discount_id
        } = req.body;

        const user_id = req.user?.id || 1;
        const businessId = req.businessId;

        // Fetch active shift
        const [activeShift] = await db.select()
            .from(shifts)
            .where(and(
                eq(shifts.userId, user_id),
                eq(shifts.businessId, businessId),
                eq(shifts.status, 'active')
            ))
            .limit(1);

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
                    businessId: businessId,
                    userId: user_id,
                    customerId: customer_id || null,
                    subtotal: String(subtotal),
                    discount: String(discount || 0),
                    tax: String(tax || 0),
                    total: String(total),
                    paymentMethod: method,
                    paidAmount: String(paid_amount),
                    changeAmount: String(change_amount),
                    paymentReference: payment_reference || null,
                    discountId: discount_id || null,
                    shiftId: activeShift ? activeShift.id : null, // <-- Link active shift
                })
                .returning();

            // 2. Insert Sale Items & Update Stock
            for (const item of items) {
                // Insert item
                await tx.insert(saleItems)
                    .values({
                        businessId: businessId,
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
                    .where(and(
                        eq(products.id, item.product_id),
                        eq(products.businessId, businessId)
                    ))
                    .returning({ stock: products.stock });

                if (!updatedProduct) {
                    throw new Error(`Product ID ${item.product_id} not found`);
                }

                // Log stock movement
                await tx.insert(stockMovements)
                    .values({
                        businessId: businessId,
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
            businessId: businessId,
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
            status: sales.status,
            returned_amount: sales.returnedAmount,
            created_at: sales.createdAt,
            user_name: users.name,
            customer_name: customers.name,
        })
            .from(sales)
            .leftJoin(users, and(eq(sales.userId, users.id), eq(users.businessId, req.businessId)))
            .leftJoin(customers, and(eq(sales.customerId, customers.id), eq(customers.businessId, req.businessId)));

        const conditions = [eq(sales.businessId, req.businessId)];

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
            status: sales.status,
            returned_amount: sales.returnedAmount,
            created_at: sales.createdAt,
            user_name: users.name,
            customer_name: customers.name,
        })
            .from(sales)
            .leftJoin(users, and(eq(sales.userId, users.id), eq(users.businessId, req.businessId)))
            .leftJoin(customers, and(eq(sales.customerId, customers.id), eq(customers.businessId, req.businessId)))
            .where(and(
                eq(sales.id, saleId),
                eq(sales.businessId, req.businessId)
            ));

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
            returned_qty: saleItems.returnedQty,
            product_name: products.name,
            sku: products.sku,
        })
            .from(saleItems)
            .innerJoin(products, and(eq(saleItems.productId, products.id), eq(products.businessId, req.businessId)))
            .where(and(
                eq(saleItems.saleId, saleId),
                eq(saleItems.businessId, req.businessId)
            ));

        res.json({
            ...sale,
            items
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
// POST /api/sales/:id/return
exports.returnItems = async (req, res) => {
    try {
        const { id } = req.params;
        const { items } = req.body; // Array of { productId, returnQty }
        const saleId = parseInt(id);

        if (!items || items.length === 0) {
            return res.status(400).json({ error: "No items selected for return" });
        }

        const returnResult = await db.transaction(async (tx) => {
            // 1. Fetch the sale
            const [sale] = await tx.select().from(sales).where(and(eq(sales.id, saleId), eq(sales.businessId, req.businessId))).limit(1);
            if (!sale) throw new Error("Sale not found");

            let totalRefund = 0;
            let allItemsReturned = true;
            let someItemsReturned = false;

            // 2. Process each returned item
            for (const rItem of items) {
                const [sItem] = await tx.select()
                    .from(saleItems)
                    .where(and(
                        eq(saleItems.saleId, saleId),
                        eq(saleItems.productId, rItem.productId),
                        eq(saleItems.businessId, req.businessId)
                    ))
                    .limit(1);

                if (!sItem) throw new Error(`Item ${rItem.productId} not found in sale`);

                // Check if already returned
                const newReturnedQty = sItem.returnedQty + rItem.returnQty;
                if (newReturnedQty > sItem.qty) {
                    throw new Error(`Cannot return more than purchased for product ${rItem.productId}`);
                }

                // Update saleItems
                await tx.update(saleItems)
                    .set({ returnedQty: newReturnedQty })
                    .where(and(
                        eq(saleItems.id, sItem.id),
                        eq(saleItems.businessId, req.businessId)
                    ));

                // Calculate refund for this item (proportionate to price)
                const refundAmount = parseFloat(sItem.price) * rItem.returnQty;
                totalRefund += refundAmount;

                // Update product stock
                await tx.update(products)
                    .set({ stock: sql`${products.stock} + ${rItem.returnQty}` })
                    .where(and(
                        eq(products.id, rItem.productId),
                        eq(products.businessId, req.businessId)
                    ));

                // Log movement
                await tx.insert(stockMovements)
                    .values({
                        businessId: req.businessId,
                        productId: rItem.productId,
                        type: 'increase',
                        qty: rItem.returnQty,
                        reference: `RETURN#${saleId}`,
                        note: 'Customer return',
                    });
            }

            // 3. Check final status
            const currentSaleItems = await tx.select().from(saleItems)
                .where(and(
                    eq(saleItems.saleId, saleId),
                    eq(saleItems.businessId, req.businessId)
                ));
            const totalItems = currentSaleItems.reduce((acc, i) => acc + i.qty, 0);
            const totalReturned = currentSaleItems.reduce((acc, i) => acc + i.returnedQty, 0);

            let newStatus = 'completed';
            if (totalReturned >= totalItems) {
                newStatus = 'returned';
            } else if (totalReturned > 0) {
                newStatus = 'partial_return';
            }

            const updatedReturnedAmount = parseFloat(sale.returnedAmount) + totalRefund;

            await tx.update(sales)
                .set({
                    status: newStatus,
                    returnedAmount: String(updatedReturnedAmount)
                })
                .where(and(
                    eq(sales.id, saleId),
                    eq(sales.businessId, req.businessId)
                ));

            // 4. Update Shift (if active shift exists for this user)
            const [activeShift] = await tx.select()
                .from(shifts)
                .where(and(
                    eq(shifts.userId, req.user.id),
                    eq(shifts.businessId, req.businessId),
                    eq(shifts.status, 'active')
                ))
                .limit(1);

            if (activeShift && totalRefund > 0) {
                await tx.update(shifts)
                    .set({
                        expectedCash: sql`${shifts.expectedCash} - ${totalRefund}`,
                        totalSales: sql`${shifts.totalSales} - ${totalRefund}`,
                    })
                    .where(and(
                        eq(shifts.id, activeShift.id),
                        eq(shifts.businessId, req.businessId)
                    ));
            }

            return { refund: totalRefund, status: newStatus };
        });

        // Activity Log
        await logActivity({
            userId: req.user?.id,
            businessId: req.businessId,
            userName: req.user?.name,
            userRole: req.user?.roles,
            action: 'RETURN',
            module: 'SALES',
            details: `Processed return for sale #${saleId}. Refund: ${returnResult.refund}`,
            ipAddress: req.ip
        });

        res.json({ message: "Return processed successfully", ...returnResult });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
