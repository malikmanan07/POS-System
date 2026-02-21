const express = require("express");
const cors = require("cors");
require("dotenv").config();
const initDB = require("./src/db/init");
const pool = require("./src/config/db");
const authRoutes = require("./src/routes/auth.routes");
const productRoutes = require("./src/routes/product.routes");
const roleRoutes = require("./src/routes/role.routes");
const userRoutes = require("./src/routes/user.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/users", userRoutes);

app.get("/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
initDB();
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));