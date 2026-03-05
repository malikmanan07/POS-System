import { useState } from "react";
import { Button, Offcanvas } from "react-bootstrap";
import { Outlet } from "react-router-dom";
import AppNavbar from "./AppNavbar";
import Sidebar from "./Sidebar";

export default function PageShell() {
  const [show, setShow] = useState(false);

  return (
    <div className="app-shell">
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