import { Container, Nav, Navbar, Button, Dropdown, Badge } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { api } from "../api/client";
import { useState, useEffect } from "react";

export default function AppNavbar({ onMenu }) {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const [lowStockCount, setLowStockCount] = useState(0);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [dismissedAlerts, setDismissedAlerts] = useState(() => {
    const saved = localStorage.getItem("dismissed_alerts");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    if (token) {
      fetchLowStock();

      const handleSale = () => {
        console.log("Navbar: Sale detected, refreshing low stock...");
        fetchLowStock();
      };

      window.addEventListener("saleCompleted", handleSale);
      const interval = setInterval(fetchLowStock, 60000);

      return () => {
        clearInterval(interval);
        window.removeEventListener("saleCompleted", handleSale);
      };
    }
  }, [token, dismissedAlerts]);

  const fetchLowStock = async () => {
    try {
      const res = await api.get("/api/stock", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data || [];

      // Auto-clear dismissed for restocked items
      const currentlyLow = data.filter(p => p.stock <= (p.alert_quantity || 5)).map(p => p.id);
      const stillDismissed = dismissedAlerts.filter(id => currentlyLow.includes(id));
      if (stillDismissed.length !== dismissedAlerts.length) {
        setDismissedAlerts(stillDismissed);
        localStorage.setItem("dismissed_alerts", JSON.stringify(stillDismissed));
      }

      const alerts = data.filter(p =>
        p.stock <= (p.alert_quantity || 5) &&
        !stillDismissed.includes(p.id)
      );
      setLowStockCount(alerts.length);
      setLowStockItems(alerts.slice(0, 5));
    } catch (err) {
      console.error("Failed to fetch low stock");
    }
  };

  const handleDismiss = (id) => {
    const newDismissed = [...dismissedAlerts, id];
    setDismissedAlerts(newDismissed);
    localStorage.setItem("dismissed_alerts", JSON.stringify(newDismissed));
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <Navbar className="glass shadow-soft app-navbar" sticky="top">
      <Container fluid className="px-3">
        <div className="d-flex align-items-center gap-2">
          {/* Mobile menu button */}
          <Button
            className="btn btn-soft d-lg-none"
            onClick={onMenu}
            aria-label="Open menu"
          >
            <i className="bi bi-list" />
          </Button>

          <div className="brand-badge">P</div>
          <div>
            <div className="fw-bold">POS System</div>
            <div className="small" style={{ color: "var(--muted)", textTransform: "capitalize" }}>
              {user?.roles?.length > 0 ? `${user.roles[0]} Console` : "Console"}
            </div>
          </div>
        </div>

        <Nav className="ms-auto d-flex align-items-center gap-2">
          <Nav.Link as={Link} to="/app/pos" className="btn btn-gradient">
            <i className="bi bi-cart3 me-2" />
            Open POS
          </Nav.Link>

          <Dropdown align="end" className="d-none d-md-inline-block">
            <Dropdown.Toggle as={Button} className="btn btn-soft p-0 border-0 bg-transparent shadow-none position-relative" style={{ width: '40px', height: '40px' }}>
              <i className="bi bi-bell h5 mb-0" />
              {lowStockCount > 0 && (
                <Badge
                  pill
                  bg="danger"
                  className="position-absolute top-10 start-90 translate-middle p-1 border border-light border-2 rounded-circle"
                  style={{ fontSize: '0.6rem', border: 'none' }}
                >
                  {lowStockCount}
                </Badge>
              )}
            </Dropdown.Toggle>

            <Dropdown.Menu className="dropdown-menu-dark glass shadow-lg border-secondary mt-2 p-0 overflow-hidden" style={{ width: '300px', zIndex: 9999 }}>
              <div className="p-3 border-bottom border-secondary d-flex justify-content-between align-items-center bg-dark">
                <h6 className="mb-0 fw-bold text-white">Notifications</h6>
                {lowStockCount > 0 && <Badge bg="danger" className="small">{lowStockCount} Alerts</Badge>}
              </div>
              <div className="notification-list py-0" style={{ maxHeight: '350px', overflowY: 'auto', backgroundColor: 'rgba(20, 20, 20, 0.9)' }}>
                {lowStockItems.length > 0 ? (
                  lowStockItems.map(item => (
                    <Dropdown.Item
                      key={item.id}
                      as={Link}
                      to="/app/inventory/low-stock"
                      className="px-3 py-3 border-bottom border-secondary d-flex flex-column gap-1 dropdown-item-custom"
                      onClick={() => handleDismiss(item.id)}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <span className="fw-bold small text-white">{item.name}</span>
                        <span className="text-danger extra-small fw-bold bg-danger-soft px-1 rounded">{item.stock} left</span>
                      </div>
                      <span className="extra-small text-muted">Stock below threshold ({item.alert_quantity || 5})</span>
                    </Dropdown.Item>
                  ))
                ) : (
                  <div className="p-4 text-center text-muted small">
                    <i className="bi bi-check2-circle text-success mb-2 d-xl-block h3"></i>
                    All stock levels are normal
                  </div>
                )}
              </div>
            </Dropdown.Menu>
          </Dropdown>

          <Dropdown align="end">
            <Dropdown.Toggle as={Button} className="btn btn-soft d-flex align-items-center bg-transparent border-0 shadow-none">
              <i className="bi bi-person-circle me-2" />
              {user?.name || "User"}
            </Dropdown.Toggle>

            <Dropdown.Menu className="glass shadow-soft border-secondary mt-2">
              <Dropdown.Item onClick={handleLogout} className="text-danger d-flex align-items-center gap-2">
                <i className="bi bi-box-arrow-right"></i> Logout
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Nav>
      </Container>
    </Navbar>
  );
}