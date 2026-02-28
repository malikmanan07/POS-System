const pool = require("../config/db");
const { eq, asc, sql } = require("drizzle-orm");
const { alias } = require("drizzle-orm/pg-core");
const { categories, products } = require("../db/schema");
const { logActivity } = require("../utils/logger");

const db = pool.db;

// GET /api/categories
exports.getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = req.query.limit === 'all' ? null : (parseInt(req.query.limit) || 10);
    const offset = limit ? (page - 1) * limit : null;

    const parentAlias = alias(categories, "parent");

    let query = db
      .select({
        id: categories.id,
        name: categories.name,
        parentId: categories.parentId,
        parentName: parentAlias.name,
        createdAt: categories.createdAt,
      })
      .from(categories)
      .leftJoin(parentAlias, eq(categories.parentId, parentAlias.id))
      .orderBy(asc(categories.name));

    if (limit) {
      query = query.limit(limit).offset(offset);
    }

    const result = await query;

    // Get total count
    const [countResult] = await db.select({ count: sql`count(*)::int` }).from(categories);
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

// POST /api/categories
exports.create = async (req, res) => {
  try {
    const { name, parentId } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });

    const [result] = await db.insert(categories).values({
      name,
      parentId: parentId ? parseInt(parentId) : null
    }).returning();
    // Activity Log
    await logActivity({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.roles,
      action: 'CREATE',
      module: 'CATEGORIES',
      details: `${req.user?.roles?.[0] || 'User'} (${req.user?.name}) created category: ${result.name}`,
      ipAddress: req.ip
    });

    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/categories/:id
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, parentId } = req.body;

    // Prevent direct self-parenting
    if (parentId && parseInt(parentId) === parseInt(id)) {
      return res.status(400).json({ error: "A category cannot be its own parent" });
    }

    const [result] = await db
      .update(categories)
      .set({
        name,
        parentId: parentId ? parseInt(parentId) : null,
        updatedAt: new Date()
      })
      .where(eq(categories.id, id))
      .returning();

    if (!result) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Activity Log
    await logActivity({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.roles,
      action: 'UPDATE',
      module: 'CATEGORIES',
      details: `${req.user?.roles?.[0] || 'User'} (${req.user?.name}) updated category: ${result.name}`,
      ipAddress: req.ip
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/categories/:id
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if products exist in this category before deleting
    const [productCount] = await db
      .select({ count: sql`count(*)::int` })
      .from(products)
      .where(eq(products.categoryId, id));

    if (productCount.count > 0) {
      return res.status(400).json({ error: "Cannot delete category with associated products" });
    }

    // Check if sub-categories exist
    const [subCatCount] = await db
      .select({ count: sql`count(*)::int` })
      .from(categories)
      .where(eq(categories.parentId, id));

    if (subCatCount.count > 0) {
      return res.status(400).json({ error: "Cannot delete category that has sub-categories" });
    }

    const [result] = await db.delete(categories).where(eq(categories.id, id)).returning();
    if (!result) {
      return res.status(404).json({ error: "Category not found" });
    }
    // Activity Log
    await logActivity({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.roles,
      action: 'DELETE',
      module: 'CATEGORIES',
      details: `${req.user?.roles?.[0] || 'User'} (${req.user?.name}) deleted category: ${result.name}`,
      ipAddress: req.ip
    });

    res.json({ message: "Category deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
