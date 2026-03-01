const {
    pgTable,
    serial,
    varchar,
    text,
    timestamp,
    integer,
    numeric,
    boolean,
    primaryKey,
    index,
    jsonb,
} = require("drizzle-orm/pg-core");
const { relations } = require("drizzle-orm");

// 1️⃣ USERS
const users = pgTable("users", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    email: varchar("email", { length: 120 }).unique().notNull(),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});

// 2️⃣ ROLES
const roles = pgTable("roles", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 50 }).unique().notNull(),
});

// 3️⃣ PERMISSIONS
const permissions = pgTable("permissions", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).unique().notNull(),
});

// 4️⃣ ROLE_PERMISSIONS
const rolePermissions = pgTable(
    "role_permissions",
    {
        roleId: integer("role_id")
            .references(() => roles.id, { onDelete: "cascade" })
            .notNull(),
        permissionId: integer("permission_id")
            .references(() => permissions.id, { onDelete: "cascade" })
            .notNull(),
    },
    (t) => ({
        pk: primaryKey({ columns: [t.roleId, t.permissionId] }),
    })
);

// 5️⃣ USER_ROLES
const userRoles = pgTable(
    "user_roles",
    {
        userId: integer("user_id")
            .references(() => users.id, { onDelete: "cascade" })
            .notNull(),
        roleId: integer("role_id")
            .references(() => roles.id, { onDelete: "cascade" })
            .notNull(),
    },
    (t) => ({
        pk: primaryKey({ columns: [t.userId, t.roleId] }),
    })
);

// 6️⃣ CATEGORIES
const categories = pgTable("categories", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).unique().notNull(),
    parentId: integer("parent_id").references(() => categories.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow(),
});

// 7️⃣ CUSTOMERS
const customers = pgTable("customers", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    phone: varchar("phone", { length: 30 }).unique(),
    email: varchar("email", { length: 120 }),
    address: text("address"),
    createdAt: timestamp("created_at").defaultNow(),
});

// 8️⃣ PRODUCTS
const products = pgTable("products", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 150 }).notNull(),
    sku: varchar("sku", { length: 50 }).unique(),
    categoryId: integer("category_id").references(() => categories.id),
    costPrice: numeric("cost_price", { precision: 10, scale: 2 })
        .notNull()
        .default("0"),
    price: numeric("price", { precision: 10, scale: 2 }).notNull().default("0"),
    stock: integer("stock").notNull().default(0),
    alertQuantity: integer("alert_quantity").notNull().default(5),
    isActive: boolean("is_active").notNull().default(true),
    image: text("image"),
    supplierId: integer("supplier_id").references(() => suppliers.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow(),
});

// 9️⃣ SALES
const sales = pgTable("sales", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id),
    customerId: integer("customer_id").references(() => customers.id),
    discountId: integer("discount_id").references(() => discounts.id, { onDelete: "set null" }), // <-- Campaign link
    subtotal: numeric("subtotal", { precision: 10, scale: 2 })
        .notNull()
        .default("0"),
    discount: numeric("discount", { precision: 10, scale: 2 })
        .notNull()
        .default("0"),
    tax: numeric("tax", { precision: 10, scale: 2 }).notNull().default("0"),
    total: numeric("total", { precision: 10, scale: 2 }).notNull().default("0"),
    paymentMethod: varchar("payment_method", { length: 20 })
        .notNull()
        .default("cash"),
    paidAmount: numeric("paid_amount", { precision: 10, scale: 2 })
        .notNull()
        .default("0"),
    changeAmount: numeric("change_amount", { precision: 10, scale: 2 })
        .notNull()
        .default("0"),
    paymentReference: varchar("payment_reference", { length: 100 }),
    shiftId: integer("shift_id").references(() => shifts.id), // <-- Link to shift
    createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
    return {
        salesCreatedAtIndex: index("sales_created_at_idx").on(table.createdAt),
    }
});

