import { useState, useEffect } from "react";
import { Card, Col, Row, Badge, Button, Spinner } from "react-bootstrap";
import { useAuth } from "../auth/AuthContext";
import { api } from "../api/client";
import { toast } from "react-toastify";
import { useSettings } from "../context/SettingsContext";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';

const KPI = ({ title, value, icon, hint }) => (
  <div className="glass kpi shadow-soft h-100">
    <div className="d-flex align-items-center justify-content-between">
      <div>
        <div className="small" style={{ color: "var(--muted)" }}>
          {title}
        </div>
        <div className="fs-3 fw-bold text-white">{value}</div>
        <div className="small" style={{ color: "var(--muted)" }}>
          {hint}
        </div>
      </div>
      <div className="icon">
        <i className={`bi ${icon} fs-4`} style={{ color: "var(--primary2)" }} />
      </div>
    </div>
  </div>
);

const COLORS = ['#6d5efc', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4'];

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

const CustomTooltip = ({ active, payload, label, currencySymbol }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass p-3 rounded border-0 shadow-lg" style={{ backgroundColor: "rgba(15, 23, 42, 0.95)" }}>
        <p className="fw-bold text-white mb-1">{label}</p>
        <p className="mb-0 fw-bold fs-5" style={{ color: "#22c55e" }}>
          {currencySymbol}{parseFloat(payload[0].value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { hasPermission, user, token } = useAuth();
  const { currencySymbol } = useSettings();
  const [loading, setLoading] = useState(true);
  // Cashier-like user = can create sale but cannot view reports
  const isCashierLike = hasPermission("create_sale") && !hasPermission("view_reports");
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
      setData(res.data);
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
            {isCashierLike ? "Cashier Dashboard" : "Dashboard"}
          </h2>
          <div style={{ color: "var(--muted)", textTransform: "capitalize" }}>
            Welcome back, {user?.name} —{" "}
            {isCashierLike
              ? "Ready to start your shift?"
              : "Here's what's happening today."}
          </div>
        </div>

        {hasPermission("create_sale") && (
          <Button href="/app/pos" className="btn btn-gradient gap-2 d-flex align-items-center">
            <i className="bi bi-cart3"></i> Open POS
          </Button>
        )}
      </div>


      {hasPermission("view_sales") && (
        <>
          <Row className="g-3 mb-4">
            {/* Products - ONLY if manage_products */}
            {hasPermission("manage_products") && (
              <Col md={6} xl={3}>
                <KPI
                  title="Products"
                  value={data.kpis.totalProducts}
                  icon="bi-box-seam"
                  hint="Total registered items"
                />
              </Col>
            )}

            {/* Sales Today - still for anyone who can view sales */}
            <Col md={6} xl={3}>
              <KPI
                title="Sales Today"
                value={`${currencySymbol}${parseFloat(data.kpis.todayRevenue).toFixed(2)}`}
                icon="bi-graph-up-arrow"
                hint="Real-time revenue"
              />
            </Col>


            {/* Low Stock - ONLY if manage_products */}
            {hasPermission("manage_products") && (
              <Col md={6} xl={3}>
                <KPI
                  title="Low Stock"
                  value={data.kpis.lowStock}
                  icon="bi-exclamation-triangle"
                  hint="SKUs needing refill"
                />
              </Col>
            )}

            {/* Customers - ONLY if manage_customers */}
            {hasPermission("manage_customers") && (
              <Col md={6} xl={3}>
                <KPI
                  title="Customers"
                  value={data.kpis.totalCustomers}
                  icon="bi-people"
                  hint={
                    isCashierLike
                      ? "Add & search customers"
                      : "Total registered"
                  }
                />
              </Col>
            )}

          </Row>

          {/* Charts - ONLY if view_reports */}
          {hasPermission("view_reports") && (
            <Row className="g-3">
              {/* Revenue Chart */}
              <Col lg={8}>
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
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
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
                            stroke="rgba(255,255,255,0.5)"
                            tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${currencySymbol}${value}`}
                          />
                          <Tooltip
                            content={<CustomTooltip currencySymbol={currencySymbol} />}
                            cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1 }}
                          />
                          <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#22c55e"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorRevenue)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              {/* Top Selling Chart */}
              <Col lg={4}>
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
            </Row>
          )}
        </>
      )}

      {!hasPermission("view_sales") && (
        <div className="text-center py-5 mt-5">
          <div
            className="brand-badge mx-auto mb-3"
            style={{ width: 60, height: 60, fontSize: "24px" }}
          >
            <i className="bi bi-shop"></i>
          </div>
          <h4 className="text-white">Ready for another great shift!</h4>
          <p className="text-muted mb-4">
            You're logged in as an active team member. Select an action from the menu to get started.
          </p>
        </div>
      )}
    </>
  );
}