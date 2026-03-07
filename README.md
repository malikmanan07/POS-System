# 🚀 Advanced POS System

A modern, full-stack Point of Sale system built with **React**, **Node.js**, **Express**, and **PostgreSQL**.

---

## 🛠 Features
- **Inventory Management**: Track stock, variants, and low stock alerts.
- **Point of Sale (POS)**: Fast billing with barcode support and shift management.
- **Role-Based Access Control (RBAC)**: Manage Super Admin, Admin, and Cashier permissions.
- **Reports & Analytics**: Sales history, activity logs, and dashboard insights.
- **Real-time Updates**: Live stock history and status tracking.

---

## 📋 Prerequisites
- **Node.js**: v18 or higher
- **PostgreSQL**: Local installation or cloud-hosted (e.g., Supabase)

---

## 🚀 Getting Started

### 1. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   - Copy `.env.example` to `.env`.
   - Update `DATABASE_URL` with your PostgreSQL connection string.
   - Set a secure `JWT_SECRET`.
4. Initialize the database schema:
   ```bash
   npm run db:push
   ```
5. Seed default roles, permissions, and admin user:
   ```bash
   npm run db:seed
   ```
6. Start the server:
   ```bash
   npm run dev
   ```

### 2. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

---

## 🔐 Default Credentials
Once seeded, use these credentials for initial login:
- **Email**: `admin@pos.com`
- **Password**: `admin123`

---

## 📂 Project Structure
- `/backend`: Node.js/Express server with Drizzle ORM.
- `/frontend`: React client with Vite and React Bootstrap.
- `/uploads`: Product images and business logos (stored in backend).

---

## 🛠 Support
For support or customization, please contact the developer.
