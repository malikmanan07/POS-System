import { Form, Button, Row, Col } from "react-bootstrap";

export default function InvoiceSettings({ settings, handleChange, handleSave }) {
    return (
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
                            value={settings.prefix}
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
                            value={settings.suffix}
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
                            value={settings.footerNote}
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
    );
}
