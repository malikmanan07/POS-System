import React, { useState } from "react";
import { Modal, Button, Form, Row, Col, Table, InputGroup } from "react-bootstrap";
import CascadingCategorySelect from "./CascadingCategorySelect";

export default function ProductFormModal({
    show,
    onHide,
    handleSubmit,
    formData,
    setFormData,
    editMode,
    categories,
    suppliers,
    currencySymbol,
    imagePreview,
    handleImageChange,
    setImagePreview,
    setRemoveImageFlag
}) {
    const handleAddVariant = () => {
        setFormData(prev => ({
            ...prev,
            variants: [...(prev.variants || []), {
                name: "",
                cost_price: prev.cost_price || 0,
                price: prev.price || 0,
                stock: 0,
                alert_quantity: prev.alert_quantity || 5
            }]
        }));
    };

    const handleRemoveVariant = (index) => {
        setFormData(prev => {
            const newV = [...prev.variants];
            newV.splice(index, 1);
            return { ...prev, variants: newV };
        });
    };

    const handleVariantChange = (index, field, value) => {
        setFormData(prev => {
            const newV = [...prev.variants];
            newV[index][field] = value;

            // Auto generate SKU if name changes
            if (field === 'name' && prev.sku) {
                const subSku = value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
                if (subSku) {
                    newV[index].sku = `${prev.sku}-${subSku}`;
                }
            }

            return { ...prev, variants: newV };
        });
    };

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
                                    value={formData.sku || ""}
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
                                <CascadingCategorySelect
                                    categories={categories}
                                    selectedId={formData.category_id}
                                    onSelect={(id) => setFormData({ ...formData, category_id: id })}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="text-muted small fw-bold text-primary">SELECT SUPPLIER</Form.Label>
                                <Form.Select
                                    value={formData.supplier_id || ""}
                                    onChange={e => setFormData({ ...formData, supplier_id: e.target.value })}
                                    className="bg-dark text-light border-primary shadow-none"
                                >
                                    <option value="">No Supplier Assigned</option>
                                    {suppliers.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label className="text-muted small fw-bold">COST PRICE ({currencySymbol})</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    value={formData.cost_price}
                                    onChange={e => setFormData({ ...formData, cost_price: e.target.value })}
                                    className="bg-dark text-light border-secondary shadow-none"
                                    disabled={formData.variants?.length > 0}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label className="text-muted small fw-bold">SELLING PRICE ({currencySymbol})</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                                    className="bg-dark text-light border-secondary shadow-none"
                                    disabled={formData.variants?.length > 0}
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
                                    disabled={formData.variants?.length > 0}
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="text-muted small fw-bold">PRODUCT IMAGE</Form.Label>
                                <div className="d-flex gap-3 align-items-start">
                                    <div
                                        className="rounded-3 bg-dark border border-secondary d-flex align-items-center justify-content-center"
                                        style={{ width: '80px', height: '80px', overflow: 'hidden', flexShrink: 0 }}
                                    >
                                        {imagePreview ? (
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <i className="bi bi-image text-muted" style={{ fontSize: '1.5rem' }}></i>
                                        )}
                                    </div>
                                    <div className="flex-grow-1">
                                        <Form.Control
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="bg-dark text-light border-secondary shadow-none mb-2"
                                            size="sm"
                                        />
                                        {imagePreview && (
                                            <Button
                                                variant="link"
                                                className="text-danger p-0 small text-decoration-none"
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
                        <Col md={3}>
                            <Form.Group className="mb-3">
                                <Form.Label className="text-muted small fw-bold text-warning">ALERT QTY</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={formData.alert_quantity}
                                    onChange={e => setFormData({ ...formData, alert_quantity: e.target.value })}
                                    className="bg-dark text-warning border-warning shadow-none"
                                />
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group className="mb-3">
                                <Form.Label className="text-muted small fw-bold">STATUS</Form.Label>
                                <div className="mt-2 text-end pe-3">
                                    <Form.Check
                                        type="switch"
                                        id="product-active-switch"
                                        label={formData.is_active ? "Active" : "Inactive"}
                                        checked={formData.is_active}
                                        onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                        className="text-light"
                                    />
                                </div>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={12}>
                            <Form.Group className="mb-3">
                                <Form.Label className="text-muted small fw-bold">DESCRIPTION</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={2}
                                    placeholder="Enter description..."
                                    value={formData.description || ""}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="bg-dark text-light border-secondary shadow-none"
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    {/* VARIANTS SECTION REMOVED */}
                </Modal.Body>
                <Modal.Footer className="border-top border-secondary">
                    <Button variant="outline-secondary" onClick={onHide} className="border-0">
                        Cancel
                    </Button>
                    <Button type="submit" className="btn-gradient border-0 px-4">
                        {editMode ? "Save Changes" : "Save Product"}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}
