import { Tab, Nav, Row, Col, Spinner } from "react-bootstrap";
import useSettingsLogic from "../hooks/useSettingsLogic";
import BusinessSettings from "../components/settings/BusinessSettings";
import TaxSettings from "../components/settings/TaxSettings";
import InvoiceSettings from "../components/settings/InvoiceSettings";
import PaymentSettings from "../components/settings/PaymentSettings";
import "../styles/settings.css";

export default function Settings() {
    const {
        activeTab, setActiveTab, loading, settings, logoPreview,
        setLogoFile, setLogoPreview, handleChange, handleSave, handleRemoveLogo
    } = useSettingsLogic();

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
                                <Tab.Pane eventKey="business">
                                    <BusinessSettings
                                        settings={settings.business}
                                        handleChange={handleChange}
                                        handleSave={handleSave}
                                        logoPreview={logoPreview}
                                        setLogoFile={setLogoFile}
                                        setLogoPreview={setLogoPreview}
                                        handleRemoveLogo={handleRemoveLogo}
                                    />
                                </Tab.Pane>

                                <Tab.Pane eventKey="tax">
                                    <TaxSettings
                                        settings={settings.tax}
                                        handleChange={handleChange}
                                        handleSave={handleSave}
                                    />
                                </Tab.Pane>

                                <Tab.Pane eventKey="invoice">
                                    <InvoiceSettings
                                        settings={settings.invoice}
                                        handleChange={handleChange}
                                        handleSave={handleSave}
                                    />
                                </Tab.Pane>

                                <Tab.Pane eventKey="payment">
                                    <PaymentSettings
                                        settings={settings.payment}
                                        handleChange={handleChange}
                                        handleSave={handleSave}
                                    />
                                </Tab.Pane>
                            </Tab.Content>
                        </div>
                    </Col>
                </Row>
            </Tab.Container>
        </div>
    );
}
