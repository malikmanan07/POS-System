import { useEffect, useState } from "react";
import { Card, Button, Form, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";

export default function Login() {
  const nav = useNavigate();
  const { login } = useAuth();

  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hasAdmin, setHasAdmin] = useState(true);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  // Check system state: admin exists?
  useEffect(() => {
    let mounted = true;
    const checkState = async () => {
      try {
        const res = await api.get("/api/auth/has-admin");
        if (mounted) {
          setHasAdmin(res.data?.hasAdmin ?? true);
          // If no admin exists -> show signup mode by default
          if (!(res.data?.hasAdmin ?? true)) {
            setMode("signup");
          }
        }
      } catch (e) {
        // If backend not reachable, stay on login but show message
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
      toast.success(`Welcome ${u.name}`);

      // After login, go to app
      nav("/app", { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const submitSignup = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      // only for first admin creation
      await api.post("/api/auth/signup-admin", {
        name: form.name,
        email: form.email,
        password: form.password,
      });

      toast.success("Admin created. Now login.");
      setHasAdmin(true);
      setMode("login");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: "100vh" }}>
        <Spinner />
      </div>
    );
  }

  return (
    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: "100vh", padding: 16 }}>
      <Card className="glass shadow-soft" style={{ width: 440 }}>
        <Card.Body>
          <div className="page-title mb-2 text-white">
            {mode === "login" ? "Login" : "Create Admin"}
          </div>

          <div style={{ color: "var(--muted)" }} className="mb-3 text-white">
            {mode === "login"
              ? "Sign in to continue"
              : "First time setup: create the first admin"}
          </div>

          <Form onSubmit={mode === "login" ? submitLogin : submitSignup}>
            {mode === "signup" && (
              <Form.Group className="mb-3">
                <Form.Label>Name</Form.Label>
                <Form.Control
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Admin name"
                />
              </Form.Group>
            )}

            <Form.Group className="mb-3 text-white">
              <Form.Label>Email</Form.Label>
              <Form.Control
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@example.com"
              />
            </Form.Group>

            <Form.Group className="mb-3 text-white">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Password"
              />
            </Form.Group>

            <Button className="btn btn-gradient w-100" type="submit" disabled={loading}>
              {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Admin"}
            </Button>
          </Form>

          {/* Toggle link like professional apps */}
          <div className="mt-3 text-center" style={{ color: "var(--muted)" }}>
            {mode === "login" ? (
              <>
                {!hasAdmin ? (
                  <span>Admin not found.</span>
                ) : (
                  <>
                    Don’t have an account?{" "}
                    <button
                      className="btn btn-link p-0 align-baseline"
                      style={{ color: "var(--text)" }}
                      onClick={() => setMode("signup")}
                      type="button"
                      disabled={hasAdmin} // signup only when no admin
                      title={hasAdmin ? "Signup disabled after admin exists" : ""}
                    >
                      Sign up
                    </button>
                    <div className="small mt-1">
                      Signup is only for first admin setup.
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  className="btn btn-link p-0 align-baseline"
                  style={{ color: "var(--text)" }}
                  onClick={() => setMode("login")}
                  type="button"
                >
                  Login
                </button>
              </>
            )}
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}