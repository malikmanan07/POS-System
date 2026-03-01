import { Modal, Form, Row, Col, Button } from "react-bootstrap";

export default function SupplierFormModal({
    show,
    onHide,
    handleSubmit,
    formData,
    setFormData,
    editingSupplier,
    isSaving
}) {
    return (
        <Modal
            show={show}
            onHide={onHide}
            centered
            contentClassName="glass border-0"
            size="lg"
        >
            <Modal.Header closeButton closeVariant="white" className="border-bottom border-secondary">
                <Modal.Title className="fw-bold text-white">
                    {editingSupplier ? "Edit Supplier" : "Add New Supplier"}
                </Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body className="p-4 bg-dark">
                    <Form.Group className="mb-4">
                        <Form.Label className="text-muted small fw-bold">VENDOR NAME / COMPANY</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Enter full name..."
                            className="bg-dark text-white border-secondary shadow-none no-focus-outline"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </Form.Group>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-4">
                                <Form.Label className="text-muted small fw-bold">CONTACT NUMBER</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="e.g., +92 XXX XXXXXXX"
                                    className="bg-dark text-white border-secondary shadow-none"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-4">
                                <Form.Label className="text-muted small fw-bold">EMAIL ADDRESS</Form.Label>
                                <Form.Control
                                    type="email"
                                    placeholder="vendor@company.com"
                                    className="bg-dark text-white border-secondary shadow-none"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Form.Group className="mb-3">
                        <Form.Label className="text-muted small fw-bold">PHYSICAL ADDRESS</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            placeholder="Street, City, Country..."
                            className="bg-dark text-white border-secondary shadow-none"
                            value={formData.address}
                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer className="border-top border-secondary bg-dark p-3">
                    <Button variant="outline-secondary" onClick={onHide} className="border-0">
                        Cancel
                    </Button>
                    <Button type="submit" className="btn-gradient px-4 border-0" disabled={isSaving}>
                        {isSaving ? "Saving..." : editingSupplier ? "Save Changes" : "Create Supplier"}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}
