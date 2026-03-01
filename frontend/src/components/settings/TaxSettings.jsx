import { Form, Button, Row, Col } from "react-bootstrap";

export default function TaxSettings({ settings, handleChange, handleSave }) {
    return (
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
                            value={settings.taxName}
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
                            value={settings.taxRate}
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
                        checked={settings.enableTax}
                        onChange={(e) => handleChange("tax", "enableTax", e.target.checked)}
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
