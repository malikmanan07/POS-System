import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, Button, Form, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";

import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";

export default function Login() {
  const loc = useLocation();
  const nav = useNavigate();
  const { login } = useAuth();

  const [mode, setMode] = useState(loc.pathname === "/signup" ? "signup" : "login");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hasAdmin, setHasAdmin] = useState(true);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  // Sync mode with URL if user navigates manually or clicks browser back/forward
  useEffect(() => {
    setMode(loc.pathname === "/signup" ? "signup" : "login");
  }, [loc.pathname]);

  useEffect(() => {
    let mounted = true;
    const checkState = async () => {
      try {
        const res = await api.get("/api/auth/has-admin");
        if (mounted) {
          const adminExists = res.data?.hasAdmin ?? true;
          setHasAdmin(adminExists);
          // Only force signup mode if absolutely no admin exists
          if (!adminExists) {
            setMode("signup");
          }
        }
      } catch (e) {
        console.error("Backend unreachable");
      } finally {
        if (mounted) {
          setChecking(false);
        }
      }
    };
    checkState();
    return () => { mounted = false; };
  }, []);

  const submitLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const u = await login(form.email, form.password);
      toast.success(`Welcome back ${u.name}`);
      nav("/app", { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const submitSignup = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      return toast.error("Please fill all fields");
    }

    try {
      setLoading(true);

      // If no admin exists, use signup-admin, otherwise use general signup (if we add it)
      const endpoint = !hasAdmin ? "/api/auth/signup-admin" : "/api/auth/signup";

      await api.post(endpoint, {
        name: form.name,
        email: form.email,
        password: form.password,
      });

      toast.success(!hasAdmin ? "First admin created! Please login." : "Account created successfully!");
      setHasAdmin(true);
      setMode("login");
      nav("/login");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="d-flex align-items-center justify-content-center bg-dark" style={{ minHeight: "100vh" }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div className="d-flex align-items-center justify-content-center bg-dark" style={{ minHeight: "100vh", padding: 20 }}>
      <Card className="glass shadow-soft border-0" style={{ width: 420, borderRadius: '24px' }}>
        <Card.Body className="p-4 p-md-5">
          <div className="text-center mb-4">
            <h2 className="fw-bold text-white mb-4">
              {mode === 'login' ? 'Login Form' : 'Signup Form'}
            </h2>

            <div className="auth-toggle">
              <button
                type="button"
                className={`auth-toggle-btn ${mode === 'login' ? 'active' : ''}`}
                onClick={() => { setMode('login'); nav('/login'); }}
              >
                Login
              </button>
              <button
                type="button"
                className={`auth-toggle-btn ${mode === 'signup' ? 'active' : ''}`}
                onClick={() => { setMode('signup'); nav('/signup'); }}
              >
                Signup
              </button>
            </div>
          </div>

          <Form onSubmit={mode === "login" ? submitLogin : submitSignup}>
            {mode === "signup" && (
              <Form.Group className="mb-3">
                <Form.Label className="text-muted small fw-bold">FULL NAME</Form.Label>
                <Form.Control
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Enter your name"
                  className="bg-dark text-white border-secondary shadow-none py-2 px-3"
                  style={{ borderRadius: '10px' }}
                />
              </Form.Group>
            )}

            <Form.Group className="mb-3">
              <Form.Label className="text-muted small fw-bold">EMAIL ADDRESS</Form.Label>
              <Form.Control
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@example.com"
                className="bg-dark text-white border-secondary shadow-none py-2 px-3"
                style={{ borderRadius: '10px' }}
                required
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="text-muted small fw-bold">PASSWORD</Form.Label>
              <Form.Control
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="********"
                className="bg-dark text-white border-secondary shadow-none py-2 px-3"
                style={{ borderRadius: '10px' }}
                required
              />
            </Form.Group>

            <Button
              variant="primary"
              className="btn-gradient w-100 py-2 fw-bold text-uppercase"
              type="submit"
              disabled={loading}
              style={{ borderRadius: '12px', fontSize: '15px', letterSpacing: '0.5px' }}
            >
              {loading ? <Spinner size="sm" /> : mode === "login" ? "Login" : "Signup Now"}
            </Button>
          </Form>

          {!hasAdmin && mode === 'login' && (
            <div className="mt-4 text-center p-3 rounded-3" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <div className="text-danger small">No admin account found. Please switch to <b>Signup</b> to create the first admin user.</div>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}