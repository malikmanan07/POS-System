import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Modal, Button, Table, Badge, Pagination } from "react-bootstrap";

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
      setPagination(prev => ({ ...prev, ...res.data.pagination }));
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

      <div className="d-flex justify-content-between align-items-center mt-4">
        <div className="text-muted small">
          Showing {sales.length} of {pagination.total} sales
        </div>

        <div className="d-flex gap-2">
          <Button
            variant="soft"
            size="sm"
            disabled={pagination.page <= 1}
            onClick={() => setPagination(p => ({ ...p, page: Math.max(p.page - 1, 1) }))}
          >
            <i className="bi bi-chevron-left"></i> Previous
          </Button>
          <div className="badge-soft px-3 py-1 d-flex align-items-center">
            Page {pagination.page} of {pagination.pages}
          </div>
          <Button
            variant="soft"
            size="sm"
            disabled={pagination.page >= pagination.pages}
            onClick={() => setPagination(p => ({ ...p, page: Math.min(p.page + 1, pagination.pages) }))}
          >
            Next <i className="bi bi-chevron-right"></i>
          </Button>
        </div>
      </div>

      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        centered
        size="md"
        contentClassName="glass border-0"
      >
        <Modal.Header closeButton closeVariant="white" className="border-bottom border-secondary">
          <Modal.Title className="fw-bold">Sale Details #{selectedSale?.id}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {selectedSale && (
            <>
              <div className="d-flex justify-content-between mb-4">
                <div>
                  <div className="text-muted small fw-bold">DATE</div>
                  <div>{new Date(selectedSale.created_at).toLocaleString()}</div>
                </div>
                <div className="text-end">
                  <div className="text-muted small fw-bold">METHOD</div>
                  <div className="text-capitalize">{selectedSale.payment_method}</div>
                </div>
              </div>

              <Table borderless className="table-darkx bg-transparent mb-4">
                <thead>
                  <tr className="border-bottom border-secondary">
                    <th className="bg-transparent text-muted small px-0">ITEM</th>
                    <th className="bg-transparent text-muted small text-center px-0">QTY</th>
                    <th className="bg-transparent text-muted small text-end px-0">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSale.items.map((item, i) => (
                    <tr key={i}>
                      <td className="bg-transparent px-0 py-2">
                        <div className="fw-bold">{item.product_name}</div>
                        <div className="small text-muted">${parseFloat(item.price).toFixed(2)} / unit</div>
                      </td>
                      <td className="bg-transparent text-center px-0 py-2">{item.qty}</td>
                      <td className="bg-transparent text-end px-0 py-2 fw-bold">
                        ${parseFloat(item.line_total).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              <div className="border-top border-secondary pt-3">
                <div className="d-flex justify-content-between mb-1 small text-muted">
                  <span>Subtotal</span>
                  <span>${parseFloat(selectedSale.subtotal).toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between mb-1 small text-muted">
                  <span>Tax</span>
                  <span>${parseFloat(selectedSale.tax).toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between h4 fw-bold text-white mt-3">
                  <span>Grand Total</span>
                  <span>${parseFloat(selectedSale.total).toFixed(2)}</span>
                </div>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="border-top border-secondary">
          <Button variant="outline-secondary" onClick={() => setShowModal(false)} className="border-0">
            Close
          </Button>
          <Button className="btn-gradient border-0 px-4" onClick={() => window.print()}>
            Print Receipt
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}