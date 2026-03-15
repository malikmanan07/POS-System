import { useState, useMemo } from "react";
import { Button, Offcanvas } from "react-bootstrap";
import { Outlet, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import AppNavbar from "./AppNavbar";
import Sidebar from "./Sidebar";

export default function PageShell() {
  const [show, setShow] = useState(false);
  const location = useLocation();

  // Dynamic SEO Title based on current route
  const pageTitle = useMemo(() => {
    const path = location.pathname.replace("/app", "");
    if (!path || path === "/") return "Dashboard";

    // Convert path like "/manage-stock" to "Manage Stock"
    return path
      .substring(1)
      .split("/")
      .map(part => part.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "))
      .join(" - ");
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <Helmet>
        <title>{`${pageTitle} | Force POS`}</title>
      </Helmet>

      <AppNavbar onMenu={() => setShow(true)} />

      {/* Mobile Sidebar */}
      <Offcanvas
        show={show}
        onHide={() => setShow(false)}
        placement="start"
        className="offcanvas-dark"
      >
        <Offcanvas.Header closeButton closeVariant="white">
          <Offcanvas.Title className="fw-bold">
            Menu
          </Offcanvas.Title>
        </Offcanvas.Header>

        <Offcanvas.Body>
          <Sidebar onNavigate={() => setShow(false)} />
        </Offcanvas.Body>
      </Offcanvas>

      <div className="app-main">
        {/* Desktop Sidebar */}
        <aside className="app-sidebar d-none d-lg-block">
          <Sidebar />
        </aside>

        {/* Content Area */}
        <main className="app-content">
          {/* Nested route content renders here */}
          <div className="glass p-4 shadow-soft">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}