import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import React, { Suspense, lazy } from "react";

import { AuthProvider } from "./auth/AuthContext";
import { SettingsProvider } from "./context/SettingsContext";
import { ShiftProvider } from "./context/ShiftContext";
import ProtectedRoute from "./auth/ProtectedRoute";
import PageShell from "./components/PageShell";
import PermissionRoute from "./auth/PermissionRoute";
import Spinner from "react-bootstrap/Spinner";

// Lazy loading components
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Products = lazy(() => import("./pages/Products"));
const Categories = lazy(() => import("./pages/Categories"));
const Customers = lazy(() => import("./pages/Customers"));
const POS = lazy(() => import("./pages/POS"));
const Sales = lazy(() => import("./pages/Sales"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Roles = lazy(() => import("./pages/Roles"));
const Users = lazy(() => import("./pages/Users"));
const Access = lazy(() => import("./pages/Access"));
const Settings = lazy(() => import("./pages/Settings"));
const ManageStock = lazy(() => import("./pages/ManageStock"));
const StockHistory = lazy(() => import("./pages/StockHistory"));
const LowStock = lazy(() => import("./pages/LowStock"));
const ActivityLog = lazy(() => import("./pages/ActivityLog"));
const Reports = lazy(() => import("./pages/Reports"));
const Suppliers = lazy(() => import("./pages/Suppliers"));
const Discounts = lazy(() => import("./pages/Discounts"));
const Shifts = lazy(() => import("./pages/Shifts"));
const DevLogin = lazy(() => import("./pages/DevLogin"));
const DevDashboard = lazy(() => import("./pages/DevDashboard"));

// Global fallback skeleton/spinner for lazy loading
const PageLoader = () => (
  <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
    <Spinner animation="border" variant="primary" />
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <ShiftProvider>
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Default entry -> login */}
                <Route path="/" element={<Navigate to="/login" replace />} />

                {/* Public */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

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
                    element={<Dashboard />}
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
                      <PermissionRoute permission="manage_roles">
                        <Roles />
                      </PermissionRoute>
                    }
                  />

                  <Route
                    path="access"
                    element={
                      <PermissionRoute permission="manage_roles">
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
                      <PermissionRoute permission="manage_inventory">
                        <ManageStock />
                      </PermissionRoute>
                    }
                  />
                  <Route
                    path="inventory/history"
                    element={
                      <PermissionRoute permission="manage_inventory">
                        <StockHistory />
                      </PermissionRoute>
                    }
                  />
                  <Route
                    path="inventory/low-stock"
                    element={
                      <PermissionRoute permission="manage_inventory">
                        <LowStock />
                      </PermissionRoute>
                    }
                  />

                  <Route
                    path="activity"
                    element={
                      <PermissionRoute permission="view_activity_logs">
                        <ActivityLog />
                      </PermissionRoute>
                    }
                  />

                  <Route
                    path="reports"
                    element={
                      <PermissionRoute permission="view_reports">
                        <Reports />
                      </PermissionRoute>
                    }
                  />

                  <Route
                    path="suppliers"
                    element={
                      <PermissionRoute permission="manage_suppliers">
                        <Suppliers />
                      </PermissionRoute>
                    }
                  />

                  <Route
                    path="discounts"
                    element={
                      <PermissionRoute permission="manage_discounts">
                        <Discounts />
                      </PermissionRoute>
                    }
                  />

                  <Route
                    path="shifts"
                    element={
                      <PermissionRoute permission="manage_shifts">
                        <Shifts />
                      </PermissionRoute>
                    }
                  />

                  <Route path="*" element={<NotFound />} />
                </Route>

                {/* Dev Panel */}
                <Route path="/dev-panel" element={<DevLogin />} />
                <Route path="/dev-panel/dashboard" element={<DevDashboard />} />

                {/* fallback */}
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </Suspense>

            <ToastContainer position="top-right" autoClose={2000} />
          </BrowserRouter>
        </ShiftProvider>
      </SettingsProvider>
    </AuthProvider>

  );
}