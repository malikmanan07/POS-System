import { useState, useEffect } from "react";
import { Modal, Button, Table, Form, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { api } from "../../api/client";

export default function ReturnSaleModal({ show, onHide, saleId, token, currencySymbol, onSuccess }) {
    const [sale, setSale] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [returnQtys, setReturnQtys] = useState({}); // productId -> qty

    useEffect(() => {
        if (show && saleId) {
            fetchSale();
        }
        if (!show) {
            setSale(null);
            setReturnQtys({});
        }
    }, [show, saleId]);

    const fetchSale = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/api/sales/${saleId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSale(res.data);
            // Initialize return quantities to 0
            const initial = {};
            res.data.items.forEach(item => {
                initial[item.productId] = 0;
            });
            setReturnQtys(initial);
        } catch (err) {
            toast.error("Failed to load sale details");
            onHide();
        } finally {
            setLoading(false);
        }
    };

    const handleQtyChange = (productId, val, max) => {
        const qty = Math.max(0, Math.min(max, parseInt(val) || 0));
        setReturnQtys(prev => ({ ...prev, [productId]: qty }));
    };

    const calculateRefund = () => {
        if (!sale) return 0;
        return sale.items.reduce((acc, item) => {
            const qty = returnQtys[item.productId] || 0;
            return acc + (parseFloat(item.price) * qty);
        }, 0);
    };

    const handleConfirmReturn = async () => {
        const itemsToReturn = Object.entries(returnQtys)
            .filter(([_, qty]) => qty > 0)
            .map(([productId, qty]) => ({ productId: parseInt(productId), returnQty: qty }));

        if (itemsToReturn.length === 0) {
            return toast.error("Please select items and quantities to return");
        }

        setIsSaving(true);
        try {
            await api.post(`/api/sales/${saleId}/return`,
                { items: itemsToReturn },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("Return processed successfully!");
            onSuccess();
            onHide();
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to process return");
        } finally {
            setIsSaving(false);
        }
    };

    const totalRefund = calculateRefund();

    return (
        <Modal show={show} onHide={onHide} size="lg" centered contentClassName="glass border-0">
            <Modal.Header closeButton closeVariant="white" className="border-bottom border-secondary">
                <Modal.Title className="fw-bold">
                    <i className="bi bi-arrow-return-left me-2"></i>
                    Process Return <span className="text-primary small">#SALE{saleId}</span>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-0">
                {loading ? (
                    <div className="text-center py-5">
                        <Spinner animation="border" variant="primary" />
                    </div>
                ) : sale && (
                    <div className="p-4">
                        <div className="mb-4">
                            <h6 className="text-white small fw-bold mb-3 opacity-50">SELECTED PRODUCTS</h6>
                            <Table hover variant="dark" className="glass border-white-10">
                                <thead>
                                    <tr className="border-bottom border-white-10">
                                        <th className="small">PRODUCT</th>
                                        <th className="small text-center">PRICE</th>
                                        <th className="small text-center">PURCHASED</th>
                                        <th className="small text-center">RETURNED</th>
                                        <th className="small text-center" style={{ width: '150px' }}>RETURN QTY</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sale.items.map(item => {
                                        const remaining = item.qty - (item.returned_qty || 0);
                                        return (
                                            <tr key={item.id} className="border-bottom border-white-10 align-middle">
                                                <td>
                                                    <div className="fw-bold">{item.product_name}</div>
                                                    <div className="x-small text-muted">{item.sku}</div>
                                                </td>
                                                <td className="text-center">{currencySymbol}{parseFloat(item.price).toFixed(2)}</td>
                                                <td className="text-center">{item.qty}</td>
                                                <td className="text-center text-danger">{item.returned_qty || 0}</td>
                                                <td>
                                                    <Form.Control
                                                        type="number"
                                                        value={returnQtys[item.productId] || 0}
                                                        onChange={(e) => handleQtyChange(item.productId, e.target.value, remaining)}
                                                        disabled={remaining === 0}
                                                        size="sm"
                                                        className="bg-dark text-white border-secondary text-center rounded-pill"
                                                        min="0"
                                                        max={remaining}
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </Table>
                        </div>

                        <div className="glass p-3 border-white-10 rounded-3 d-flex justify-content-between align-items-center">
                            <div>
                                <span className="text-muted small d-block">ESTIMATED REFUND</span>
                                <h3 className="mb-0 text-success fw-bold">
                                    {currencySymbol}{totalRefund.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </h3>
                            </div>
                            <div className="text-end">
                                <Button variant="outline-secondary" className="me-2 rounded-pill px-4" onClick={onHide}>
                                    Cancel
                                </Button>
                                <Button
                                    variant="success"
                                    className="rounded-pill px-4"
                                    onClick={handleConfirmReturn}
                                    disabled={isSaving || totalRefund === 0}
                                >
                                    {isSaving ? <Spinner size="sm" /> : "Confirm Refund"}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </Modal.Body>
        </Modal>
    );
}
