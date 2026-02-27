import { Modal, Button, Form } from "react-bootstrap";

export default function CategoryFormModal({
    show,
    onHide,
    handleSubmit,
    name,
    setName,
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
                <Modal.Title className="fw-bold">{editMode ? "Edit Category" : "Create New Category"}</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body className="p-4">
                    <Form.Group className="mb-3">
                        <Form.Label className="text-muted small fw-bold">CATEGORY NAME</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="e.g., Electronics, Food, Drinks"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            autoFocus
                            className="bg-dark text-light border-secondary shadow-none"
                            required
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer className="border-top border-secondary">
                    <Button variant="outline-secondary" onClick={onHide} className="border-0">
                        Cancel
                    </Button>
                    <Button type="submit" className="btn-gradient border-0 px-4">
                        {editMode ? "Save Changes" : "Add Category"}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}
