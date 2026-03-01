const pool = require("../config/db");
const { eq, desc, sql } = require("drizzle-orm");
const { products, categories, stockMovements, saleItems } = require("../db/schema");
const { logActivity } = require("../utils/logger");

const db = pool.db;

// GET /api/products
exports.getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = req.query.limit === 'all' ? null : (parseInt(req.query.limit) || 10);
    const offset = limit ? (page - 1) * limit : null;

    let query = db
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        category_id: products.categoryId,
        category_name: categories.name,
        cost_price: products.costPrice,
        price: products.price,
        stock: products.stock,
        alert_quantity: products.alertQuantity,
        is_active: products.isActive,
        image: products.image,
        supplierId: products.supplierId, // <-- Include supplierId
        createdAt: products.createdAt,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .orderBy(desc(products.id));

    if (limit) {
      query = query.limit(limit).offset(offset);
    }

    const result = await query;

    // Get total count
    const [countResult] = await db.select({ count: sql`count(*)::int` }).from(products);
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

// POST /api/products
exports.create = async (req, res) => {
  try {
    const { name, sku, category_id, cost_price, price, stock, is_active, alert_quantity } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    const [product] = await db.insert(products)
      .values({
        name,
        sku: sku || null,
        categoryId: category_id || null,
        supplierId: req.body.supplier_id || null, // <-- Handle supplierId
        costPrice: String(cost_price ?? 0),
        price: String(price ?? 0),
        stock: stock ?? 0,
        isActive: is_active ?? true,
        alertQuantity: alert_quantity ?? 5,
        image: imagePath,
      })
      .returning();

    // Record initial stock movement
    if (product.stock > 0) {
      await db.insert(stockMovements)
        .values({
          productId: product.id,
          type: 'increase',
          qty: product.stock,
          reference: 'Initial Stock',
          note: 'Product created with opening balance',
        });
    }

    // Activity Log
    await logActivity({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.roles,
      action: 'CREATE',
      module: 'PRODUCTS',
      details: `${req.user?.roles?.[0] || 'User'} (${req.user?.name}) created product: ${product.name} (SKU: ${product.sku}) with ${product.stock} stock`,
      ipAddress: req.ip
    });

    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/products/:id
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, sku, category_id, supplier_id, cost_price, price, stock, is_active, alert_quantity } = req.body;
    const updateData = {
      name,
      sku: sku || null,
      categoryId: category_id || null,
      supplierId: supplier_id || null, // <-- Update supplierId
      costPrice: String(cost_price ?? 0),
      price: String(price ?? 0),
      stock: stock ?? 0,
      isActive: is_active ?? true,
      alertQuantity: alert_quantity ?? 5,
    };

    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    } else if (req.body.remove_image === "true") {
      updateData.image = null;
    }

    const [updatedProduct] = await db.update(products)
      .set(updateData)
      .where(eq(products.id, parseInt(id)))
      .returning();

    if (!updatedProduct)
      return res.status(404).json({ error: "Product not found" });

    // Activity Log
    await logActivity({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.roles,
      action: 'UPDATE',
      module: 'PRODUCTS',
      details: `${req.user?.roles?.[0] || 'User'} (${req.user?.name}) updated product: ${updatedProduct.name} (#${updatedProduct.id})`,
      ipAddress: req.ip
    });

    res.json(updatedProduct);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/products/:id
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const productId = parseInt(id);

    // 1. Check if product is used in sales (We keep this as a safety check)
    const existingSales = await db.select({ id: saleItems.id })
      .from(saleItems)
      .where(eq(saleItems.productId, productId))
      .limit(1);

    if (existingSales.length > 0) {
      return res.status(400).json({ error: "Cannot delete product that has sales history" });
    }

    // 2. Delete related stock movements first (to avoid foreign key constraint error)
    await db.delete(stockMovements)
      .where(eq(stockMovements.productId, productId));

    // 3. Delete the product
    const [deletedProduct] = await db.delete(products)
      .where(eq(products.id, productId))
      .returning();

    if (!deletedProduct)
      return res.status(404).json({ error: "Product not found" });

    // Activity Log
    await logActivity({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.roles,
      action: 'DELETE',
      module: 'PRODUCTS',
      details: `${req.user?.roles?.[0] || 'User'} (${req.user?.name}) deleted product: ${deletedProduct.name} (#${deletedProduct.id})`,
      ipAddress: req.ip
    });

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