// 18️⃣ SHIFTS
const shifts = pgTable("shifts", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id).notNull(),
    openingBalance: numeric("opening_balance", { precision: 10, scale: 2 }).notNull().default("0"),
    closingBalance: numeric("closing_balance", { precision: 10, scale: 2 }),
    totalSales: numeric("total_sales", { precision: 10, scale: 2 }).default("0"),
    expectedCash: numeric("expected_cash", { precision: 10, scale: 2 }).default("0"),
    startTime: timestamp("start_time").defaultNow().notNull(),
    endTime: timestamp("end_time"),
    status: varchar("status", { length: 20 }).notNull().default("active"), // 'active', 'closed'
    note: text("note"),
});

// 10️⃣ SALE_ITEMS
const saleItems = pgTable("sale_items", {
    id: serial("id").primaryKey(),
    saleId: integer("sale_id")
        .notNull()
        .references(() => sales.id, { onDelete: "cascade" }),
    productId: integer("product_id")
        .notNull()
        .references(() => products.id),
    qty: integer("qty").notNull(),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    lineTotal: numeric("line_total", { precision: 10, scale: 2 }).notNull(),
});

// 11️⃣ STOCK_MOVEMENTS
const stockMovements = pgTable("stock_movements", {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
        .notNull()
        .references(() => products.id),
    type: varchar("type", { length: 10 }).notNull(),
    qty: integer("qty").notNull(),
    reference: varchar("reference", { length: 50 }),
    note: text("note"),
    createdAt: timestamp("created_at").defaultNow(),
});

// 12️⃣ SETTINGS
const settings = pgTable("settings", {
    key: varchar("key", { length: 50 }).primaryKey(),
    value: jsonb("value").notNull(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

// 13️⃣ ACTIVITY_LOGS
const activityLogs = pgTable("activity_logs", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
    userName: varchar("user_name", { length: 150 }),
    userRole: varchar("user_role", { length: 100 }),
    action: varchar("action", { length: 100 }).notNull(), // e.g., 'CREATE', 'UPDATE', 'DELETE', 'LOGIN'
    module: varchar("module", { length: 50 }).notNull(), // e.g., 'SALES', 'STOCK', 'USERS'
    details: text("details"),
    ipAddress: varchar("ip_address", { length: 45 }),
    createdAt: timestamp("created_at").defaultNow(),
});

// 14️⃣ SUPPLIERS
const suppliers = pgTable("suppliers", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 150 }).notNull(),
    phone: varchar("phone", { length: 30 }),
    email: varchar("email", { length: 120 }),
    address: text("address"),
    createdAt: timestamp("created_at").defaultNow(),
});

// 15️⃣ DISCOUNTS
const discounts = pgTable("discounts", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 150 }).notNull(),
    type: varchar("type", { length: 20 }).notNull().default("percentage"), // 'percentage' or 'flat'
    value: numeric("value", { precision: 10, scale: 2 }).notNull(),
    startDate: timestamp("start_date"),
    endDate: timestamp("end_date"),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
});

// 16️⃣ DISCOUNT_PRODUCTS (Many-to-Many)
const discountProducts = pgTable("discount_products", {
    id: serial("id").primaryKey(),
    discountId: integer("discount_id").references(() => discounts.id, { onDelete: "cascade" }),
    productId: integer("product_id").references(() => products.id, { onDelete: "cascade" }),
});

// 17️⃣ DISCOUNT_CATEGORIES (Many-to-Many)
const discountCategories = pgTable("discount_categories", {
    id: serial("id").primaryKey(),
    discountId: integer("discount_id").references(() => discounts.id, { onDelete: "cascade" }),
    categoryId: integer("category_id").references(() => categories.id, { onDelete: "cascade" }),
});

// --- RELATIONS ---

const shiftsRelations = relations(shifts, ({ one, many }) => ({
    user: one(users, { fields: [shifts.userId], references: [users.id] }),
    sales: many(sales),
}));

