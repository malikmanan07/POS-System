import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Table, Badge } from "react-bootstrap";

export default function StockHistory() {
    const [history, setHistory] = useState([]);
    const { token } = useAuth();
    const API_PATH = "/api/stock/history";

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await api.get(API_PATH, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHistory(res.data);
        } catch (err) {
            toast.error("Failed to load history data");
        }
    };

    const getBadge = (type) => {
        switch (type) {
            case 'increase': return <Badge bg="success">STOCK INCREASE</Badge>;
            case 'decrease': return <Badge bg="danger">STOCK DECREASE</Badge>;
            case 'out': return <Badge bg="info">SALE (OUT)</Badge>;
            case 'return': return <Badge bg="primary">ITEM RETURN</Badge>;
            case 'damaged': return <Badge bg="dark">DAMAGED</Badge>;
            case 'adjustment': return <Badge bg="warning" text="dark">MANUAL ADJUSTMENT</Badge>;
            default: return <Badge bg="secondary">{type.toUpperCase()}</Badge>;
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
                            <th className="px-4 py-3">DATE</th>
                            <th className="px-4 py-3">PRODUCT</th>
                            <th className="px-4 py-3">TYPE</th>
                            <th className="px-4 py-3 text-center">QTY</th>
                            <th className="px-4 py-3">REFERENCE</th>
                            <th className="px-4 py-3">NOTE</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.map(h => (
                            <tr key={h.id}>
                                <td className="px-4 py-3 align-middle text-muted">
                                    {new Date(h.created_at).toLocaleString()}
                                </td>
                                <td className="px-4 py-3 align-middle">
                                    <div className="fw-bold">{h.product_name}</div>
                                    <small className="text-muted">{h.sku}</small>
                                </td>
                                <td className="px-4 py-3 align-middle">
                                    {getBadge(h.type)}
                                </td>
                                <td className="px-4 py-3 align-middle text-center fw-bold">
                                    {h.qty > 0 ? `+${h.qty}` : h.qty}
                                </td>
                                <td className="px-4 py-3 align-middle">{h.reference}</td>
                                <td className="px-4 py-3 align-middle small text-muted">{h.note}</td>
                            </tr>
                        ))}
                        {history.length === 0 && (
                            <tr>
                                <td colSpan="6" className="text-center py-4 text-muted">No history records found</td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </div>
        </div>
    );
}
