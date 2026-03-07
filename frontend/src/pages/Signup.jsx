import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signupUser } from "../api/authApi";
import { toast } from "react-toastify";
import { Container, Card, Form, Button, Spinner, InputGroup } from "react-bootstrap";

const Signup = () => {
    const [formData, setFormData] = useState({
        businessName: "",
        name: "",
        email: "",
        password: ""
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await signupUser(formData);
            toast.success("Business Registered! Welcome to POS Force.");
            navigate("/login");
        } catch (err) {
            toast.error(err.response?.data?.error || "Registration failed. Try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="d-flex align-items-center justify-content-center bg-dark" style={{ minHeight: "100vh", padding: 40 }}>
            <Card className="glass shadow-soft border-0" style={{ width: 480, borderRadius: '24px' }}>
                <Card.Body className="p-4 p-md-5">
                    <div className="text-center mb-4">
                        <div
                            className="mb-3 d-inline-flex align-items-center justify-content-center rounded-circle bg-primary-subtle bg-opacity-10 text-primary"
                            style={{ width: '80px', height: '80px', border: '1px solid rgba(99, 102, 241, 0.2)' }}
                        >
                            <i className="bi bi-shop fs-1"></i>
                        </div>
                        <div className="mb-2">
                            <span className="badge rounded-pill bg-primary px-3 py-2 small fw-bold text-uppercase fs-6">Force POS System</span>
                        </div>
                        <h3 className="fw-bold text-white mb-2">Create Business Account</h3>
                        <p className="text-muted small px-lg-4">Join thousands of retailers and manage your shop professionally</p>
                    </div>

                    <Form onSubmit={handleSignup}>
                        <Form.Group className="mb-3">
                            <Form.Label className="text-muted small fw-bold">BUSINESS NAME</Form.Label>
                            <Form.Control
                                type="text"
                                name="businessName"
                                placeholder="Quantum Solutions"
                                className="bg-dark text-white border-secondary shadow-none py-2 px-3"
                                style={{ borderRadius: '10px' }}
                                value={formData.businessName}
                                onChange={handleChange}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label className="text-muted small fw-bold">FULL NAME</Form.Label>
                            <Form.Control
                                type="text"
                                name="name"
                                placeholder="Admin"
                                className="bg-dark text-white border-secondary shadow-none py-2 px-3"
                                style={{ borderRadius: '10px' }}
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label className="text-muted small fw-bold">EMAIL ADDRESS</Form.Label>
                            <Form.Control
                                type="email"
                                name="email"
                                placeholder="owner@business.com"
                                className="bg-dark text-white border-secondary shadow-none py-2 px-3"
                                style={{ borderRadius: '10px' }}
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-4">
                            <Form.Label className="text-muted small fw-bold">CREATE PASSWORD</Form.Label>
                            <InputGroup className="password-input-group overflow-hidden">
                                <Form.Control
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
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
                            type="submit"
                            className="btn-gradient w-100 py-2 fw-bold text-uppercase shadow-sm"
                            disabled={loading}
                            style={{ borderRadius: '12px', fontSize: '15px', letterSpacing: '0.5px' }}
                        >
                            {loading ? <Spinner size="sm" /> : "Create My Account"}
                        </Button>
                    </Form>

                    <div className="text-center mt-4">
                        <p className="text-muted small mb-0">
                            Already have an account?{" "}
                            <Link to="/login" className="text-primary fw-bold text-decoration-none">Login here</Link>
                        </p>
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
};

export default Signup;
