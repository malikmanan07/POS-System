# 🛒 Advanced POS System

A modern, professional Point of Sale system built for retail businesses with multi-tenant SaaS architecture.

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React (Vite) + Bootstrap |
| Backend | Node.js + Express |
| Database | PostgreSQL (Supabase) |
| ORM | Drizzle ORM |
| Auth | JWT + Role-Based Access Control |
| Caching | TanStack React Query v5 |

---

## ✨ Key Features

- **POS Interface** — Barcode scanner support, cart management, automatic discount application, multiple payment methods (Cash, Card, Online)
- **Inventory Management** — Stock tracking, variants, SKUs, purchase cost validation, batch tracking
- **Shift Management** — Cashier shift start/end, opening/closing balance, cash reconciliation
- **Role-Based Access Control** — Super Admin, Admin, Manager, Cashier, Accountant with granular permissions
- **Reports & Analytics** — Revenue charts, best selling products, customer breakdown, export to PDF/CSV
- **Activity Log** — Full audit trail of every action across the system
- **Supplier Management** — Supplier profiles linked to products
- **Discount Management** — Flat and percentage discount campaigns
- **Sales Returns** — Return processing with automatic stock restoration
- **Bulk Product Import** — CSV/Excel import for large product catalogs
- **Multi-Tenant SaaS** — Multiple businesses on one system with complete data isolation
- **Master Dev Console** — Developer dashboard to monitor all businesses

---

## 📁 Project Structure

```
POS-System/
├── backend/          # Node.js + Express API
│   ├── src/
│   │   ├── controllers/    # Business logic
│   │   ├── routes/         # API endpoints
│   │   ├── middleware/      # JWT & permissions
│   │   ├── db/             # Drizzle schema
│   │   └── utils/          # Cron jobs, helpers
│   ├── .env.example
│   └── server.js
└── frontend/         # React + Vite
    └── src/
        ├── pages/          # All screens
        ├── components/     # Reusable UI blocks
        ├── api/            # Axios API functions
        ├── auth/           # Auth context
        └── context/        # Global state
```

---

## ⚙️ Setup Instructions

### Requirements
- Node.js v18+
- PostgreSQL database (Supabase recommended)

### Backend Setup

```bash
cd backend
npm install
```

Copy `.env.example` to `.env` and fill in your values:

```env
PORT=5000
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_secret_key
DEV_EMAIL=your_dev_email
DEV_PASSWORD=your_dev_password
```

Run the backend:
```bash
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Database Setup

1. Open your Supabase project
2. Go to **SQL Editor**
3. Open `database_dump.sql` file
4. Copy all content and paste in SQL Editor
5. Click **Run**

---

## 🔐 Default Access

| Role | Access Level |
|------|-------------|
| Super Admin | Full access to everything |
| Admin | All except system settings |
| Manager | Sales, inventory, reports |
| Cashier | POS and shift management only |
| Accountant | Sales and reports only |

> **New Business?** Go to `/signup` to register your business and get your Super Admin account.

---

## 🚀 Recent Updates (v1.0 Release)

- ✅ Purchase cost validation on all stock operations
- ✅ Real-time stock history with 10-second polling
- ✅ React Query v5 caching across all modules
- ✅ Skeleton loaders replacing full-page spinners
- ✅ Multi-tenant SaaS with complete data isolation
- ✅ Master Dev Console for system monitoring
- ✅ Business suspend/unsuspend from Dev Panel
- ✅ Activity log with 30/90 day auto-cleanup

---

## 📞 Support

For technical support or queries, contact the developer.