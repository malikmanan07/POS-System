const pool = require("../config/db");

// GET /api/products
exports.getAll = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      ORDER BY p.id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/products
exports.create = async (req, res) => {
  try {
    const { name, sku, category_id, cost_price, price, stock, is_active } = req.body;

    if (!name) return res.status(400).json({ error: "Name is required" });

    const result = await pool.query(
      `INSERT INTO products (name, sku, category_id, cost_price, price, stock, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        name,
        sku || null,
        category_id || null,
        cost_price ?? 0,
        price ?? 0,
        stock ?? 0,
        is_active ?? true
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/products/:id
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, sku, category_id, cost_price, price, stock, is_active } = req.body;

    const result = await pool.query(
      `UPDATE products
       SET name=$1, sku=$2, category_id=$3, cost_price=$4, price=$5, stock=$6, is_active=$7
       WHERE id=$8
       RETURNING *`,
      [
        name,
        sku || null,
        category_id || null,
        cost_price ?? 0,
        price ?? 0,
        stock ?? 0,
        is_active ?? true,
        id
      ]
    );

    if (result.rowCount === 0)
      return res.status(404).json({ error: "Product not found" });

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/products/:id
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;

    // Optional: Check if product is used in sales
    const saleCheck = await pool.query("SELECT id FROM sale_items WHERE product_id = $1 LIMIT 1", [id]);
    if (saleCheck.rowCount > 0) {
      return res.status(400).json({ error: "Cannot delete product that has sales history" });
    }

    const result = await pool.query("DELETE FROM products WHERE id=$1", [id]);

    if (result.rowCount === 0)
      return res.status(404).json({ error: "Product not found" });

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};