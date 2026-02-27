import { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { api } from "../api/client";
import { toast } from "react-toastify";
import { useAuth } from "../auth/AuthContext";

export default function StockAdjustmentModal({ show, onHide, product, onSuccess }) {
    const { token } = useAuth();
    const [formData, setFormData] = useState({
        type: "increase", // increase, decrease, adjustment
        qty: 0,
        note: "",
        reference: "Manual Adjustment"
    });

    useEffect(() => {
        if (show) {
            setFormData({
                type: "increase",
                qty: 0,
                note: "",
                reference: "Manual Adjustment"
            });
        }
    }, [show]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.qty < 0 && formData.type !== "adjustment") {
            return toast.error("Quantity must be positive for increase/decrease");
        }

        try {
            await api.post(`/api/stock/adjust`, {
                product_id: product.id,
                ...formData
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success("Stock updated successfully");
            onHide();
            if (onSuccess) onSuccess();
        } catch (err) {
            toast.error(err.response?.data?.error || "Error updating stock");
        }
    };

    return (
        <Modal
            show={show}
            onHide={onHide}
            centered
            contentClassName="glass border-0"
        >
            <Modal.Header closeButton closeVariant="white" className="border-bottom border-secondary">
                <Modal.Title className="fw-bold">Adjust Stock: {product?.name}</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body className="p-4">
                    <Form.Group className="mb-3">
                        <Form.Label className="text-muted small fw-bold">ADJUSTMENT TYPE</Form.Label>
                        <Form.Select
                            value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                            className="bg-dark text-light border-secondary shadow-none"
                        >
                            <option value="increase">Stock In (Increase)</option>
                            <option value="decrease">Stock Out (Decrease)</option>
                            <option value="adjustment">Stock Correction (Set Absolute)</option>
                            <option value="return">Item Return (Add Back)</option>
                            <option value="damaged">Damaged Item (Remove)</option>
                        </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label className="text-muted small fw-bold">
                            {formData.type === "adjustment" ? "NEW TOTAL STOCK" : "QUANTITY"}
                        </Form.Label>
                        <Form.Control
                            type="number"
                            value={formData.qty}
                            onChange={e => setFormData({ ...formData, qty: e.target.value })}
                            className="bg-dark text-light border-secondary shadow-none"
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label className="text-muted small fw-bold">REFERENCE</Form.Label>
                        <Form.Control
                            type="text"
                            value={formData.reference}
                            onChange={e => setFormData({ ...formData, reference: e.target.value })}
                            className="bg-dark text-light border-secondary shadow-none"
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label className="text-muted small fw-bold">NOTE / REASON</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={2}
                            value={formData.note}
                            onChange={e => setFormData({ ...formData, note: e.target.value })}
                            className="bg-dark text-light border-secondary shadow-none"
                            placeholder="Why are you adjusting this stock?"
                        />
                    </Form.Group>

                    <div className="alert alert-info bg-opacity-10 border-info text-info small py-2">
                        Current Stock: <strong>{product?.stock}</strong> <br />
                        {formData.type === 'increase' && `Future Stock: ${parseInt(product?.stock || 0) + parseInt(formData.qty || 0)}`}
                        {formData.type === 'decrease' && `Future Stock: ${parseInt(product?.stock || 0) - parseInt(formData.qty || 0)}`}
                        {formData.type === 'adjustment' && `Future Stock: ${formData.qty}`}
                    </div>
                </Modal.Body>
                <Modal.Footer className="border-top border-secondary">
                    <Button variant="outline-secondary" onClick={onHide} className="border-0">
                        Cancel
                    </Button>
                    <Button type="submit" className="btn-gradient border-0 px-4">
                        Apply Adjustment
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}
