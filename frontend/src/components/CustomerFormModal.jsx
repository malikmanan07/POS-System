import { Modal, Button, Form } from "react-bootstrap";

export default function CustomerFormModal({
    show,
    onHide,
    handleSubmit,
    formData,
    setFormData,
    editMode
}) {
    return (
        <Modal
            show={show}
            onHide={onHide}
            centered
            contentClassName="glass border-0"
        >
            <Modal.Header closeButton closeVariant="white" className="border-bottom border-secondary">
                <Modal.Title className="fw-bold">{editMode ? "Edit Customer" : "Add Customer"}</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body className="p-4">
                    <Form.Group className="mb-3">
                        <Form.Label className="text-muted small fw-bold">FULL NAME</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Enter customer name"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="bg-dark text-light border-secondary shadow-none"
                            required
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label className="text-muted small fw-bold">PHONE NUMBER</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="e.g., +123456789"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            className="bg-dark text-light border-secondary shadow-none"
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label className="text-muted small fw-bold">EMAIL ADDRESS</Form.Label>
                        <Form.Control
                            type="email"
                            placeholder="customer@example.com"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            className="bg-dark text-light border-secondary shadow-none"
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label className="text-muted small fw-bold">ADDRESS</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={2}
                            placeholder="Full address"
                            value={formData.address}
                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                            className="bg-dark text-light border-secondary shadow-none"
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer className="border-top border-secondary">
                    <Button variant="outline-secondary" onClick={onHide} className="border-0">
                        Cancel
                    </Button>
                    <Button type="submit" className="btn-gradient border-0 px-4">
                        {editMode ? "Save Changes" : "Save Customer"}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}
