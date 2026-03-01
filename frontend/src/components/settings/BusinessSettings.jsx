import { Form, Button, Row, Col } from "react-bootstrap";
import { api } from "../../api/client";

export default function BusinessSettings({ settings, handleChange, handleSave, logoPreview, setLogoFile, setLogoPreview, handleRemoveLogo }) {
    return (
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
                            value={settings.storeName}
                            onChange={(e) => handleChange("business", "storeName", e.target.value)}
                            className="bg-transparent"
                        />
                    </Form.Group>
                </Col>
                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label className="text-muted small fw-bold">CURRENCY</Form.Label>
                        <Form.Select
                            value={settings.currency}
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
                            value={settings.address}
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
                            value={settings.phone}
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
                            value={settings.email}
                            onChange={(e) => handleChange("business", "email", e.target.value)}
                            className="bg-transparent"
                            disabled
                        />
                    </Form.Group>
                </Col>

                <Col md={12}>
                    <Form.Group className="mb-3">
                        <Form.Label className="text-muted small fw-bold">STORE LOGO</Form.Label>
                        <div className="d-flex align-items-start gap-3 p-3 border border-secondary rounded-3 bg-black-25 mb-2">
                            <div
                                className="logo-preview-box rounded d-flex align-items-center justify-content-center overflow-hidden"
                                style={{ width: '100px', height: '100px', background: 'rgba(255,255,255,0.05)', border: '2px dashed rgba(255,255,255,0.1)' }}
                            >
                                {logoPreview ? (
                                    <img
                                        src={logoPreview.startsWith('http') || logoPreview.startsWith('blob') || logoPreview.startsWith('/uploads') ? (logoPreview.startsWith('/uploads') ? `${api.defaults.baseURL}${logoPreview}` : logoPreview) : logoPreview}
                                        alt="Logo Preview"
                                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                    />
                                ) : (
                                    <i className="bi bi-image text-muted fs-1"></i>
                                )}
                            </div>
                            <div className="flex-grow-1">
                                <div className="text-muted small mb-2">Recommended: Square image (min 200x200px)</div>
                                <div className="d-flex gap-2">
                                    <Form.Control
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                setLogoFile(file);
                                                setLogoPreview(URL.createObjectURL(file));
                                            }
                                        }}
                                        className="bg-transparent border-secondary"
                                    />
                                    {logoPreview && (
                                        <Button
                                            variant="outline-danger"
                                            onClick={handleRemoveLogo}
                                            className="d-flex align-items-center gap-1"
                                        >
                                            <i className="bi bi-trash"></i> Remove
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Form.Group>
                </Col>

            </Row>
            <div className="mt-4 border-top pt-4">
                <Button type="submit" className="btn-gradient px-4">Save Changes</Button>
            </div>
        </Form>
    );
}
