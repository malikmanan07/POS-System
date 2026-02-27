import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Button, Table, Badge } from "react-bootstrap";
import StockAdjustmentModal from "../components/StockAdjustmentModal";

export default function ManageStock() {
    const [products, setProducts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const { token } = useAuth();
    const API_PATH = "/api/stock";

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
        setShowModal(true);
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

            <StockAdjustmentModal
                show={showModal}
                onHide={() => setShowModal(false)}
                product={selectedProduct}
                onSuccess={fetchStock}
            />
        </div>
    );
}
