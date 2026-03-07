import { useState, useMemo } from "react";
import { toast } from "react-toastify";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchStockHistoryList } from "../api/stockApi";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Table } from "react-bootstrap";

import StockMovementBadge from "../components/StockMovementBadge";
import PaginationControl from "../components/PaginationControl";
import Skeleton from "../components/Skeleton";
import { useSettings } from "../context/SettingsContext";

export default function StockHistory() {
    const { token } = useAuth();
    const { currencySymbol: currency } = useSettings();
    const [searchTerm, setSearchTerm] = useState("");
    const [pagination, setPagination] = useState({ page: 1, limit: 10 });

    const { data: stockHistoryData, isLoading: loading } = useQuery({
        queryKey: ["stockHistory"],
        queryFn: async () => {
            const res = await fetchStockHistoryList({
                page: 1,
                limit: 'all',
                search: ''
            }, token);
            return res.data || [];
        },
        enabled: !!token,
        placeholderData: keepPreviousData,
        refetchInterval: 10000, // Refetch every 10 seconds for "real-time" feel
        refetchIntervalInBackground: true
    });

    const history = stockHistoryData || [];

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
                            <th className="px-4 py-3 text-center">COST (UNIT / TOTAL)</th>
                            <th className="px-4 py-3">REFERENCE</th>
                            <th className="px-4 py-3">NOTE</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && history.length === 0 ? (
                            [...Array(6)].map((_, i) => (
                                <tr key={i}>
                                    <td className="px-4 py-3"><Skeleton width="20px" /></td>
                                    <td className="px-4 py-3"><Skeleton width="120px" /></td>
                                    <td className="px-4 py-3"><Skeleton width="180px" /></td>
                                    <td className="px-4 py-3"><Skeleton width="80px" /></td>
                                    <td className="px-4 py-3 text-center"><Skeleton width="40px" className="mx-auto" /></td>
                                    <td className="px-4 py-3 text-center"><Skeleton width="80px" className="mx-auto" /></td>
                                    <td className="px-4 py-3"><Skeleton width="100px" /></td>
                                    <td className="px-4 py-3"><Skeleton width="100px" /></td>
                                </tr>
                            ))
                        ) : history.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="text-center py-4 text-muted">No history records found</td>
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
                                    <td className="px-4 py-3 align-middle text-center">
                                        {h.type === 'increase' || h.type === 'return' ? (
                                            <div>
                                                <div className="text-emerald fw-bold">
                                                    {currency} {parseFloat(h.purchaseCost || 0).toLocaleString()} <small className="text-muted">(Unit)</small>
                                                </div>
                                                <div className="text-primary x-small fw-800" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '2px', paddingTop: '2px' }}>
                                                    {currency} {(Math.abs(h.qty) * parseFloat(h.purchaseCost || 0)).toLocaleString()} <small className="opacity-75">(Total)</small>
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-muted opacity-50">—</span>
                                        )}
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
