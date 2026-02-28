import { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Table, Spinner } from "react-bootstrap";

import StockMovementBadge from "../components/StockMovementBadge";
import PaginationControl from "../components/PaginationControl";

export default function StockHistory() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [pagination, setPagination] = useState({ page: 1, limit: 10 });
    const { token } = useAuth();
    const API_PATH = "/api/stock/history";

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await api.get(`${API_PATH}?limit=all`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHistory(res.data || []);
        } catch (err) {
            toast.error("Failed to load history data");
        } finally {
            setLoading(false);
        }
    };

    // Instant Search & filtering logic
    const filteredHistory = useMemo(() => {
        if (!searchTerm) return history;
        const s = searchTerm.toLowerCase();
        return history.filter(h =>
            h.product_name.toLowerCase().includes(s) ||
            (h.sku && h.sku.toLowerCase().includes(s)) ||
            (h.reference && h.reference.toLowerCase().includes(s))
        );
    }, [history, searchTerm]);

    // Reset page on search
    useEffect(() => {
        setPagination(prev => ({ ...prev, page: 1 }));
    }, [searchTerm]);

    const totalPages = Math.ceil(filteredHistory.length / pagination.limit);

    const paginatedHistory = useMemo(() => {
        const start = (pagination.page - 1) * pagination.limit;
        return filteredHistory.slice(start, start + pagination.limit);
    }, [filteredHistory, pagination.page, pagination.limit]);

    return (
        <div className="p-4 h-100">
            <div className="mb-4">
                <h2 className="page-title mb-1">Stock Movement History</h2>
                <p className="text-white mb-0">Track all changes in product inventory</p>
            </div>

            <div className="glass p-3 mb-4 d-flex gap-3 align-items-center shadow-soft">
                <i className="bi bi-search text-primary h5 mb-0"></i>
                <input
                    type="text"
                    placeholder="Search history by product, SKU or reference..."
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
                            paginatedHistory.map((h, index) => (
                                <tr key={h.id}>
                                    <td className="px-4 py-3 align-middle text-muted small" title={`DB ID: ${h.id}`}>
                                        {(pagination.page - 1) * pagination.limit + index + 1}
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
                pagination={{
                    ...pagination,
                    total: filteredHistory.length,
                    pages: totalPages
                }}
                setPage={(page) => setPagination(prev => ({ ...prev, page }))}
            />
        </div>
    );
}
