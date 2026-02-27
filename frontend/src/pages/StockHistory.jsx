import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Table, Spinner } from "react-bootstrap";

import StockMovementBadge from "../components/StockMovementBadge";
import PaginationControl from "../components/PaginationControl";

export default function StockHistory() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
    const { token } = useAuth();
    const API_PATH = "/api/stock/history";

    useEffect(() => {
        fetchHistory(pagination.page);
    }, [pagination.page]);

    const fetchHistory = async (page = 1) => {
        setLoading(true);
        try {
            const res = await api.get(`${API_PATH}?page=${page}&limit=${pagination.limit}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHistory(res.data.data);
            setPagination(prev => ({ ...prev, ...res.data.pagination, pages: res.data.pagination.totalPages || res.data.pagination.pages || 1 }));

        } catch (err) {
            toast.error("Failed to load history data");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 h-100">
            <div className="mb-4">
                <h2 className="page-title mb-1">Stock Movement History</h2>
                <p className="text-white mb-0">Track all changes in product inventory</p>
            </div>

            <div className="table-darkx">
                <Table className="table table-borderless table-hover mb-0">
                    <thead>
                        <tr>
                            <th className="px-4 py-3">#</th>
                            <th className="px-4 py-3">DATE</th>
                            <th className="px-4 py-3">PRODUCT</th>
                            <th className="px-4 py-3">TYPE</th>
                            <th className="px-4 py-3 text-center">QTY</th>
                            <th className="px-4 py-3">REFERENCE</th>
                            <th className="px-4 py-3">NOTE</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="7" className="text-center py-5">
                                    <Spinner animation="border" variant="primary" size="sm" className="me-2" />
                                    <span className="text-muted">Loading history...</span>
                                </td>
                            </tr>
                        ) : history.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="text-center py-4 text-muted">No history records found</td>
                            </tr>
                        ) : (
                            history.map((h, index) => (
                                <tr key={h.id}>
                                    <td className="px-4 py-3 align-middle text-muted">
                                        {pagination.total - ((pagination.page - 1) * pagination.limit) - index}
                                    </td>
                                    <td className="px-4 py-3 align-middle text-muted small">
                                        {new Date(h.created_at).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 align-middle">
                                        <div className="fw-bold">{h.product_name}</div>
                                        <small className="text-muted">{h.sku}</small>
                                    </td>
                                    <td className="px-4 py-3 align-middle">
                                        <StockMovementBadge type={h.type} />
                                    </td>
                                    <td className="px-4 py-3 align-middle text-center fw-bold">
                                        {h.qty > 0 ? `+${h.qty}` : h.qty}
                                    </td>
                                    <td className="px-4 py-3 align-middle">{h.reference}</td>
                                    <td className="px-4 py-3 align-middle small text-muted">{h.note}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </Table>
            </div>

            <PaginationControl
                pagination={pagination}
                setPage={(page) => setPagination(prev => ({ ...prev, page }))}
            />
        </div>
    );
}
