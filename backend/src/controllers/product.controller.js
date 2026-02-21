const pool = require("../config/db");

// GET /api/products
exports.getAll = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/products
exports.create = async (req, res) => {
  try {
    const { name, sku, price, stock } = req.body;

    if (!name) return res.status(400).json({ error: "name is required" });

    const result = await pool.query(
      `INSERT INTO products (name, sku, price, stock)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, sku || null, price ?? 0, stock ?? 0]
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
    const { name, sku, price, stock } = req.body;

    const result = await pool.query(
      `UPDATE products
       SET name=$1, sku=$2, price=$3, stock=$4
       WHERE id=$5
       RETURNING *`,
      [name, sku || null, price ?? 0, stock ?? 0, id]
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

    const result = await pool.query("DELETE FROM products WHERE id=$1", [id]);

    if (result.rowCount === 0)
      return res.status(404).json({ error: "Product not found" });

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};