const usersRelations = relations(users, ({ many }) => ({
    roles: many(userRoles),
    sales: many(sales),
}));

const rolesRelations = relations(roles, ({ many }) => ({
    permissions: many(rolePermissions),
    users: many(userRoles),
}));

const permissionsRelations = relations(permissions, ({ many }) => ({
    roles: many(rolePermissions),
}));

const userRolesRelations = relations(userRoles, ({ one }) => ({
    user: one(users, { fields: [userRoles.userId], references: [users.id] }),
    role: one(roles, { fields: [userRoles.roleId], references: [roles.id] }),
}));

const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
    role: one(roles, { fields: [rolePermissions.roleId], references: [roles.id] }),
    permission: one(permissions, {
        fields: [rolePermissions.permissionId],
        references: [permissions.id],
    }),
}));

const categoriesRelations = relations(categories, ({ one, many }) => ({
    products: many(products),
    parent: one(categories, {
        fields: [categories.parentId],
        references: [categories.id],
        relationName: "categoryChildren",
    }),
    subCategories: many(categories, {
        relationName: "categoryChildren",
    }),
}));

const productsRelations = relations(products, ({ one, many }) => ({
    category: one(categories, {
        fields: [products.categoryId],
        references: [categories.id],
    }),
    supplier: one(suppliers, {
        fields: [products.supplierId],
        references: [suppliers.id],
    }),
    saleItems: many(saleItems),
    stockMovements: many(stockMovements),
}));

const customersRelations = relations(customers, ({ many }) => ({
    sales: many(sales),
}));

const salesRelations = relations(sales, ({ one, many }) => ({
    user: one(users, { fields: [sales.userId], references: [users.id] }),
    customer: one(customers, {
        fields: [sales.customerId],
        references: [customers.id],
    }),
    shift: one(shifts, {
        fields: [sales.shiftId],
        references: [shifts.id],
    }),
    items: many(saleItems),
}));

const saleItemsRelations = relations(saleItems, ({ one }) => ({
    sale: one(sales, { fields: [saleItems.saleId], references: [sales.id] }),
    product: one(products, {
        fields: [saleItems.productId],
        references: [products.id],
    }),
}));

const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
    product: one(products, {
        fields: [stockMovements.productId],
        references: [products.id],
    }),
}));

const activityLogsRelations = relations(activityLogs, ({ one }) => ({
    user: one(users, { fields: [activityLogs.userId], references: [users.id] }),
}));

const suppliersRelations = relations(suppliers, ({ many }) => ({
    products: many(products),
}));

const discountsRelations = relations(discounts, ({ many }) => ({
    products: many(discountProducts),
    categories: many(discountCategories),
}));

const discountProductsRelations = relations(discountProducts, ({ one }) => ({
    discount: one(discounts, { fields: [discountProducts.discountId], references: [discounts.id] }),
    product: one(products, { fields: [discountProducts.productId], references: [products.id] }),
}));

const discountCategoriesRelations = relations(discountCategories, ({ one }) => ({
    discount: one(discounts, { fields: [discountCategories.discountId], references: [discounts.id] }),
    category: one(categories, { fields: [discountCategories.categoryId], references: [categories.id] }),
}));

module.exports = {
    users,
    roles,
    permissions,
    rolePermissions,
    userRoles,
    categories,
    customers,
    products,
    sales,
    saleItems,
    stockMovements,
    settings,
    activityLogs,
    suppliers,
    discounts,
    discountProducts,
    discountCategories,
    shifts,
    // Relations
    usersRelations,
    rolesRelations,
    permissionsRelations,
    userRolesRelations,
    rolePermissionsRelations,
    categoriesRelations,
    productsRelations,
    customersRelations,
    salesRelations,
    saleItemsRelations,
    stockMovementsRelations,
    activityLogsRelations,
    suppliersRelations,
    discountsRelations,
    discountProductsRelations,
    discountCategoriesRelations,
    shiftsRelations,
};
