import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, Button, Form, Spinner, InputGroup } from "react-bootstrap";
import { toast } from "react-toastify";

import { useAuth } from "../auth/AuthContext";

export default function Login() {
  const nav = useNavigate();
  const { login } = useAuth();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
            <div
              className="mb-3 d-inline-flex align-items-center justify-content-center rounded-circle bg-primary-subtle bg-opacity-10 text-primary"
              style={{ width: '72px', height: '72px', border: '1px solid rgba(99, 102, 241, 0.2)' }}
            >
              <i className="bi bi-person-lock fs-2"></i>
            </div>
            <h2 className="fw-bold text-white mb-2">Login Form</h2>
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
              <InputGroup className="password-input-group overflow-hidden">
                <Form.Control
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="********"
                  required
                />
                <InputGroup.Text
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i className={`bi bi-eye${showPassword ? '-slash' : ''}`}></i>
                </InputGroup.Text>
              </InputGroup>
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

          <div className="text-center mt-4">
            <p className="text-muted small mb-0">
              Don't have an account?{" "}
              <Link to="/signup" className="text-primary fw-bold text-decoration-none">Register here</Link>
            </p>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}
