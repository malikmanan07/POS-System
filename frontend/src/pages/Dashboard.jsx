import { useState, useEffect } from "react";
import { Col, Row, Button, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { api } from "../api/client";
import { toast } from "react-toastify";
import { useSettings } from "../context/SettingsContext";

// Components
import DashboardStats from "../components/Dashboard/DashboardStats";
import RevenueChart from "../components/Dashboard/RevenueChart";
import TopProductsChart from "../components/Dashboard/TopProductsChart";

export default function Dashboard() {
  const { hasPermission, user, token } = useAuth();
  const { currencySymbol } = useSettings();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const roles = (user?.roles || []).map(r => r.toLowerCase());
  const isBranchManager = roles.some(r => r === "branch manager" || r === "manager");
  const isAdmin = roles.some(r => ["super admin", "admin"].includes(r)) || isBranchManager;
  const isInventoryManager = roles.some(r => r.includes("inventory"));
  const isAccountant = roles.includes("accountant");
  const isCashier = roles.includes("cashier");

  const showRevenueStats = hasPermission("view_sales");
  const showInventoryStats = hasPermission("manage_products") || hasPermission("manage_inventory");
  const showCustomerStats = hasPermission("manage_customers");

  const showRevenueChart = hasPermission("view_reports") && (isAdmin || isAccountant || hasPermission("view_sales"));
  const showTopProductsChart = hasPermission("view_reports") && (isAdmin || !isAccountant);

  const getDashboardTitle = () => {
    if (roles.includes("super admin")) return "Super Admin Dashboard";
    if (roles.includes("admin")) return "Admin Dashboard";
    if (isBranchManager) return "Managerial Overview";
    if (isInventoryManager) return "Inventory Management";
    if (isAccountant) return "Financial Overview";
    if (isCashier) return "Cashier Dashboard";
    return "Operations Dashboard";
  };

  const getQuickActions = () => {
    let actions = [];
    if (hasPermission("manage_users")) {
      actions.push({ title: "Manage Users", subtitle: "Roles & Permissions", icon: "bi-person-gear", link: "/app/users" });
      actions.push({ title: "Activity Log", subtitle: "Audit Trail & Logs", icon: "bi-journal-text", link: "/app/activity" });
      actions.push({ title: "Shared Access", subtitle: "Role Assignment", icon: "bi-shield-lock", link: "/app/access" });
    }
    if (hasPermission("system_settings")) {
      actions.push({ title: "System Settings", subtitle: "Configure Business", icon: "bi-gear", link: "/app/settings" });
    }
    if (hasPermission("manage_products") || hasPermission("manage_inventory")) {
      actions.push({ title: "Products", subtitle: "Catalog & Pricing", icon: "bi-box", link: "/app/products" });
      actions.push({ title: "Inventory", subtitle: "Stock Management", icon: "bi-box-seam", link: "/app/inventory" });
      actions.push({ title: "Low Stock", subtitle: "Refill Alerts", icon: "bi-exclamation-triangle", link: "/app/inventory/low-stock", color: "#ef4444" });
    }
    if (hasPermission("view_sales")) {
      actions.push({ title: "Sales History", subtitle: "Transaction Logs", icon: "bi-receipt", link: "/app/sales" });
    }
    if (hasPermission("manage_customers")) {
      actions.push({ title: "Customers", subtitle: "Loyalty & Directory", icon: "bi-people", link: "/app/customers" });
    }
    if (hasPermission("create_sale")) {
      actions.push({ title: "Point of Sale", subtitle: "Start New Order", icon: "bi-cart-plus", link: "/app/pos", color: "#22c55e" });
      actions.push({ title: "Shift Management", subtitle: "Open/Close Register", icon: "bi-clock-history", link: "/app/shifts", color: "#6d5efc" });
    }
    return actions;
  };

  const quickActions = getQuickActions();

  const [data, setData] = useState({
    kpis: { totalProducts: 0, lowStock: 0, todayRevenue: 0, totalCustomers: 0 },
    revenueData: [],
    topProducts: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await api.get("/api/dashboard/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const stats = {
        ...res.data,
        revenueData: (res.data.revenueData || []).map(row => ({ ...row, revenue: parseFloat(row.revenue) || 0 })),
        topProducts: (res.data.topProducts || []).map(row => ({ ...row, sales: parseInt(row.sales) || 0 }))
      };
      setData(stats);
    } catch (err) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center h-100">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
        <div>
          <h2 className="page-title text-white">{getDashboardTitle()}</h2>
          <div style={{ color: "var(--muted)", textTransform: "capitalize" }}>
            Welcome back, {user?.name} — {isCashier ? "Ready to start your shift?" : "Here's the current business status."}
          </div>
        </div>
        {hasPermission("create_sale") && (
          <Button onClick={() => navigate("/app/pos")} className="btn btn-gradient gap-2 d-flex align-items-center">
            <i className="bi bi-cart3"></i> Open POS
          </Button>
        )}
      </div>

      <DashboardStats
        showRevenueStats={showRevenueStats}
        showInventoryStats={showInventoryStats}
        showCustomerStats={showCustomerStats}
        data={data}
        currencySymbol={currencySymbol}
        isCashier={isCashier}
      />

      {(showRevenueChart || showTopProductsChart) && (
        <Row className="g-3">
          {showRevenueChart && (
            <Col lg={showTopProductsChart ? 8 : 12}>
              <RevenueChart data={data} currencySymbol={currencySymbol} />
            </Col>
          )}
          {showTopProductsChart && (
            <Col lg={showRevenueChart ? 4 : 12}>
              <TopProductsChart data={data} />
            </Col>
          )}
        </Row>
      )}

      {!(showRevenueStats || showInventoryStats || showCustomerStats || showRevenueChart || showTopProductsChart) && quickActions.length === 0 && (
        <div className="text-center py-5 mt-5">
          <div className="brand-badge mx-auto mb-3" style={{ width: 60, height: 60, fontSize: "24px" }}>
            <i className="bi bi-shop"></i>
          </div>
          <h4 className="text-white">Professional Console Ready</h4>
          <p className="text-muted mb-4">
            Your workspace is active. Select an action from the menu or quick bar to get started.
          </p>
        </div>
      )}
    </>
  );
}