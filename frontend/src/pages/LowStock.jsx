import { useState, useMemo } from "react";
import { toast } from "react-toastify";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { fetchStockList } from "../api/stockApi";
import { useAuth } from "../auth/AuthContext";
import { Table, Badge, Button } from "react-bootstrap";
import StockAdjustmentModal from "../components/StockAdjustmentModal";
import PaginationControl from "../components/PaginationControl";
import Skeleton from "../components/Skeleton";

export default function LowStock() {
    const { token } = useAuth();
    const queryClient = useQueryClient();
    const [showModal, setShowModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [pagination, setPagination] = useState({ page: 1, limit: 10 });

    const { data: lowStockData, isLoading: loading } = useQuery({
        queryKey: ["lowStock"],
        queryFn: async () => {
            const res = await fetchStockList(token);
            return res.data.filter(p => p.stock <= (p.alert_quantity || 5)) || [];
        },
        enabled: !!token,
        placeholderData: keepPreviousData
    });

    const products = lowStockData || [];

    const filteredProducts = useMemo(() => {
        if (!searchTerm) return products;
        const s = searchTerm.toLowerCase();
        return products.filter(p =>
            p.name.toLowerCase().includes(s) ||
            (p.sku && p.sku.toLowerCase().includes(s))
        );
    }, [products, searchTerm]);

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
                        {loading && products.length === 0 ? (
                            [...Array(6)].map((_, i) => (
                                <tr key={i}>
                                    <td className="px-4 py-3"><Skeleton width="20px" /></td>
                                    <td className="px-4 py-3"><Skeleton width="200px" /></td>
                                    <td className="px-4 py-3"><Skeleton width="100px" /></td>
                                    <td className="px-4 py-3 text-center"><Skeleton width="40px" className="mx-auto" /></td>
                                    <td className="px-4 py-3 text-end"><Skeleton width="80px" className="ms-auto" /></td>
                                </tr>
                            ))
                        ) : paginatedProducts.length > 0 ? (
                            paginatedProducts.map((p, index) => (
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
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="text-center py-5 text-muted">
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
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ["lowStock"] });
                    queryClient.invalidateQueries({ queryKey: ["stock"] });
                    queryClient.invalidateQueries({ queryKey: ["products"] });
                    queryClient.invalidateQueries({ queryKey: ["products-pos"] });
                }}
            />
        </div>
    );
}
