import { Container, Nav, Navbar, Button, Dropdown } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function AppNavbar({ onMenu }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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

          <Nav.Link className="btn btn-soft d-none d-md-inline-flex">
            <i className="bi bi-bell" />
          </Nav.Link>

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