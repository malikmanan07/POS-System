import { Modal, Button } from "react-bootstrap";

/**
 * Reusable confirmation dialog to replace browser's window.confirm()
 * Props: show, onConfirm, onCancel, title, message, confirmText, confirmVariant
 */
export default function ConfirmDialog({
    show,
    onConfirm,
    onCancel,
    title = "Confirm Action",
    message = "Are you sure?",
    confirmText = "Delete",
    confirmVariant = "danger"
}) {
    return (
        <Modal
            show={show}
            onHide={onCancel}
            centered
            size="sm"
            contentClassName="glass border-0"
            backdrop="static"
        >
            <Modal.Body className="p-4 text-center">
                <div
                    className={`mb-3 mx-auto d-flex align-items-center justify-content-center rounded-circle ${confirmVariant === 'danger' ? 'bg-danger' : 'bg-warning'} bg-opacity-15`}
                    style={{ width: 64, height: 64 }}
                >
                    <i
                        className={`bi ${confirmVariant === 'danger' ? 'bi-trash3' : 'bi-exclamation-triangle'} fs-3 ${confirmVariant === 'danger' ? 'text-danger' : 'text-warning'}`}
                    ></i>
                </div>
                <h5 className="fw-bold text-white mb-2">{title}</h5>
                <p className="text-muted small mb-4">{message}</p>
                <div className="d-flex gap-3 justify-content-center">
                    <Button
                        variant="soft"
                        className="border-0 px-4"
                        onClick={onCancel}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant={confirmVariant}
                        className="px-4 border-0"
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </Button>
                </div>
            </Modal.Body>
        </Modal>
    );
}
