const express = require("express");
const cors = require("cors");
require("dotenv").config();
const pool = require("./src/config/db");
const authRoutes = require("./src/routes/auth.routes");
const productRoutes = require("./src/routes/product.routes");
const roleRoutes = require("./src/routes/role.routes");
const userRoutes = require("./src/routes/user.routes");
const categoryRoutes = require("./src/routes/category.routes");
const customerRoutes = require("./src/routes/customer.routes");
const saleRoutes = require("./src/routes/sale.routes");
const dashboardRoutes = require("./src/routes/dashboard.routes");
const settingsRoutes = require("./src/routes/settings.routes");

const stockRoutes = require("./src/routes/stock.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/settings", settingsRoutes);

app.use("/api/stock", stockRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));