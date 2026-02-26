const pool = require("../config/db");

// GET /api/stock
exports.getStockStatus = async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT p.id, p.name, p.sku, p.stock, p.price, p.alert_quantity, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.stock ASC
    `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// POST /api/stock/adjust
exports.adjustStock = async (req, res) => {
    const client = await pool.connect();
    try {
        const { product_id, type, qty, note, reference } = req.body;

        if (!product_id || !type || qty === undefined) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        await client.query("BEGIN");

        // 1. Get current stock
        const prodRes = await client.query("SELECT stock FROM products WHERE id = $1", [product_id]);
        if (prodRes.rowCount === 0) {
            throw new Error("Product not found");
        }
        const currentStock = prodRes.rows[0].stock;
        let newStock = currentStock;
        let movementQty = parseInt(qty);

        if (type === "increase" || type === "return") {
            newStock += movementQty;
        } else if (type === "decrease" || type === "damaged") {
            newStock -= movementQty;
        } else if (type === "adjustment") {
            newStock = movementQty;
            movementQty = newStock - currentStock; // Calculate the delta for history
        } else {
            throw new Error("Invalid adjustment type");
        }

        // 2. Update product stock
        await client.query("UPDATE products SET stock = $1 WHERE id = $2", [newStock, product_id]);

        // 3. Record movement
        await client.query(
            `INSERT INTO stock_movements (product_id, type, qty, reference, note)
       VALUES ($1, $2, $3, $4, $5)`,
            [product_id, type, movementQty, reference || "Manual Adjustment", note || ""]
        );

        await client.query("COMMIT");
        res.json({ message: "Stock adjusted successfully", newStock });
    } catch (err) {
        await client.query("ROLLBACK");
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
};

// GET /api/stock/history
exports.getMovementHistory = async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT sm.*, p.name as product_name, p.sku
      FROM stock_movements sm
      JOIN products p ON sm.product_id = p.id
      ORDER BY sm.created_at DESC
      LIMIT 100
    `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
