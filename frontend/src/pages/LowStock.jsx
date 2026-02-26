import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Table, Badge, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

export default function LowStock() {
    const [products, setProducts] = useState([]);
    const { token } = useAuth();
    const navigate = useNavigate();
    const API_PATH = "/api/stock";

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

    return (
        <div className="p-4 h-100">
            <div className="mb-4">
                <h2 className="page-title mb-1 text-danger">Low Stock Alerts</h2>
                <p className="text-white mb-0">Products that are running out of stock (Threshold: 5)</p>
            </div>

            <div className="table-darkx">
                <Table className="table table-borderless table-hover mb-0">
                    <thead>
                        <tr>
                            <th className="px-4 py-3">PRODUCT</th>
                            <th className="px-4 py-3">SKU</th>
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
                                <td className="px-4 py-3 align-middle text-center">
                                    <h5 className="mb-0">
                                        <Badge bg="danger" className="px-3 py-2">
                                            {p.stock}
                                        </Badge>
                                    </h5>
                                </td>
                                <td className="px-4 py-3 text-end align-middle">
                                    <Button
                                        variant="outline-primary"
                                        size="sm"
                                        className="rounded-3 border-0"
                                        onClick={() => navigate("/app/inventory")}
                                    >
                                        Manage Stock
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
        </div>
    );
}
