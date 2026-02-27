import { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Table, Badge, Button } from "react-bootstrap";
import StockAdjustmentModal from "../components/StockAdjustmentModal";
import PaginationControl from "../components/PaginationControl";

export default function LowStock() {
    const [products, setProducts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const { token } = useAuth();
    const API_PATH = "/api/stock";
    const [pagination, setPagination] = useState({ page: 1, limit: 10 });

    useEffect(() => {
        fetchStock();
    }, []);

    const fetchStock = async () => {
        try {
            const res = await api.get(API_PATH, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Filter products where stock <= alert_quantity
            setProducts(res.data.filter(p => p.stock <= (p.alert_quantity || 5)));
        } catch (err) {
            toast.error("Failed to load stock data");
        }
    };

    // Instant Search logic
    const filteredProducts = useMemo(() => {
        if (!searchTerm) return products;
        const s = searchTerm.toLowerCase();
        return products.filter(p =>
            p.name.toLowerCase().includes(s) ||
            (p.sku && p.sku.toLowerCase().includes(s))
        );
    }, [products, searchTerm]);

    // Reset page on search
    useEffect(() => {
        setPagination(prev => ({ ...prev, page: 1 }));
    }, [searchTerm]);

    const paginatedProducts = useMemo(() => {
        const start = (pagination.page - 1) * pagination.limit;
        return filteredProducts.slice(start, start + pagination.limit);
    }, [filteredProducts, pagination.page, pagination.limit]);

    const totalPages = Math.ceil(filteredProducts.length / pagination.limit);

    const handleOpenAdjust = (product) => {
        setSelectedProduct(product);
        setShowModal(true);
    };

    return (
        <div className="p-4 h-100">
            <div className="mb-4">
                <h2 className="page-title mb-1 text-danger">Low Stock Alerts</h2>
                <p className="text-white mb-0">Products that have reached or dropped below their minimum stock levels.</p>
            </div>

            <div className="glass p-3 mb-4 d-flex gap-3 align-items-center shadow-soft">
                <i className="bi bi-search text-primary h5 mb-0"></i>
                <input
                    type="text"
                    placeholder="Search low stock items by name or SKU..."
                    className="bg-transparent border-0 text-white shadow-none fs-5 w-100 outline-none"
                    style={{ outline: 'none' }}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="table-darkx">
                <Table className="table table-borderless table-hover mb-0">
                    <thead>
                        <tr>
                            <th className="px-4 py-3">S.NO</th>
                            <th className="px-4 py-3">PRODUCT</th>
                            <th className="px-4 py-3">SKU</th>
                            <th className="px-4 py-3 text-center">CURRENT STOCK</th>
                            <th className="px-4 py-3 text-end">ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedProducts.map((p, index) => (
                            <tr key={p.id}>
                                <td className="px-4 py-3 align-middle text-muted small" title={`DB ID: ${p.id}`}>
                                    {(pagination.page - 1) * pagination.limit + index + 1}
                                </td>
                                <td className="px-4 py-3 align-middle">
                                    <div className="fw-bold">{p.name}</div>
                                </td>
                                <td className="px-4 py-3 align-middle text-muted">{p.sku || "N/A"}</td>
                                <td className="px-4 py-3 align-middle text-center">
                                    <h5 className="mb-0">
                                        <Badge bg="danger" className="px-3 py-2">
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
                                <td colSpan="4" className="text-center py-5 text-muted">
                                    <i className="bi bi-check-circle text-success d-block mb-2" style={{ fontSize: '2rem' }}></i>
                                    No low stock alerts. All products are well stocked!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </div>

            <PaginationControl
                pagination={{
                    ...pagination,
                    total: filteredProducts.length,
                    pages: totalPages
                }}
                setPage={(page) => setPagination(prev => ({ ...prev, page }))}
            />
            <StockAdjustmentModal
                show={showModal}
                onHide={() => setShowModal(false)}
                product={selectedProduct}
                onSuccess={fetchStock}
            />
        </div>
    );
}
