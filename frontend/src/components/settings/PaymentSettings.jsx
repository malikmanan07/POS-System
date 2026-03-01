import { Form, Button, Row, Col } from "react-bootstrap";

export default function PaymentSettings({ settings, handleChange, handleSave }) {
    return (
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
                                checked={settings.acceptedMethods.includes(method)}
                                onChange={(e) => {
                                    const methods = e.target.checked
                                        ? [...settings.acceptedMethods, method]
                                        : settings.acceptedMethods.filter(m => m !== method);
                                    handleChange("payment", "acceptedMethods", methods);

                                    // Sync default method if currently selected one is removed
                                    if (!e.target.checked && settings.defaultMethod === method) {
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
                            value={settings.defaultMethod}
                            onChange={(e) => handleChange("payment", "defaultMethod", e.target.value)}
                            className="bg-transparent text-white"
                        >
                            {(settings.acceptedMethods || []).filter(m => m !== "Wallet").map(m => (
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
                        checked={settings.enableChangeCalculation}
                        onChange={(e) => handleChange("payment", "enableChangeCalculation", e.target.checked)}
                        className="mb-3 custom-switch"
                    />
                </Col>
            </Row>
            <div className="mt-4 border-top pt-4">
                <Button type="submit" className="btn-gradient px-4">Save Changes</Button>
            </div>
        </Form>
    );
}
