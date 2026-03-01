const pool = require("../config/db");
const { eq, asc, sql, count } = require("drizzle-orm");
const { suppliers, products } = require("../db/schema");
const { logActivity } = require("../utils/logger");

const db = pool.db;

// GET /api/suppliers
exports.getAll = async (req, res) => {
    try {
        const result = await db.select({
            id: suppliers.id,
            name: suppliers.name,
            phone: suppliers.phone,
            email: suppliers.email,
            address: suppliers.address,
            createdAt: suppliers.createdAt,
            productCount: sql`count(${products.id})::int`
        })
            .from(suppliers)
            .leftJoin(products, eq(suppliers.id, products.supplierId))
            .groupBy(suppliers.id)
            .orderBy(asc(suppliers.name));

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /api/suppliers/:id/products
exports.getProducts = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.select({
            id: products.id,
            name: products.name,
            sku: products.sku,
            price: products.price,
            stock: products.stock,
            image: products.image
        })
            .from(products)
            .where(eq(products.supplierId, parseInt(id)));

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// POST /api/suppliers
exports.create = async (req, res) => {
    try {
        const { name, phone, email, address } = req.body;
        if (!name) return res.status(400).json({ error: "Name is required" });

        const [newSupplier] = await db.insert(suppliers)
            .values({ name, phone, email, address })
            .returning();

        // Activity Log
        await logActivity({
            userId: req.user?.id,
            userName: req.user?.name,
            userRole: req.user?.roles,
            action: 'CREATE',
            module: 'SUPPLIERS',
            details: `Added supplier: ${newSupplier.name}`,
            ipAddress: req.ip
        });

        res.status(201).json(newSupplier);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// PUT /api/suppliers/:id
exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, email, address } = req.body;

        const [updatedSupplier] = await db.update(suppliers)
            .set({ name, phone, email, address })
            .where(eq(suppliers.id, parseInt(id)))
            .returning();

        if (!updatedSupplier) {
            return res.status(404).json({ error: "Supplier not found" });
        }

        // Activity Log
        await logActivity({
            userId: req.user?.id,
            userName: req.user?.name,
            userRole: req.user?.roles,
            action: 'UPDATE',
            module: 'SUPPLIERS',
            details: `Updated supplier: ${updatedSupplier.name}`,
            ipAddress: req.ip
        });

        res.json(updatedSupplier);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DELETE /api/suppliers/:id
exports.remove = async (req, res) => {
    try {
        const { id } = req.params;
        const supplierId = parseInt(id);

        // Optional: Check if products are linked (User wants count, but we should decide if delete is allowed)
        // For now, let's allow it but nullify products (onDelete: "set null" handles this)

        const [deletedSupplier] = await db.delete(suppliers)
            .where(eq(suppliers.id, supplierId))
            .returning();

        if (!deletedSupplier) {
            return res.status(404).json({ error: "Supplier not found" });
        }

        // Activity Log
        await logActivity({
            userId: req.user?.id,
            userName: req.user?.name,
            userRole: req.user?.roles,
            action: 'DELETE',
            module: 'SUPPLIERS',
            details: `Deleted supplier: ${deletedSupplier.name}`,
            ipAddress: req.ip
        });

        res.json({ message: "Supplier deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
