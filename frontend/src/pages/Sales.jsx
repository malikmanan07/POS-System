import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
// No react-bootstrap imports needed here

import SaleDetailsModal from "../components/SaleDetailsModal";
import PaginationControl from "../components/PaginationControl";

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [showModal, setShowModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const { token, hasPermission } = useAuth();
  const isCashierLike = hasPermission("create_sale") && !hasPermission("view_reports");
  const API_PATH = "/api/sales";

  useEffect(() => {
    fetchSales(pagination.page);
  }, [pagination.page]);

  const fetchSales = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`${API_PATH}?page=${page}&limit=${pagination.limit}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSales(res.data.data);
      setPagination(prev => ({ ...prev, ...res.data.pagination, pages: res.data.pagination.pages || res.data.pagination.totalPages || 1 }));
    } catch (err) {
      toast.error("Failed to load sales history");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (id) => {
    try {
      const res = await api.get(`${API_PATH}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedSale(res.data);
      setShowModal(true);
    } catch (err) {
      toast.error("Failed to load sale details");
    }
  };

  return (
    <div className="p-4 h-100">
      <div className="mb-4">
        <h2 className="page-title mb-1">Sales History</h2>
        <p className="text-white mb-0">Review all completed transactions</p>
      </div>

      <div className="table-darkx">
        <table className="table table-borderless table-hover mb-0">
          <thead>
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">DATE</th>
              <th className="px-4 py-3">CUSTOMER</th>
              <th className="px-4 py-3">TOTAL</th>
              <th className="px-4 py-3 text-center">PAYMENT</th>
              {!isCashierLike && <th className="px-4 py-3">CASHIER</th>}
              <th className="px-4 py-3 text-end">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : sales.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-4 text-muted">No sales found</td>
              </tr>
            ) : (
              sales.map((s, index) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 align-middle">
                    {pagination.total - ((pagination.page - 1) * pagination.limit) - index}
                  </td>
                  <td className="px-4 py-3 align-middle small text-muted">
                    {new Date(s.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 align-middle">
                    {s.customer_name || <span className="text-muted italic">Walk-in</span>}
                  </td>
                  <td className="px-4 py-3 align-middle fw-bold">
                    ${parseFloat(s.total).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 align-middle text-center">
                    <span className={`badge-soft ${s.payment_method === 'cash' ? 'text-success' : 'text-info'}`}>
                      {s.payment_method.toUpperCase()}
                    </span>
                  </td>
                  {!isCashierLike && <td className="px-4 py-3 align-middle small">{s.user_name}</td>}
                  <td className="px-4 py-3 text-end align-middle">
                    <button
                      className="btn btn-sm btn-outline-light rounded-3 border-0"
                      onClick={() => handleViewDetail(s.id)}
                    >
                      <i className="bi bi-eye text-primary"></i>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <PaginationControl
        pagination={pagination}
        setPage={(page) => setPagination(prev => ({ ...prev, page }))}
      />

      <SaleDetailsModal
        show={showModal}
        onHide={() => setShowModal(false)}
        sale={selectedSale}
      />
    </div>
  );
}