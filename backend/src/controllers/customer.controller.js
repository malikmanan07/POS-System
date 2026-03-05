const pool = require("../config/db");
const { eq, and, asc, desc, sql, or, ilike } = require("drizzle-orm");
const { customers, sales, saleItems, products } = require("../db/schema");
const { logActivity } = require("../utils/logger");

const db = pool.db;

// GET /api/customers
exports.getAll = async (req, res) => {
    try {
        const businessId = req.businessId;
        const page = parseInt(req.query.page) || 1;
        const limit = req.query.limit === 'all' ? null : (parseInt(req.query.limit) || 10);
        const search = req.query.search || "";
        const offset = limit ? (page - 1) * limit : null;

        let whereClause = eq(customers.businessId, businessId);
        if (search) {
            whereClause = and(
                whereClause,
                or(
                    ilike(customers.name, `%${search}%`),
                    ilike(customers.phone, `%${search}%`)
                )
            );
        }

        let query = db.select()
            .from(customers)
            .where(whereClause)
            .orderBy(asc(customers.name));

        if (limit) {
            query = query.limit(limit).offset(offset);
        }

        const result = await query;

        // Get total count for pagination with search filter
        const [countResult] = await db.select({ count: sql`count(*)::int` })
            .from(customers)
            .where(whereClause);
        const total = countResult.count;

        if (limit) {
            res.json({
                data: result,
                pagination: {
                    total,
                    totalPages: Math.ceil(total / limit),
                    currentPage: page,
                    limit
                }
            });
        } else {
            res.json(result);
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /api/customers/:id/history
exports.getHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const customerId = parseInt(id);

        const result = await db.select({
            id: sales.id,
            total: sales.total,
            paid_amount: sales.paidAmount,
            change_amount: sales.changeAmount,
            created_at: sales.createdAt,
            item_qty: saleItems.qty,
            item_price: saleItems.price,
            item_line_total: saleItems.lineTotal,
            product_name: products.name,
            product_image: products.image,
        })
            .from(sales)
            .innerJoin(saleItems, eq(sales.id, saleItems.saleId))
            .innerJoin(products, eq(saleItems.productId, products.id))
            .where(and(
                eq(sales.customerId, customerId),
                eq(sales.businessId, req.businessId)
            ))
            .orderBy(desc(sales.createdAt));

        // Group by sale ID
        const history = result.reduce((acc, curr) => {
            const sale = acc.find(s => s.id === curr.id);
            const item = {
                name: curr.product_name,
                image: curr.product_image,
                qty: curr.item_qty,
                price: curr.item_price,
                line_total: curr.item_line_total
            };

            if (sale) {
                sale.items.push(item);
            } else {
                acc.push({
                    id: curr.id,
                    total: curr.total,
                    paid_amount: curr.paid_amount,
                    change_amount: curr.change_amount,
                    created_at: curr.created_at,
                    items: [item]
                });
            }
            return acc;
        }, []);

        res.json(history);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// POST /api/customers
exports.create = async (req, res) => {
    try {
        const { name, phone, email, address } = req.body;
        if (!name) return res.status(400).json({ error: "Name is required" });

        const [newCustomer] = await db.insert(customers)
            .values({
                businessId: req.businessId,
                name,
                phone: phone || null,
                email: email || null,
                address: address || null,
            })
            .returning();

        // Activity Log
        await logActivity({
            userId: req.user?.id,
            businessId: req.businessId,
            userName: req.user?.name,
            userRole: req.user?.roles,
            action: 'CREATE',
            module: 'CUSTOMERS',
            details: `${req.user?.roles?.[0] || 'User'} (${req.user?.name}) added new customer: ${newCustomer.name}`,
            ipAddress: req.ip
        });

        res.status(201).json(newCustomer);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// PUT /api/customers/:id
exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, email, address } = req.body;

        const [updatedCustomer] = await db.update(customers)
            .set({
                name,
                phone: phone || null,
                email: email || null,
                address: address || null,
            })
            .where(and(
                eq(customers.id, parseInt(id)),
                eq(customers.businessId, req.businessId)
            ))
            .returning();

        if (!updatedCustomer) {
            return res.status(404).json({ error: "Customer not found" });
        }
        // Activity Log
        await logActivity({
            userId: req.user?.id,
            businessId: req.businessId,
            userName: req.user?.name,
            userRole: req.user?.roles,
            action: 'UPDATE',
            module: 'CUSTOMERS',
            details: `${req.user?.roles?.[0] || 'User'} (${req.user?.name}) updated customer: ${updatedCustomer.name}`,
            ipAddress: req.ip
        });

        res.json(updatedCustomer);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DELETE /api/customers/:id
exports.remove = async (req, res) => {
    try {
        if (req.user?.roles?.some(r => r.toLowerCase() === "cashier")) {
            return res.status(403).json({ error: "Access denied" });
        }
        const { id } = req.params;
        const customerId = parseInt(id);

        // Check if customer has sales
        const existingSales = await db.select({ id: sales.id })
            .from(sales)
            .where(and(
                eq(sales.customerId, customerId),
                eq(sales.businessId, req.businessId)
            ))
            .limit(1);

        if (existingSales.length > 0) {
            return res.status(400).json({ error: "Cannot delete customer with purchase history" });
        }

        const [deletedCustomer] = await db.delete(customers)
            .where(and(
                eq(customers.id, customerId),
                eq(customers.businessId, req.businessId)
            ))
            .returning();

        if (!deletedCustomer) {
            return res.status(404).json({ error: "Customer not found" });
        }
        // Activity Log
        await logActivity({
            userId: req.user?.id,
            businessId: req.businessId,
            userName: req.user?.name,
            userRole: req.user?.roles,
            action: 'DELETE',
            module: 'CUSTOMERS',
            details: `${req.user?.roles?.[0] || 'User'} (${req.user?.name}) deleted customer: ${deletedCustomer.name}`,
            ipAddress: req.ip
        });

        res.json({ message: "Customer deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
