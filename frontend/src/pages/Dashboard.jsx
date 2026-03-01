import { useState, useEffect } from "react";
import { Card, Col, Row, Badge, Button, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom"; // Add useNavigate
import { useAuth } from "../auth/AuthContext";
import { api } from "../api/client";
import { toast } from "react-toastify";
import { useSettings } from "../context/SettingsContext";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';

// Shared Components
import StatCard from "../components/StatCard";
import ChartTooltip from "../components/ChartTooltip";

const ActionCard = ({ title, subtitle, icon, link, color = "var(--primary2)" }) => {
  const navigate = useNavigate(); // Add navigate hook

  return (
    <div
      className="glass action-card shadow-soft h-100 cursor-pointer p-4 border-0 hover-lift ripple-effect"
      onClick={() => navigate(link)} // Replace window.location.href with navigate
      style={{ transition: 'all 0.3s ease' }}
    >
      <div className="d-flex align-items-center gap-3">
        <div
          className="icon-box rounded-3 d-flex align-items-center justify-content-center shadow-lg"
          style={{ width: '50px', height: '50px', backgroundColor: 'rgba(255,255,255,0.05)', color }}
        >
          <i className={`bi ${icon} fs-4`} />
        </div>
        <div>
          <h6 className="mb-0 fw-bold text-white">{title}</h6>
          <div className="small text-muted">{subtitle}</div>
        </div>
      </div>
    </div>
  );
};

const CustomBarTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="glass p-2 px-3 border-0 shadow-lg" style={{ backgroundColor: "rgba(15, 23, 42, 0.95)" }}>
        <p className="fw-bold text-white mb-0 small">{data.name}</p>
        <div className="d-flex align-items-center gap-2">
          <div className="rounded-circle" style={{ width: 8, height: 8, backgroundColor: payload[0].payload.fill || payload[0].color }}></div>
          <span style={{ color: "var(--primary2)", fontWeight: "bold", fontSize: "13px" }}>
            {data.sales} units sold
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { hasPermission, user, token } = useAuth();
  const { currencySymbol } = useSettings();
  const navigate = useNavigate(); // Add navigate hook
  const [loading, setLoading] = useState(true);

  // Define logical roles for dashboard visibility
  const roles = (user?.roles || []).map(r => r.toLowerCase());
  const isBranchManager = roles.some(r => r === "branch manager" || r === "manager");
  const isAdmin = roles.some(r => ["super admin", "admin"].includes(r)) || isBranchManager;
  const isInventoryManager = roles.some(r => r.includes("inventory"));
  const isAccountant = roles.includes("accountant");
  const isCashier = roles.includes("cashier");

  // Granular visibility rules - PURELY PERMISSION BASED
  const showRevenueStats = hasPermission("view_sales");
  const showInventoryStats = hasPermission("manage_products") || hasPermission("manage_inventory");
  const showCustomerStats = hasPermission("manage_customers");

  // Charts require report permission + specific functional access
  const showRevenueChart = hasPermission("view_reports") && (isAdmin || isAccountant || hasPermission("view_sales"));
  const showTopProductsChart = hasPermission("view_reports") && (isAdmin || !isAccountant); // Everyone except strict accountants sees product trends

  // Use this to show a more specific title
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

    // User Management
    if (hasPermission("manage_users")) {
      actions.push({ title: "Manage Users", subtitle: "Roles & Permissions", icon: "bi-person-gear", link: "/app/users" });
      actions.push({ title: "Activity Log", subtitle: "Audit Trail & Logs", icon: "bi-journal-text", link: "/app/activity" });
      actions.push({ title: "Shared Access", subtitle: "Role Assignment", icon: "bi-shield-lock", link: "/app/access" });
    }

    // Business Settings
    if (hasPermission("system_settings")) {
      actions.push({ title: "System Settings", subtitle: "Configure Business", icon: "bi-gear", link: "/app/settings" });
    }

    // Inventory & Products
    if (hasPermission("manage_products") || hasPermission("manage_inventory")) {
      actions.push({ title: "Products", subtitle: "Catalog & Pricing", icon: "bi-box", link: "/app/products" });
      actions.push({ title: "Inventory", subtitle: "Stock Management", icon: "bi-box-seam", link: "/app/inventory" });
      actions.push({ title: "Low Stock", subtitle: "Refill Alerts", icon: "bi-exclamation-triangle", link: "/app/inventory/low-stock", color: "#ef4444" });
    }

    // Sales & Customers
    if (hasPermission("view_sales")) {
      actions.push({ title: "Sales History", subtitle: "Transaction Logs", icon: "bi-receipt", link: "/app/sales" });
    }

    if (hasPermission("manage_customers")) {
      actions.push({ title: "Customers", subtitle: "Loyalty & Directory", icon: "bi-people", link: "/app/customers" });
    }

    // Point of Sale
    if (hasPermission("create_sale")) {
      actions.push({ title: "Point of Sale", subtitle: "Start New Order", icon: "bi-cart-plus", link: "/app/pos", color: "#22c55e" });
    }

    return actions;
  };

  const quickActions = getQuickActions();

  const [data, setData] = useState({
    kpis: {
      totalProducts: 0,
      lowStock: 0,
      todayRevenue: 0,
      totalCustomers: 0
    },
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

      // Ensure numeric data is parsed as actual numbers for the charts
      const stats = {
        ...res.data,
        revenueData: (res.data.revenueData || []).map(row => ({
          ...row,
          revenue: parseFloat(row.revenue) || 0
        })),
        topProducts: (res.data.topProducts || []).map(row => ({
          ...row,
          sales: parseInt(row.sales) || 0
        }))
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
          <h2 className="page-title text-white">
            {getDashboardTitle()}
          </h2>
          <div style={{ color: "var(--muted)", textTransform: "capitalize" }}>
            Welcome back, {user?.name} —{" "}
            {isCashier
              ? "Ready to start your shift?"
              : "Here's the current business status."}
          </div>
        </div>

        {hasPermission("create_sale") && (
          <Button
            onClick={() => navigate("/app/pos")} // Replace href with navigate
            className="btn btn-gradient gap-2 d-flex align-items-center"
          >
            <i className="bi bi-cart3"></i> Open POS
          </Button>
        )}
      </div>


      {(showRevenueStats || showInventoryStats || showCustomerStats) && (
        <Row className="g-3 mb-4">
          {/* Products */}
          {showInventoryStats && (
            <Col md={6} xl={3}>
              <StatCard
                title="Products"
                value={data.kpis.totalProducts}
                icon="bi-box-seam"
                hint="Total registered items"
              />
            </Col>
          )}

          {/* Sales Today */}
          {showRevenueStats && (
            <Col md={6} xl={3}>
              <StatCard
                title="Sales Today"
                value={`${currencySymbol}${parseFloat(data.kpis.todayRevenue).toFixed(2)}`}
                icon="bi-graph-up-arrow"
                hint="Real-time revenue"
                color="#22c55e"
              />
            </Col>
          )}

          {/* Low Stock */}
          {showInventoryStats && (
            <Col md={6} xl={3}>
              <StatCard
                title="Low Stock"
                value={data.kpis.lowStock}
                icon="bi-exclamation-triangle"
                hint="SKUs needing refill"
                color="#ef4444"
              />
            </Col>
          )}

          {/* Customers */}
          {showCustomerStats && (
            <Col md={6} xl={3}>
              <StatCard
                title="Customers"
                value={data.kpis.totalCustomers}
                icon="bi-people"
                hint={isCashier ? "Add & search customers" : "Registered clients"}
                color="#06b6d4"
              />
            </Col>
          )}
        </Row>
      )}

      {/* Charts Section */}
      {(showRevenueChart || showTopProductsChart) && (
        <Row className="g-3">
          {/* Revenue Chart */}
          {showRevenueChart && (
            <Col lg={showTopProductsChart ? 8 : 12}>
              <Card className="glass shadow-soft border-0 h-100">
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-between mb-4">
                    <div>
                      <h6 className="fw-bold text-white mb-0">Revenue Overview</h6>
                      <small className="text-muted">Sales performance last 7 days</small>
                    </div>
                    <Badge className="badge-soft">
                      <i
                        className="bi bi-circle-fill text-success me-2"
                        style={{ fontSize: "8px" }}
                      ></i>
                      Live Data
                    </Badge>
                  </div>

                  <div style={{ width: "100%", height: 300 }}>
                    <ResponsiveContainer>
                      <AreaChart
                        data={data.revenueData}
                        margin={{ top: 10, right: 30, left: 20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="rgba(255,255,255,0.05)"
                        />
                        <XAxis
                          dataKey="name"
                          stroke="rgba(255,255,255,0.5)"
                          tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke="rgba(255,255,255,0.4)"
                          tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                          width={60}
                          tickFormatter={(value) => {
                            if (value >= 1000) return `${currencySymbol}${(value / 1000).toFixed(1)}k`;
                            return `${currencySymbol}${value}`;
                          }}
                        />
                        <Tooltip
                          content={<ChartTooltip currencySymbol={currencySymbol} />}
                          cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1 }}
                        />

                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="#22c55e"
                          strokeWidth={4}
                          fillOpacity={1}
                          fill="url(#colorRevenue)"
                          dot={{ r: 4, fill: "#22c55e", strokeWidth: 2, stroke: "#fff" }}
                          activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          )}

          {/* Top Selling Chart */}
          {showTopProductsChart && (
            <Col lg={showRevenueChart ? 4 : 12}>
              <Card className="glass shadow-soft border-0 h-100">
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-between mb-4">
                    <div>
                      <h6 className="fw-bold text-white mb-0">Top Products</h6>
                      <small className="text-muted">By total volume sold</small>
                    </div>
                    <Badge className="badge-soft">
                      <i className="bi bi-fire text-warning me-2"></i>
                      Hot Items
                    </Badge>
                  </div>

                  <div style={{ width: "100%", height: 320 }}>
                    <ResponsiveContainer>
                      <BarChart
                        data={data.topProducts}
                        margin={{ top: 10, right: 0, left: -30, bottom: 20 }}
                        barSize={35}
                      >
                        <defs>
                          <linearGradient id="barGradientTop" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#22c55e" stopOpacity={1} />
                            <stop offset="100%" stopColor="#15803d" stopOpacity={0.8} />
                          </linearGradient>
                          <linearGradient id="barGradientOthers" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6d5efc" stopOpacity={1} />
                            <stop offset="100%" stopColor="#4338ca" stopOpacity={0.8} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="rgba(255,255,255,0.05)"
                        />
                        <XAxis
                          dataKey="name"
                          stroke="rgba(255,255,255,0.4)"
                          tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }}
                          tickLine={false}
                          axisLine={false}
                          interval={0}
                          tickFormatter={(value) => value.length > 8 ? value.substring(0, 8) + '..' : value}
                        />
                        <YAxis
                          stroke="rgba(255,255,255,0.4)"
                          tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          cursor={{ fill: "rgba(255,255,255,0.05)" }}
                          content={<CustomBarTooltip />}
                        />
                        <Bar dataKey="sales" radius={[6, 6, 0, 0]}>
                          {data.topProducts.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={index === 0 ? "url(#barGradientTop)" : "url(#barGradientOthers)"}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          )}
        </Row>
      )}

      {/* Empty State Fallback */}
      {!(showRevenueStats || showInventoryStats || showCustomerStats || showRevenueChart || showTopProductsChart) && quickActions.length === 0 && (
        <div className="text-center py-5 mt-5">
          <div
            className="brand-badge mx-auto mb-3"
            style={{ width: 60, height: 60, fontSize: "24px" }}
          >
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