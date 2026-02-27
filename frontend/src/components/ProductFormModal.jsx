import { Modal, Button, Form, Row, Col } from "react-bootstrap";

export default function ProductFormModal({
    show,
    onHide,
    handleSubmit,
    formData,
    setFormData,
    editMode,
    categories,
    imagePreview,
    handleImageChange,
    setImagePreview,
    setRemoveImageFlag
}) {
    return (
        <Modal
            show={show}
            onHide={onHide}
            centered
            size="lg"
            contentClassName="glass border-0"
        >
            <Modal.Header closeButton closeVariant="white" className="border-bottom border-secondary">
                <Modal.Title className="fw-bold">{editMode ? "Edit Product" : "Create New Product"}</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body className="p-4">
                    <Row>
                        <Col md={8}>
                            <Form.Group className="mb-3">
                                <Form.Label className="text-muted small fw-bold">PRODUCT NAME</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Enter product name"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="bg-dark text-light border-secondary shadow-none"
                                    required
                                />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label className="text-muted small fw-bold">SKU / BARCODE</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="e.g., PROD-001"
                                    value={formData.sku}
                                    onChange={e => setFormData({ ...formData, sku: e.target.value })}
                                    className="bg-dark text-light border-secondary shadow-none"
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="text-muted small fw-bold">CATEGORY</Form.Label>
                                <Form.Select
                                    value={formData.category_id}
                                    onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                                    className="bg-dark text-light border-secondary shadow-none"
                                >
                                    <option value="">Uncategorized</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="text-muted small fw-bold">STATUS</Form.Label>
                                <div className="mt-2">
                                    <Form.Check
                                        type="switch"
                                        id="product-active-switch"
                                        label={formData.is_active ? "Product is Active" : "Product is Inactive"}
                                        checked={formData.is_active}
                                        onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                        className="text-light"
                                    />
                                </div>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label className="text-muted small fw-bold">COST PRICE</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    value={formData.cost_price}
                                    onChange={e => setFormData({ ...formData, cost_price: e.target.value })}
                                    className="bg-dark text-light border-secondary shadow-none"
                                />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label className="text-muted small fw-bold">SELLING PRICE</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                                    className="bg-dark text-light border-secondary shadow-none"
                                />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label className="text-muted small fw-bold">STOCK LEVEL</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={formData.stock}
                                    onChange={e => setFormData({ ...formData, stock: e.target.value })}
                                    className="bg-dark text-light border-secondary shadow-none"
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={8}>
                            <Form.Group className="mb-3">
                                <Form.Label className="text-muted small fw-bold">PRODUCT IMAGE</Form.Label>
                                <div className="d-flex gap-3 align-items-start">
                                    <div
                                        className="rounded-3 bg-dark border border-secondary d-flex align-items-center justify-content-center"
                                        style={{ width: '100px', height: '100px', overflow: 'hidden', flexShrink: 0 }}
                                    >
                                        {imagePreview ? (
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <i className="bi bi-image text-muted" style={{ fontSize: '2rem' }}></i>
                                        )}
                                    </div>
                                    <div className="flex-grow-1">
                                        <Form.Control
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="bg-dark text-light border-secondary shadow-none mb-2"
                                        />
                                        <Form.Text className="text-muted small d-block">
                                            Supported forms: JPG, PNG, WEBP. Max size: 5MB.
                                        </Form.Text>
                                        {imagePreview && (
                                            <Button
                                                variant="link"
                                                className="text-danger p-0 mt-1 small text-decoration-none"
                                                onClick={() => {
                                                    setImagePreview(null);
                                                    setFormData({ ...formData, image: null });
                                                    setRemoveImageFlag(true);
                                                }}
                                            >
                                                Remove image
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label className="text-muted small fw-bold text-warning">ALERT QUANTITY</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={formData.alert_quantity}
                                    onChange={e => setFormData({ ...formData, alert_quantity: e.target.value })}
                                    className="bg-dark text-warning border-warning shadow-none"
                                    placeholder="Alert at e.g., 5"
                                />
                                <Form.Text className="text-muted small">Show alert when stock hits this level.</Form.Text>
                            </Form.Group>
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer className="border-top border-secondary">
                    <Button variant="outline-secondary" onClick={onHide} className="border-0">
                        Cancel
                    </Button>
                    <Button type="submit" className="btn-gradient border-0 px-4">
                        {editMode ? "Save Changes" : "Add Product"}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}
