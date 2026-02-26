const pool = require("../config/db");

// POST /api/sales
exports.create = async (req, res) => {
    const client = await pool.connect();
    try {
        const {
            customer_id,
            items,
            subtotal,
            discount,
            tax,
            total,
            payment_method,
            paid_amount,
            change_amount
        } = req.body;

        // user_id comes from auth middleware (to be implemented if not already there)
        // For now, let's assume it's passed in or we use a fallback
        const user_id = req.user?.id || 1;

        if (!items || items.length === 0) {
            return res.status(400).json({ error: "No items in sale" });
        }

        await client.query("BEGIN");

        // 1. Insert Sale record
        const saleResult = await client.query(
            `INSERT INTO sales (user_id, customer_id, subtotal, discount, tax, total, payment_method, paid_amount, change_amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
            [user_id, customer_id || null, subtotal, discount || 0, tax || 0, total, payment_method || 'cash', paid_amount, change_amount]
        );

        const saleId = saleResult.rows[0].id;

        // 2. Insert Sale Items & Update Stock
        for (const item of items) {
            // Insert item
            await client.query(
                `INSERT INTO sale_items (sale_id, product_id, qty, price, line_total)
             VALUES ($1, $2, $3, $4, $5)`,
                [saleId, item.product_id, item.qty, item.price, item.line_total]
            );

            // Update stock
            const stockUpdate = await client.query(
                `UPDATE products SET stock = stock - $1 WHERE id = $2 RETURNING stock`,
                [item.qty, item.product_id]
            );

            if (stockUpdate.rowCount === 0) {
                throw new Error(`Product ID ${item.product_id} not found`);
            }

            // Optional: Log stock movement
            await client.query(
                `INSERT INTO stock_movements (product_id, type, qty, reference, note)
             VALUES ($1, $2, $3, $4, $5)`,
                [item.product_id, 'out', item.qty, `SALE#${saleId}`, 'Point of sale']
            );
        }

        await client.query("COMMIT");
        res.status(201).json(saleResult.rows[0]);

    } catch (err) {
        await client.query("ROLLBACK");
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
};

// GET /api/sales
// exports.getAll = async (req, res) => {
//     try {
//         const result = await pool.query(`
//       SELECT s.*, u.name as user_name, c.name as customer_name
//       FROM sales s
//       LEFT JOIN users u ON s.user_id = u.id
//       LEFT JOIN customers c ON s.customer_id = c.id
//       ORDER BY s.created_at DESC
//     `);
//         res.json(result.rows);
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// };
// GET /api/sales
exports.getAll = async (req, res) => {
    try {
        // If cashier => only their sales
        const isCashier = req.user?.roles?.some(r => r.toLowerCase() === "cashier");

        const result = isCashier
            ? await pool.query(
                `
          SELECT s.*, u.name as user_name, c.name as customer_name
          FROM sales s
          LEFT JOIN users u ON s.user_id = u.id
          LEFT JOIN customers c ON s.customer_id = c.id
          WHERE s.user_id = $1
          ORDER BY s.created_at DESC
          `,
                [req.user.id]
            )
            : await pool.query(
                `
          SELECT s.*, u.name as user_name, c.name as customer_name
          FROM sales s
          LEFT JOIN users u ON s.user_id = u.id
          LEFT JOIN customers c ON s.customer_id = c.id
          ORDER BY s.created_at DESC
          `
            );

        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /api/sales/:id
exports.getById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const sale = await pool.query(`
      SELECT s.*, u.name as user_name, c.name as customer_name
      FROM sales s
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE s.id = $1
    `, [id]);

        if (sale.rowCount === 0) {
            return res.status(404).json({ error: "Sale not found" });
        }

        if (req.user.roles?.some(r => r.toLowerCase() === "cashier") && sale.rows[0].user_id !== req.user.id) {
            return res.status(403).json({ error: "Access denied" });
        }

        const items = await pool.query(`
      SELECT si.*, p.name as product_name, p.sku
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      WHERE si.sale_id = $1
    `, [id]);

        res.json({
            ...sale.rows[0],
            items: items.rows
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
