import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Button, Form, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";

import { useAuth } from "../auth/AuthContext";

export default function Login() {
  const nav = useNavigate();
  const { login } = useAuth();

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

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

  return (
    <div className="d-flex align-items-center justify-content-center bg-dark" style={{ minHeight: "100vh", padding: 20 }}>
      <Card className="glass shadow-soft border-0" style={{ width: 420, borderRadius: '24px' }}>
        <Card.Body className="p-4 p-md-5">
          <div className="text-center mb-4">
            <h2 className="fw-bold text-white mb-4">Login Form</h2>
            <p className="text-muted small">Enter your credentials to access the POS System</p>
          </div>

          <Form onSubmit={submitLogin}>
            <Form.Group className="mb-3">
              <Form.Label className="text-muted small fw-bold">EMAIL ADDRESS</Form.Label>
              <Form.Control
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="admin@pos.com"
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
              {loading ? <Spinner size="sm" /> : "Login"}
            </Button>
          </Form>

          <div className="mt-4 text-center">
            <small className="text-muted">Default admin: admin@pos.com / admin123</small>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}
