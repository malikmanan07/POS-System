import { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { adjustStock } from "../api/stockApi";
import { api } from "../api/client";
import { toast } from "react-toastify";
import { useAuth } from "../auth/AuthContext";

export default function StockAdjustmentModal({ show, onHide, product, onSuccess }) {
    const { token } = useAuth();
    const [formData, setFormData] = useState({
        type: "increase", // increase, decrease, adjustment
        qty: 0,
        purchase_cost: product?.costPrice || 0,
        note: "",
        reference: "Manual Adjustment"
    });

    useEffect(() => {
        if (show) {
            setFormData({
                type: "increase",
                qty: 0,
                purchase_cost: product?.costPrice || 0,
                note: "",
                reference: "Manual Adjustment"
            });
        }
    }, [show]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.qty <= 0 && formData.type !== "adjustment") {
            return toast.error(`Quantity must be greater than 0 for ${formData.type}`);
        }

        if ((formData.type === "increase" || formData.type === "return" || formData.type === "adjustment") && (!formData.purchase_cost || parseFloat(formData.purchase_cost) <= 0)) {
            return toast.error("Purchase cost is required and must be greater than 0 for adding or adjusting stock");
        }

        try {
            await adjustStock({
                product_id: product.id,
                ...formData
            }, token);

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

                    {(formData.type === "increase" || formData.type === "adjustment" || formData.type === "return") && (
                        <Form.Group className="mb-3">
                            <Form.Label className="text-muted small fw-bold">PURCHASE COST (PER UNIT)</Form.Label>
                            <Form.Control
                                type="number"
                                step="0.01"
                                value={formData.purchase_cost}
                                onChange={e => setFormData({ ...formData, purchase_cost: e.target.value })}
                                className="bg-dark text-light border-secondary shadow-none"
                                required
                            />
                            <Form.Text className="text-info fw-bold d-block mt-1" style={{ fontSize: '0.9rem' }}>
                                Total Purchase Price: {(parseFloat(formData.qty || 0) * parseFloat(formData.purchase_cost || 0)).toLocaleString()}
                            </Form.Text>
                        </Form.Group>
                    )}

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
