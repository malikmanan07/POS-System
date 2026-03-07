const pool = require("../config/db");
const { eq, and, desc, sql } = require("drizzle-orm");
const { products, categories, suppliers, stockMovements, saleItems } = require("../db/schema");
const { logActivity } = require("../utils/logger");

const db = pool.db;

// GET /api/products
exports.getAll = async (req, res) => {
  try {
    const businessId = req.businessId;
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
        description: products.description,
        variant_name: products.variantName,
        variant_value: products.variantValue,
        customAttributes: products.customAttributes,
        supplierId: products.supplierId, // <-- Include supplierId
        parentId: products.parentId,
        createdAt: products.createdAt,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.businessId, businessId))
      .orderBy(desc(products.id));

    if (limit) {
      query = query.limit(limit).offset(offset);
    }

    const result = await query;

    // Get total count
    const [countResult] = await db.select({ count: sql`count(*)::int` })
      .from(products)
      .where(eq(products.businessId, businessId));
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
    const { name, sku, category_id, cost_price, price, stock, is_active, alert_quantity, description, variant_name, custom_attributes } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    const [product] = await db.insert(products)
      .values({
        businessId: req.businessId,
        name,
        sku: sku || null,
        categoryId: category_id || null,
        supplierId: req.body.supplier_id || null, // <-- Handle supplierId
        parentId: req.body.parent_id || null,
        costPrice: String(cost_price ?? 0),
        price: String(price ?? 0),
        stock: stock ?? 0,
        isActive: is_active ?? true,
        alertQuantity: alert_quantity ?? 5,
        description: description || null,
        variantName: variant_name || null,
        customAttributes: custom_attributes ? JSON.parse(custom_attributes) : null,
        image: imagePath,
      })
      .returning();

    // Record initial stock movement
    if (product.stock > 0) {
      await db.insert(stockMovements)
        .values({
          businessId: req.businessId,
          productId: product.id,
          type: 'increase',
          qty: product.stock,
          reference: 'Initial Stock',
          note: 'Product created with opening balance',
        });
    }

    let parsedVariants = [];
    if (req.body.variants) {
      if (typeof req.body.variants === 'string') {
        try { parsedVariants = JSON.parse(req.body.variants); } catch (e) { }
      } else if (Array.isArray(req.body.variants)) {
        parsedVariants = req.body.variants;
      }
    }

    // Handle variants if provided
    if (parsedVariants.length > 0) {
      for (const v of parsedVariants) {
        const variantSku = (product.sku ? `${product.sku}-${v.name}` : null);
        const [variant] = await db.insert(products).values({
          businessId: req.businessId,
          name: `${product.name} - ${v.name}`,
          sku: variantSku,
          categoryId: product.categoryId,
          supplierId: product.supplierId,
          parentId: product.id,
          costPrice: String(v.cost_price ?? product.costPrice),
          price: String(v.price ?? product.price),
          stock: v.stock ?? 0,
          isActive: true,
          alertQuantity: v.alert_quantity ?? product.alertQuantity,
          description: v.description || product.description,
          variantValue: v.name || null,
          customAttributes: v.custom_attributes || null,
          image: product.image
        }).returning();

        if (variant.stock > 0) {
          await db.insert(stockMovements).values({
            businessId: req.businessId,
            productId: variant.id,
            type: 'increase',
            qty: variant.stock,
            reference: 'Initial Variant Stock',
            note: 'Variant created with opening balance',
          });
        }
      }
    }

    // Activity Log
    await logActivity({
      userId: req.user?.id,
      businessId: req.businessId,
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
    const { name, sku, category_id, supplier_id, cost_price, price, stock, is_active, alert_quantity, parent_id, description, variant_name, custom_attributes, variants } = req.body;
    const updateData = {
      name,
      sku: sku || null,
      categoryId: category_id || null,
      supplierId: supplier_id || null, // <-- Update supplierId
      parentId: parent_id || null,
      costPrice: String(cost_price ?? 0),
      price: String(price ?? 0),
      stock: stock ?? 0,
      isActive: is_active ?? true,
      alertQuantity: alert_quantity ?? 5,
      description: description || null,
      variantName: variant_name || null,
    };

    if (custom_attributes !== undefined) {
      updateData.customAttributes = custom_attributes ? JSON.parse(custom_attributes) : null;
    }

    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    } else if (req.body.remove_image === "true") {
      updateData.image = null;
    }

    const [updatedProduct] = await db.update(products)
      .set(updateData)
      .where(and(
        eq(products.id, parseInt(id)),
        eq(products.businessId, req.businessId)
      ))
      .returning();

    if (!updatedProduct)
      return res.status(404).json({ error: "Product not found" });

    // Handle variants if provided
    let parsedVariants = [];
    if (variants) {
      if (typeof variants === 'string') {
        try { parsedVariants = JSON.parse(variants); } catch (e) { }
      } else if (Array.isArray(variants)) {
        parsedVariants = variants;
      }
    }

    console.log("UPDATING PRODUCT. Variants received:", parsedVariants.length);

    if (parsedVariants.length > 0) {
      for (const v of parsedVariants) {
        console.log(`Processing variant: ${v.id || 'NEW'} - Name: ${v.name}, Price: ${v.price}, Stock: ${v.stock}`);
        if (v.id) {
          // Update existing variant
          const stockVal = v.stock !== undefined && v.stock !== "" ? Number(v.stock) : 0;

          await db.update(products).set({
            name: `${updatedProduct.name} - ${v.name}`,
            sku: (updatedProduct.sku ? `${updatedProduct.sku}-${v.name}` : null),
            categoryId: updatedProduct.categoryId,
            supplierId: updatedProduct.supplierId,
            costPrice: (v.cost_price && v.cost_price !== "0") ? String(v.cost_price) : updatedProduct.costPrice,
            price: (v.price && v.price !== "0") ? String(v.price) : updatedProduct.price,
            stock: stockVal,
            alertQuantity: v.alert_quantity !== undefined ? Number(v.alert_quantity) : updatedProduct.alertQuantity,
            variantValue: v.name || null,
            customAttributes: v.custom_attributes || null,
          }).where(and(eq(products.id, parseInt(v.id)), eq(products.businessId, req.businessId)));
        } else {
          // Add new variant
          await db.insert(products).values({
            businessId: req.businessId,
            name: `${updatedProduct.name} - ${v.name}`,
            sku: (updatedProduct.sku ? `${updatedProduct.sku}-${v.name}` : null),
            categoryId: updatedProduct.categoryId,
            supplierId: updatedProduct.supplierId,
            parentId: updatedProduct.id,
            costPrice: String(v.cost_price ?? updatedProduct.costPrice),
            price: String(v.price ?? updatedProduct.price),
            stock: v.stock ?? 0,
            isActive: true,
            alertQuantity: v.alert_quantity ?? updatedProduct.alertQuantity,
            description: v.description || updatedProduct.description,
            variantValue: v.name || null,
            customAttributes: v.custom_attributes || null,
            image: updatedProduct.image
          });
        }
      }
    }

    // Activity Log
    await logActivity({
      userId: req.user?.id,
      businessId: req.businessId,
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
      .where(and(
        eq(saleItems.productId, productId),
        eq(saleItems.businessId, req.businessId)
      ))
      .limit(1);

    if (existingSales.length > 0) {
      return res.status(400).json({ error: "Cannot delete product that has sales history" });
    }

    // 2. Delete related stock movements first (to avoid foreign key constraint error)
    await db.delete(stockMovements)
      .where(and(
        eq(stockMovements.productId, productId),
        eq(stockMovements.businessId, req.businessId)
      ));

    // 3. Delete the product
    const [deletedProduct] = await db.delete(products)
      .where(and(
        eq(products.id, productId),
        eq(products.businessId, req.businessId)
      ))
      .returning();

    if (!deletedProduct)
      return res.status(404).json({ error: "Product not found" });

    // Activity Log
    await logActivity({
      userId: req.user?.id,
      businessId: req.businessId,
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

// POST /api/products/bulk
exports.bulkImport = async (req, res) => {
  try {
    const { products: items } = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ error: "Invalid data format" });

    // Fetch all categories and suppliers for matching
    const allCats = await db.select().from(categories).where(eq(categories.businessId, req.businessId));
    const allSups = await db.select().from(suppliers).where(eq(suppliers.businessId, req.businessId));

    let successCount = 0;
    let skipCount = 0;
    const errors = [];

    for (const item of items) {
      try {
        if (!item.name) {
          skipCount++;
          errors.push(`Row missing name`);
          continue;
        }

        // Try to find category ID
        let categoryId = item.category_id;
        if (!categoryId && item.category_name) {
          const match = allCats.find(c => c.name.toLowerCase() === item.category_name.toLowerCase());
          if (match) categoryId = match.id;
        }

        // Try to find supplier ID
        let supplierId = item.supplier_id;
        if (!supplierId && item.supplier_name) {
          const match = allSups.find(s => s.name.toLowerCase() === item.supplier_name.toLowerCase());
          if (match) supplierId = match.id;
        }

        const [product] = await db.insert(products)
          .values({
            businessId: req.businessId,
            name: item.name,
            sku: String(item.sku || "").trim() || null,
            categoryId: categoryId || null,
            supplierId: supplierId || null,
            costPrice: String(item.cost_price ?? 0),
            price: String(item.price ?? 0),
            stock: parseInt(item.stock) || 0,
            isActive: true,
            alertQuantity: parseInt(item.alert_quantity) || 5,
            description: item.description || null,
          })
          .returning();

        // Stock movement
        if (product.stock > 0) {
          await db.insert(stockMovements)
            .values({
              businessId: req.businessId,
              productId: product.id,
              type: 'increase',
              qty: product.stock,
              reference: 'Bulk Import',
              note: 'Imported via CSV',
            });
        }
        successCount++;
      } catch (err) {
        skipCount++;
        errors.push(`${item.name || 'Unknown'}: ${err.message}`);
      }
    }

    await logActivity({
      userId: req.user?.id,
      businessId: req.businessId,
      userName: req.user?.name,
      userRole: req.user?.roles,
      action: 'BULK_IMPORT',
      module: 'PRODUCTS',
      details: `Bulk imported ${successCount} products, skipped ${skipCount}`,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      summary: {
        total: items.length,
        success: successCount,
        skipped: skipCount
      },
      errors
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
