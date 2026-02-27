const pool = require("../config/db");
const { eq, asc, sql, or, ilike } = require("drizzle-orm");
const { customers, sales } = require("../db/schema");

const db = pool.db;

// GET /api/customers
exports.getAll = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || "";
        const offset = (page - 1) * limit;

        let whereClause = undefined;
        if (search) {
            whereClause = or(
                ilike(customers.name, `%${search}%`),
                ilike(customers.phone, `%${search}%`)
            );
        }

        const result = await db.select()
            .from(customers)
            .where(whereClause)
            .orderBy(asc(customers.name))
            .limit(limit)
            .offset(offset);

        // Get total count for pagination with search filter
        let countQuery = db.select({ count: sql`count(*)::int` }).from(customers);
        if (whereClause) {
            countQuery = countQuery.where(whereClause);
        }
        const [countResult] = await countQuery;
        const total = countResult.count;

        res.json({
            data: result,
            pagination: {
                total,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                limit
            }
        });
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
                name,
                phone: phone || null,
                email: email || null,
                address: address || null,
            })
            .returning();

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
            .where(eq(customers.id, parseInt(id)))
            .returning();

        if (!updatedCustomer) {
            return res.status(404).json({ error: "Customer not found" });
        }
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
            .where(eq(sales.customerId, customerId))
            .limit(1);

        if (existingSales.length > 0) {
            return res.status(400).json({ error: "Cannot delete customer with purchase history" });
        }

        const [deletedCustomer] = await db.delete(customers)
            .where(eq(customers.id, customerId))
            .returning();

        if (!deletedCustomer) {
            return res.status(404).json({ error: "Customer not found" });
        }
        res.json({ message: "Customer deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
