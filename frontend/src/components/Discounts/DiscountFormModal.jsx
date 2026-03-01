import { Modal, Form, Row, Col, Button } from "react-bootstrap";
import HierarchicalCategoryPicker from "../HierarchicalCategoryPicker";

export default function DiscountFormModal({
    show,
    onHide,
    handleSave,
    formData,
    setFormData,
    editingItem,
    isSaving,
    categories,
    products,
    catSearch,
    setCatSearch,
    toggleCategorySelection
}) {
    return (
        <Modal show={show} onHide={onHide} size="lg" centered contentClassName="glass border-0">
            <Modal.Header closeButton closeVariant="white" className="border-bottom border-secondary">
                <Modal.Title className="fw-bold">{editingItem ? "Edit Campaign" : "Create New Campaign"}</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSave}>
                <Modal.Body className="p-4">
                    <Row className="g-3">
                        <Col md={8}>
                            <Form.Label className="text-muted small fw-bold">CAMPAIGN TITLE</Form.Label>
                            <Form.Control required type="text" placeholder="e.g. Summer Sale 2024" className="bg-dark text-white border-secondary shadow-none" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                        </Col>
                        <Col md={4}>
                            <Form.Label className="text-muted small fw-bold">TYPE</Form.Label>
                            <Form.Select className="bg-dark text-white border-secondary shadow-none" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                <option value="percentage">Percentage %</option>
                                <option value="flat">Flat Amount</option>
                            </Form.Select>
                        </Col>
                        <Col md={6}>
                            <Form.Label className="text-muted small fw-bold">VALUE</Form.Label>
                            <Form.Control required type="number" step="0.01" placeholder="Enter amount or %" className="bg-dark text-white border-secondary shadow-none" value={formData.value} onChange={e => setFormData({ ...formData, value: e.target.value })} />
                        </Col>
                        <Col md={6}>
                            <Form.Label className="text-muted small fw-bold">STATUS</Form.Label>
                            <div className="mt-2">
                                <Form.Check type="switch" label={formData.isActive ? "Active Campaign" : "Inactive Campaign"} checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} className="text-white" />
                            </div>
                        </Col>
                        <Col md={6}>
                            <Form.Label className="text-muted small fw-bold">START DATE</Form.Label>
                            <Form.Control type="date" className="bg-dark text-white border-secondary shadow-none" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                        </Col>
                        <Col md={6}>
                            <Form.Label className="text-muted small fw-bold">END DATE</Form.Label>
                            <Form.Control type="date" className="bg-dark text-white border-secondary shadow-none" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
                        </Col>

                        <Col md={6}>
                            <Form.Label className="text-muted small fw-bold">RESTRICT TO CATEGORIES</Form.Label>
                            <Form.Control size="sm" type="text" placeholder="Search categories..." className="bg-dark text-white border-secondary mb-2 shadow-none" value={catSearch} onChange={e => setCatSearch(e.target.value)} />
                            <HierarchicalCategoryPicker
                                categories={categories}
                                selectedIds={formData.categoryIds}
                                onToggle={toggleCategorySelection}
                                searchTerm={catSearch}
                            />
                        </Col>

                        <Col md={6}>
                            <Form.Label className="text-muted small fw-bold">SPECIFIC PRODUCTS (OPTIONAL)</Form.Label>
                            <Form.Text className="text-muted d-block mb-2 x-small">If empty, applies to all items in selected categories.</Form.Text>
                            <div className="product-select-box">
                                {(formData.categoryIds.length > 0
                                    ? products.filter(p => formData.categoryIds.includes(p.category_id))
                                    : products
                                ).map(p => (
                                    <div
                                        key={p.id}
                                        className={`product-select-item ${formData.productIds.includes(p.id) ? 'selected' : ''}`}
                                        onClick={() => {
                                            setFormData(prev => {
                                                const ids = [...prev.productIds];
                                                const idx = ids.indexOf(p.id);
                                                if (idx > -1) ids.splice(idx, 1); else ids.push(p.id);
                                                return { ...prev, productIds: ids };
                                            });
                                        }}
                                    >
                                        <div className="flex-grow-1 small">{p.name}</div>
                                        {formData.productIds.includes(p.id) && <i className="bi bi-check-circle-fill text-primary"></i>}
                                    </div>
                                ))}
                            </div>
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer className="border-top border-secondary">
                    <Button variant="outline-secondary" className="border-0" onClick={onHide}>Cancel</Button>
                    <Button type="submit" className="btn-gradient border-0 px-4" disabled={isSaving}>
                        {isSaving ? "Saving..." : (editingItem ? "Update Campaign" : "Add Campaign")}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}
