import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";

import PageShell from "./components/PageShell";
import PermissionRoute from "./auth/PermissionRoute";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Customers from "./pages/Customers";
import POS from "./pages/POS";
import Sales from "./pages/Sales";
import NotFound from "./pages/NotFound";
import Roles from "./pages/Roles";
import Users from "./pages/Users";
import Access from "./pages/Access";
import Settings from "./pages/Settings";

import ManageStock from "./pages/ManageStock";
import StockHistory from "./pages/StockHistory";
import LowStock from "./pages/LowStock";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Default entry -> login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Login />} />

          {/* Protected Layout */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <PageShell />
              </ProtectedRoute>
            }
          >
            <Route
              index
              element={
                <PermissionRoute permission="view_dashboard">
                  <Dashboard />
                </PermissionRoute>
              }
            />

            <Route
              path="products"
              element={
                <PermissionRoute permission="manage_products">
                  <Products />
                </PermissionRoute>
              }
            />

            <Route
              path="categories"
              element={
                <PermissionRoute permission="manage_categories">
                  <Categories />
                </PermissionRoute>
              }
            />

            <Route
              path="customers"
              element={
                <PermissionRoute permission="manage_customers">
                  <Customers />
                </PermissionRoute>
              }
            />

            <Route
              path="roles"
              element={
                <PermissionRoute permission="manage_users">
                  <Roles />
                </PermissionRoute>
              }
            />

            <Route
              path="access"
              element={
                <PermissionRoute permission="manage_users">
                  <Access />
                </PermissionRoute>
              }
            />

            <Route
              path="users"
              element={
                <PermissionRoute permission="manage_users">
                  <Users />
                </PermissionRoute>
              }
            />

            <Route
              path="sales"
              element={
                <PermissionRoute permission="view_sales">
                  <Sales />
                </PermissionRoute>
              }
            />

            <Route
              path="pos"
              element={
                <PermissionRoute permission="create_sale">
                  <POS />
                </PermissionRoute>
              }
            />

            <Route
              path="settings"
              element={
                <PermissionRoute permission="system_settings">
                  <Settings />
                </PermissionRoute>
              }
            />

            {/* ✅ Inventory Routes */}
            <Route
              path="inventory"
              element={
                <PermissionRoute permission="manage_products">
                  <ManageStock />
                </PermissionRoute>
              }
            />
            <Route
              path="inventory/history"
              element={
                <PermissionRoute permission="manage_products">
                  <StockHistory />
                </PermissionRoute>
              }
            />
            <Route
              path="inventory/low-stock"
              element={
                <PermissionRoute permission="manage_products">
                  <LowStock />
                </PermissionRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Route>

          {/* fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>

        <ToastContainer position="top-right" autoClose={2000} />
      </BrowserRouter>
    </AuthProvider>
    
  );
}