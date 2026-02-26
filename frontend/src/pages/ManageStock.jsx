import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Modal, Button, Form, Row, Col, Table, Badge } from "react-bootstrap";

export default function ManageStock() {
    const [products, setProducts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const { token } = useAuth();
    const API_PATH = "/api/stock";

    const [formData, setFormData] = useState({
        type: "increase", // increase, decrease, adjustment
        qty: 0,
        note: "",
        reference: "Manual Adjustment"
    });

    useEffect(() => {
        fetchStock();
    }, []);

    const fetchStock = async () => {
        try {
            const res = await api.get(API_PATH, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProducts(res.data);
        } catch (err) {
            toast.error("Failed to load stock data");
        }
    };

    const handleOpenAdjust = (product) => {
        setSelectedProduct(product);
        setFormData({
            type: "increase",
            qty: 0,
            note: "",
            reference: "Manual Adjustment"
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.qty < 0 && formData.type !== "adjustment") {
            return toast.error("Quantity must be positive for increase/decrease");
        }

        try {
            await api.post(`${API_PATH}/adjust`, {
                product_id: selectedProduct.id,
                ...formData
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success("Stock updated successfully");
            setShowModal(false);
            fetchStock();
        } catch (err) {
            toast.error(err.response?.data?.error || "Error updating stock");
        }
    };

    return (
        <div className="p-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="page-title mb-1">Stock Management</h2>
                    <p className="text-white mb-0">Monitor and adjust product inventory levels</p>
                </div>
            </div>

            <div className="table-darkx">
                <Table className="table table-borderless table-hover mb-0">
                    <thead>
                        <tr>
                            <th className="px-4 py-3">PRODUCT</th>
                            <th className="px-4 py-3">SKU</th>
                            <th className="px-4 py-3">CATEGORY</th>
                            <th className="px-4 py-3 text-center">CURRENT STOCK</th>
                            <th className="px-4 py-3 text-end">ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(p => (
                            <tr key={p.id}>
                                <td className="px-4 py-3 align-middle">
                                    <div className="fw-bold">{p.name}</div>
                                </td>
                                <td className="px-4 py-3 align-middle text-muted">{p.sku || "N/A"}</td>
                                <td className="px-4 py-3 align-middle">
                                    <span className="badge-soft">{p.category_name || "Uncategorized"}</span>
                                </td>
                                <td className="px-4 py-3 align-middle text-center">
                                    <h5 className="mb-0">
                                        <Badge
                                            bg={p.stock <= (p.alert_quantity || 5) ? "danger" : p.stock <= ((p.alert_quantity || 5) * 2) ? "warning" : "success"}
                                            className="px-3 py-2"
                                        >
                                            {p.stock}
                                        </Badge>
                                    </h5>
                                </td>
                                <td className="px-4 py-3 text-end align-middle">
                                    <Button
                                        variant="outline-info"
                                        size="sm"
                                        className="rounded-3 border-0"
                                        onClick={() => handleOpenAdjust(p)}
                                    >
                                        <i className="bi bi-box-arrow-in-down me-1"></i> Adjust Stock
                                    </Button>
                                </td>
                            </tr>
                        ))}
                        {products.length === 0 && (
                            <tr>
                                <td colSpan="5" className="text-center py-4 text-muted">No products found</td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </div>

            <Modal
                show={showModal}
                onHide={() => setShowModal(false)}
                centered
                contentClassName="glass border-0"
            >
                <Modal.Header closeButton closeVariant="white" className="border-bottom border-secondary">
                    <Modal.Title className="fw-bold">Adjust Stock: {selectedProduct?.name}</Modal.Title>
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
                            Current Stock: <strong>{selectedProduct?.stock}</strong> <br />
                            {formData.type === 'increase' && `Future Stock: ${parseInt(selectedProduct?.stock || 0) + parseInt(formData.qty || 0)}`}
                            {formData.type === 'decrease' && `Future Stock: ${parseInt(selectedProduct?.stock || 0) - parseInt(formData.qty || 0)}`}
                            {formData.type === 'adjustment' && `Future Stock: ${formData.qty}`}
                        </div>
                    </Modal.Body>
                    <Modal.Footer className="border-top border-secondary">
                        <Button variant="outline-secondary" onClick={() => setShowModal(false)} className="border-0">
                            Cancel
                        </Button>
                        <Button type="submit" className="btn-gradient border-0 px-4">
                            Apply Adjustment
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
}
