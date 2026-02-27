const pool = require("../config/db");
const { eq, asc, sql } = require("drizzle-orm");
const { categories, products } = require("../db/schema");

const db = pool.db;

// GET /api/categories
exports.getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = req.query.limit === 'all' ? null : (parseInt(req.query.limit) || 10);
    const offset = limit ? (page - 1) * limit : null;

    let query = db.select().from(categories).orderBy(asc(categories.name));

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
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });

    const [result] = await db.insert(categories).values({ name }).returning();
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/categories/:id
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const [result] = await db
      .update(categories)
      .set({ name, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();

    if (!result) {
      return res.status(404).json({ error: "Category not found" });
    }
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

    const [result] = await db.delete(categories).where(eq(categories.id, id)).returning();
    if (!result) {
      return res.status(404).json({ error: "Category not found" });
    }
    res.json({ message: "Category deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
