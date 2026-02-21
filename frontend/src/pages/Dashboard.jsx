import { Card, Col, Row, Badge, Button } from "react-bootstrap";
import { useAuth } from "../auth/AuthContext";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
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

// Placeholder Data for visual impression
const revenueData = [
  { name: 'Mon', revenue: 4000 },
  { name: 'Tue', revenue: 3000 },
  { name: 'Wed', revenue: 5000 },
  { name: 'Thu', revenue: 8780 },
  { name: 'Fri', revenue: 5890 },
  { name: 'Sat', revenue: 9390 },
  { name: 'Sun', revenue: 11490 },
];

const topProductsData = [
  { name: 'Wireless Mouse', sales: 400 },
  { name: 'Mechanical Keyboard', sales: 300 },
  { name: '24" Monitor', sales: 300 },
  { name: 'USB-C Cable', sales: 200 },
  { name: 'Webcam 1080p', sales: 278 }
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass p-3 rounded" style={{ backgroundColor: "rgba(15, 23, 42, 0.9)" }}>
        <p className="fw-bold text-white mb-1">{label}</p>
        <p className="mb-0" style={{ color: "#22c55e" }}>
          ${payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { hasPermission, user } = useAuth();

  return (
    <>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
        <div>
          <div className="page-title text-white">Dashboard</div>
          <div style={{ color: "var(--muted)", textTransform: "capitalize" }}>
            Welcome back, {user?.name} — Here's what's happening today.
          </div>
        </div>

        {hasPermission("create_sale") && (
          <Button href="/app/pos" className="btn btn-gradient gap-2 d-flex align-items-center">
            <i className="bi bi-cart3"></i> Open POS
          </Button>
        )}
      </div>

      {hasPermission("view_sales") && (
        <Row className="g-3 mb-4">
          <Col md={6} xl={3}>
            <KPI title="Products" value="1,204" icon="bi-box-seam" hint="Total registered items" />
          </Col>
          <Col md={6} xl={3}>
            <KPI title="Sales Today" value="$3,509" icon="bi-graph-up-arrow" hint="↑ 12% from yesterday" />
          </Col>
          <Col md={6} xl={3}>
            <KPI title="Low Stock" value="12" icon="bi-exclamation-triangle" hint="SKUs needing refill" />
          </Col>
          <Col md={6} xl={3}>
            <KPI title="Customers" value="340" icon="bi-people" hint="Active in last 30 days" />
          </Col>
        </Row>
      )}

      {hasPermission("view_sales") && (
        <Row className="g-3">
          {/* Revenue Chart */}
          <Col lg={8}>
            <Card className="glass shadow-soft border-0 h-100">
              <Card.Body>
                <div className="d-flex align-items-center justify-content-between mb-4">
                  <div>
                    <h6 className="fw-bold text-white mb-0">Revenue Overview</h6>
                    <small className="text-muted">Analyzing your sales performance this week</small>
                  </div>
                  <Badge className="badge-soft"><i className="bi bi-circle-fill text-success me-2" style={{ fontSize: '8px' }}></i>Live Data</Badge>
                </div>

                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} tickLine={false} axisLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
                      <Area type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
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
                <div className="mb-4">
                  <h6 className="fw-bold text-white mb-0">Top Products</h6>
                  <small className="text-muted">By total volume sold</small>
                </div>

                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart data={topProductsData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} tickLine={false} axisLine={false} interval={0} angle={-30} textAnchor="end" height={60} />
                      <YAxis stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} tickLine={false} axisLine={false} />
                      <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: 'none', borderRadius: '8px', color: '#fff' }} itemStyle={{ color: '#6d5efc' }} />
                      <Bar dataKey="sales" radius={[4, 4, 0, 0]}>
                        {topProductsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? "#22c55e" : "#6d5efc"} />
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

      {/* Message for staff who don't have view_sales access e.g simple Cashiers who only ring up orders */}
      {!hasPermission("view_sales") && (
        <div className="text-center py-5 mt-5">
          <div className="brand-badge mx-auto mb-3" style={{ width: 60, height: 60, fontSize: "24px" }}>
            <i className="bi bi-shop"></i>
          </div>
          <h4 className="text-white">Ready for another great shift!</h4>
          <p className="text-muted mb-4">You're logged in as an active team member. Select an action from the menu to get started.</p>
        </div>
      )}
    </>
  );
}