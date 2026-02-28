import { useState, useEffect } from "react";
import { Tab, Nav, Form, Button, Row, Col, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { useSettings } from "../context/SettingsContext";

export default function Settings() {
    const [activeTab, setActiveTab] = useState("business");
    const [loading, setLoading] = useState(true);
    const { token, user } = useAuth();
    const { refreshSettings } = useSettings();
    const isSuperAdmin = user?.roles?.some(r => r.toLowerCase() === "super admin");

    // Local state for settings
    const [settings, setSettings] = useState({
        business: {
            storeName: "",
            address: "",
            phone: "",
            email: "",
            currency: "USD"
        },
        tax: {
            taxName: "GST",
            taxRate: 0,
            enableTax: false
        },
        invoice: {
            prefix: "INV-",
            suffix: "",
            footerNote: ""
        },
        payment: {
            acceptedMethods: ["Cash"],
            defaultMethod: "Cash",
            enableChangeCalculation: true
        }
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const res = await api.get("/api/settings", {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Merge existing state with fetched data to ensure all keys exist
            const fetched = res.data;
            if (fetched.payment?.acceptedMethods) {
                fetched.payment.acceptedMethods = fetched.payment.acceptedMethods.filter(m => m !== "Wallet");
            }

            setSettings(prev => ({
                ...prev,
                ...fetched,
                business: {
                    ...prev.business,
                    ...fetched.business,
                    email: user?.email || fetched.business?.email || ""
                }
            }));
        } catch (err) {
            toast.error("Failed to load settings");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (section, field, value) => {
        setSettings(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const sectionData = { ...settings[activeTab] };

            // If we are saving business settings, ensure email stays as logged-in user's email
            if (activeTab === "business") {
                sectionData.email = user?.email || sectionData.email;
            }

            await api.post(`/api/settings/${activeTab}`, sectionData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await refreshSettings();
            toast.success(`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} settings saved successfully!`);
        } catch (err) {
            toast.error("Failed to save settings");
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center h-100">
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }


    return (
        <div className="p-4 h-100">
            <div className="mb-4">
                <h2 className="page-title mb-1">System Settings</h2>
                <p className="text-white mb-0">Manage your business configuration and preferences</p>
            </div>

            <Tab.Container id="settings-tabs" activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                <Row className="g-4">
                    <Col lg={3}>
                        <div className="glass p-3 h-100 shadow-soft">
                            <Nav variant="pills" className="flex-column gap-2 settings-nav">
                                <Nav.Item>
                                    <Nav.Link eventKey="business" className="nav-itemx border-0 text-start w-100">
                                        <i className="bi bi-building me-2"></i> Business Settings
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link eventKey="tax" className="nav-itemx border-0 text-start w-100">
                                        <i className="bi bi-percent me-2"></i> Tax Configuration
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link eventKey="invoice" className="nav-itemx border-0 text-start w-100">
                                        <i className="bi bi-receipt me-2"></i> Invoice Settings
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link eventKey="payment" className="nav-itemx border-0 text-start w-100">
                                        <i className="bi bi-credit-card me-2"></i> Payment Methods
                                    </Nav.Link>
                                </Nav.Item>
                            </Nav>
                        </div>
                    </Col>

                    <Col lg={9}>
                        <div className="glass p-4 h-100 shadow-soft">
                            <Tab.Content>
                                {/* Business Settings */}
                                <Tab.Pane eventKey="business">
                                    <Form onSubmit={handleSave}>
                                        <h4 className="mb-4 d-flex align-items-center">
                                            <i className="bi bi-building me-2 text-primary"></i> Business Profile
                                        </h4>
                                        <Row className="g-3">
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label className="text-muted small fw-bold">STORE NAME</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        value={settings.business.storeName}
                                                        onChange={(e) => handleChange("business", "storeName", e.target.value)}
                                                        className="bg-transparent"
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label className="text-muted small fw-bold">CURRENCY</Form.Label>
                                                    <Form.Select
                                                        value={settings.business.currency}
                                                        onChange={(e) => handleChange("business", "currency", e.target.value)}
                                                        className="bg-transparent text-white"
                                                    >
                                                        <option value="USD">USD ($)</option>
                                                        <option value="PKR">PKR (Rs)</option>
                                                        <option value="EUR">EUR (€)</option>
                                                        <option value="GBP">GBP (£)</option>
                                                    </Form.Select>
                                                </Form.Group>
                                            </Col>
                                            <Col md={12}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label className="text-muted small fw-bold">ADDRESS</Form.Label>
                                                    <Form.Control
                                                        as="textarea"
                                                        rows={2}
                                                        value={settings.business.address}
                                                        onChange={(e) => handleChange("business", "address", e.target.value)}
                                                        className="bg-transparent"
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label className="text-muted small fw-bold">PHONE NUMBER</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        value={settings.business.phone}
                                                        onChange={(e) => handleChange("business", "phone", e.target.value)}
                                                        className="bg-transparent"
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label className="text-muted small fw-bold">EMAIL ADDRESS</Form.Label>
                                                    <Form.Control
                                                        type="email"
                                                        value={settings.business.email}
                                                        onChange={(e) => handleChange("business", "email", e.target.value)}
                                                        className="bg-transparent"
                                                        disabled
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                        <div className="mt-4 border-top pt-4">
                                            <Button type="submit" className="btn-gradient px-4">Save Changes</Button>
                                        </div>
                                    </Form>
                                </Tab.Pane>

                                {/* Tax Configuration */}
                                <Tab.Pane eventKey="tax">
                                    <Form onSubmit={handleSave}>
                                        <h4 className="mb-4 d-flex align-items-center">
                                            <i className="bi bi-percent me-2 text-primary"></i> Tax Settings
                                        </h4>
                                        <Row className="g-3">
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label className="text-muted small fw-bold">TAX NAME</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        placeholder="e.g. GST, VAT"
                                                        value={settings.tax.taxName}
                                                        onChange={(e) => handleChange("tax", "taxName", e.target.value)}
                                                        className="bg-transparent"
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label className="text-muted small fw-bold">TAX RATE (%)</Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        value={settings.tax.taxRate}
                                                        onChange={(e) => handleChange("tax", "taxRate", e.target.value)}
                                                        className="bg-transparent"
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={12}>
                                                <Form.Check
                                                    type="switch"
                                                    id="enable-tax"
                                                    label="Enable tax calculation on sales"
                                                    checked={settings.tax.enableTax}
                                                    onChange={(e) => handleChange("tax", "enableTax", e.target.checked)}
                                                    className="mb-3 custom-switch"
                                                />
                                            </Col>
                                        </Row>
                                        <div className="mt-4 border-top pt-4">
                                            <Button type="submit" className="btn-gradient px-4">Save Changes</Button>
                                        </div>
                                    </Form>
                                </Tab.Pane>

                                {/* Invoice Settings */}
                                <Tab.Pane eventKey="invoice">
                                    <Form onSubmit={handleSave}>
                                        <h4 className="mb-4 d-flex align-items-center">
                                            <i className="bi bi-receipt me-2 text-primary"></i> Invoice Customization
                                        </h4>
                                        <Row className="g-3">
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label className="text-muted small fw-bold">INVOICE PREFIX</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        value={settings.invoice.prefix}
                                                        onChange={(e) => handleChange("invoice", "prefix", e.target.value)}
                                                        className="bg-transparent"
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label className="text-muted small fw-bold">INVOICE SUFFIX</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        value={settings.invoice.suffix}
                                                        onChange={(e) => handleChange("invoice", "suffix", e.target.value)}
                                                        className="bg-transparent"
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={12}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label className="text-muted small fw-bold">FOOTER NOTE</Form.Label>
                                                    <Form.Control
                                                        as="textarea"
                                                        rows={3}
                                                        value={settings.invoice.footerNote}
                                                        onChange={(e) => handleChange("invoice", "footerNote", e.target.value)}
                                                        className="bg-transparent"
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                        <div className="mt-4 border-top pt-4">
                                            <Button type="submit" className="btn-gradient px-4">Save Changes</Button>
                                        </div>
                                    </Form>
                                </Tab.Pane>

                                {/* Payment Methods */}
                                <Tab.Pane eventKey="payment">
                                    <Form onSubmit={handleSave}>
                                        <h4 className="mb-4 d-flex align-items-center">
                                            <i className="bi bi-credit-card me-2 text-primary"></i> Payment Settings
                                        </h4>
                                        <Row className="g-3">
                                            <Col md={12}>
                                                <Form.Label className="text-muted small fw-bold">ACCEPTED PAYMENT METHODS</Form.Label>
                                                <div className="d-flex gap-3 mb-4">
                                                    {["Cash", "Card", "Online"].map(method => (
                                                        <Form.Check
                                                            key={method}
                                                            type="checkbox"
                                                            id={`pay-${method}`}
                                                            label={method}
                                                            checked={settings.payment.acceptedMethods.includes(method)}
                                                            onChange={(e) => {
                                                                const methods = e.target.checked
                                                                    ? [...settings.payment.acceptedMethods, method]
                                                                    : settings.payment.acceptedMethods.filter(m => m !== method);
                                                                handleChange("payment", "acceptedMethods", methods);

                                                                // Sync default method if currently selected one is removed
                                                                if (!e.target.checked && settings.payment.defaultMethod === method) {
                                                                    const nextDefault = methods.length > 0 ? methods[0] : "";
                                                                    handleChange("payment", "defaultMethod", nextDefault);
                                                                }
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label className="text-muted small fw-bold">DEFAULT PAYMENT METHOD</Form.Label>
                                                    <Form.Select
                                                        value={settings.payment.defaultMethod}
                                                        onChange={(e) => handleChange("payment", "defaultMethod", e.target.value)}
                                                        className="bg-transparent text-white"
                                                    >
                                                        {(settings.payment.acceptedMethods || []).filter(m => m !== "Wallet").map(m => (
                                                            <option key={m} value={m}>{m}</option>
                                                        ))}
                                                    </Form.Select>
                                                </Form.Group>
                                            </Col>
                                            <Col md={12}>
                                                <Form.Check
                                                    type="switch"
                                                    id="enable-change"
                                                    label="Calculate and show change amount in POS"
                                                    checked={settings.payment.enableChangeCalculation}
                                                    onChange={(e) => handleChange("payment", "enableChangeCalculation", e.target.checked)}
                                                    className="mb-3 custom-switch"
                                                />
                                            </Col>
                                        </Row>
                                        <div className="mt-4 border-top pt-4">
                                            <Button type="submit" className="btn-gradient px-4">Save Changes</Button>
                                        </div>
                                    </Form>
                                </Tab.Pane>
                            </Tab.Content>
                        </div>
                    </Col>
                </Row>
            </Tab.Container>

            <style>{`
                .settings-nav .nav-link {
                    color: rgba(255, 255, 255, 0.6);
                    transition: all 0.3s ease;
                }
                .settings-nav .nav-link.active {
                    background: linear-gradient(135deg, rgba(109, 94, 252, .35), rgba(34, 197, 94, .18)) !important;
                    color: #fff !important;
                    border: 1px solid rgba(255, 255, 255, .12) !important;
                }
                .custom-switch .form-check-input {
                    background-color: rgba(255, 255, 255, 0.1);
                    border-color: rgba(255, 255, 255, 0.2);
                    height: 1.5em;
                    width: 3em;
                    cursor: pointer;
                }
                .custom-switch .form-check-input:checked {
                    background-color: var(--primary2);
                    border-color: var(--primary2);
                }
                .form-control:focus, .form-select:focus {
                    background-color: rgba(255, 255, 255, 0.08) !important;
                    border-color: var(--primary) !important;
                    box-shadow: 0 0 0 0.25rem rgba(109, 94, 252, 0.25) !important;
                    color: #fff !important;
                }
                .form-check-label {
                    cursor: pointer;
                }
            `}</style>
        </div>
    );
}
