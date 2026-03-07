const pool = require("../config/db");
const { eq, and, asc, desc, sql, count } = require("drizzle-orm");
const { suppliers, products, stockMovements, productBatches } = require("../db/schema");
const { logActivity } = require("../utils/logger");

const db = pool.db;

// GET /api/suppliers
exports.getAll = async (req, res) => {
    try {
        const businessId = req.businessId;
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
            .leftJoin(products, and(
                eq(suppliers.id, products.supplierId),
                eq(products.businessId, businessId)
            ))
            .where(eq(suppliers.businessId, businessId))
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
        const supplierId = parseInt(id);

        const result = await db.query.products.findMany({
            where: and(
                eq(products.supplierId, supplierId),
                eq(products.businessId, req.businessId)
            ),
            with: {
                productBatches: {
                    where: and(
                        eq(productBatches.businessId, req.businessId),
                        sql`${productBatches.remainingQty} > 0`
                    ),
                    orderBy: [desc(productBatches.createdAt)]
                }
            }
        });

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /api/suppliers/:id/history
exports.getHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const supplierId = parseInt(id);

        const history = await db.select({
            id: stockMovements.id,
            productName: products.name,
            sku: products.sku,
            qty: stockMovements.qty,
            purchasePrice: stockMovements.purchaseCost,
            totalCost: sql`${stockMovements.qty} * ${stockMovements.purchaseCost}`,
            date: stockMovements.createdAt,
            reference: stockMovements.reference,
            note: stockMovements.note
        })
            .from(stockMovements)
            .innerJoin(products, eq(stockMovements.productId, products.id))
            .where(and(
                eq(products.supplierId, supplierId),
                eq(products.businessId, req.businessId),
                eq(stockMovements.type, 'increase')
            ))
            .orderBy(desc(stockMovements.createdAt));

        // Calculate grand total from this supplier
        const [summary] = await db.select({
            totalPurchased: sql`COALESCE(SUM(${stockMovements.qty} * ${stockMovements.purchaseCost}), 0)::numeric`
        })
            .from(stockMovements)
            .innerJoin(products, eq(stockMovements.productId, products.id))
            .where(and(
                eq(products.supplierId, supplierId),
                eq(products.businessId, req.businessId),
                eq(stockMovements.type, 'increase')
            ));

        res.json({
            history,
            totalPurchased: summary?.totalPurchased || 0
        });
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
            .where(and(
                eq(suppliers.id, parseInt(id)),
                eq(suppliers.businessId, req.businessId)
            ))
            .returning();

        if (!updatedSupplier) {
            return res.status(404).json({ error: "Supplier not found" });
        }

        // Activity Log
        await logActivity({
            userId: req.user?.id,
            businessId: req.businessId,
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
            .where(and(
                eq(suppliers.id, supplierId),
                eq(suppliers.businessId, req.businessId)
            ))
            .returning();

        if (!deletedSupplier) {
            return res.status(404).json({ error: "Supplier not found" });
        }

        // Activity Log
        await logActivity({
            userId: req.user?.id,
            businessId: req.businessId,
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
