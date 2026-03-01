const pool = require("../config/db");
const { eq, asc, desc, sql, inArray } = require("drizzle-orm");
const { discounts, discountProducts, discountCategories, products, categories } = require("../db/schema");
const { logActivity } = require("../utils/logger");

const db = pool.db;

// GET /api/discounts
exports.getAll = async (req, res) => {
    try {
        const result = await db.query.discounts.findMany({
            with: {
                products: { with: { product: true } },
                categories: { with: { category: true } }
            },
            orderBy: [desc(discounts.id)]
        });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// POST /api/discounts
exports.create = async (req, res) => {
    try {
        const { name, type, value, startDate, endDate, isActive, productIds, categoryIds } = req.body;

        if (!name || !value) return res.status(400).json({ error: "Name and value are required" });

        const newDiscount = await db.transaction(async (tx) => {
            const [inserted] = await tx.insert(discounts)
                .values({
                    name,
                    type,
                    value: String(value),
                    startDate: startDate ? new Date(startDate) : null,
                    endDate: endDate ? new Date(endDate) : null,
                    isActive: isActive ?? true
                })
                .returning();

            if (productIds && productIds.length > 0) {
                await tx.insert(discountProducts).values(
                    productIds.map(pId => ({ discountId: inserted.id, productId: pId }))
                );
            }

            if (categoryIds && categoryIds.length > 0) {
                await tx.insert(discountCategories).values(
                    categoryIds.map(cId => ({ discountId: inserted.id, categoryId: cId }))
                );
            }

            return inserted;
        });

        await logActivity({
            userId: req.user?.id,
            userName: req.user?.name,
            userRole: req.user?.roles,
            action: 'CREATE',
            module: 'DISCOUNTS',
            details: `Created discount: ${name}`,
            ipAddress: req.ip
        });

        res.status(201).json(newDiscount);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// PUT /api/discounts/:id
exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type, value, startDate, endDate, isActive, productIds, categoryIds } = req.body;

        const updated = await db.transaction(async (tx) => {
            const [item] = await tx.update(discounts)
                .set({
                    name,
                    type,
                    value: String(value),
                    startDate: startDate ? new Date(startDate) : null,
                    endDate: endDate ? new Date(endDate) : null,
                    isActive: isActive ?? true
                })
                .where(eq(discounts.id, parseInt(id)))
                .returning();

            if (!item) throw new Error("Discount not found");

            // Sync Products
            await tx.delete(discountProducts).where(eq(discountProducts.discountId, item.id));
            if (productIds && productIds.length > 0) {
                await tx.insert(discountProducts).values(
                    productIds.map(pId => ({ discountId: item.id, productId: pId }))
                );
            }

            // Sync Categories
            await tx.delete(discountCategories).where(eq(discountCategories.discountId, item.id));
            if (categoryIds && categoryIds.length > 0) {
                await tx.insert(discountCategories).values(
                    categoryIds.map(cId => ({ discountId: item.id, categoryId: cId }))
                );
            }

            return item;
        });

        await logActivity({
            userId: req.user?.id,
            userName: req.user?.name,
            userRole: req.user?.roles,
            action: 'UPDATE',
            module: 'DISCOUNTS',
            details: `Updated discount: ${name}`,
            ipAddress: req.ip
        });

        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DELETE /api/discounts/:id
exports.remove = async (req, res) => {
    try {
        const { id } = req.params;
        const [deleted] = await db.delete(discounts)
            .where(eq(discounts.id, parseInt(id)))
            .returning();

        if (!deleted) return res.status(404).json({ error: "Discount not found" });

        await logActivity({
            userId: req.user?.id,
            userName: req.user?.name,
            userRole: req.user?.roles,
            action: 'DELETE',
            module: 'DISCOUNTS',
            details: `Deleted discount: ${deleted.name}`,
            ipAddress: req.ip
        });

        res.json({ message: "Discount deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
