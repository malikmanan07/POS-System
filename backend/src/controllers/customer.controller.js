const pool = require("../config/db");

// GET /api/customers
exports.getAll = async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM customers ORDER BY name ASC");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// POST /api/customers
exports.create = async (req, res) => {
    try {
        const { name, phone, email, address } = req.body;
        if (!name) return res.status(400).json({ error: "Name is required" });

        const result = await pool.query(
            `INSERT INTO customers (name, phone, email, address)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
            [name, phone || null, email || null, address || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// PUT /api/customers/:id
exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, email, address } = req.body;

        const result = await pool.query(
            `UPDATE customers
       SET name=$1, phone=$2, email=$3, address=$4
       WHERE id=$5
       RETURNING *`,
            [name, phone || null, email || null, address || null, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Customer not found" });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DELETE /api/customers/:id
exports.remove = async (req, res) => {
    try {
        const { id } = req.params;

        // Optional: Check if customer has sales
        const saleCheck = await pool.query("SELECT id FROM sales WHERE customer_id = $1 LIMIT 1", [id]);
        if (saleCheck.rowCount > 0) {
            return res.status(400).json({ error: "Cannot delete customer with purchase history" });
        }

        const result = await pool.query("DELETE FROM customers WHERE id = $1", [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Customer not found" });
        }
        res.json({ message: "Customer deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
