import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { Form } from "react-bootstrap";

import SaleDetailsModal from "../components/SaleDetailsModal";
import PaginationControl from "../components/PaginationControl";

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    startDate: "",
    endDate: ""
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [showModal, setShowModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const { token, hasPermission } = useAuth();
  const { currencySymbol, settings } = useSettings();
  const isCashierLike = hasPermission("create_sale") && !hasPermission("view_reports");
  const API_PATH = "/api/sales";

  useEffect(() => {
    fetchSales(pagination.page);
  }, [pagination.page]);

  const fetchSales = async (page = 1) => {
    setLoading(true);
    try {
      const { search, startDate, endDate } = filters;
      const res = await api.get(`${API_PATH}?page=${page}&limit=${pagination.limit}&search=${search}&startDate=${startDate}&endDate=${endDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSales(res.data.data);
      setPagination(prev => ({
        ...prev,
        ...res.data.pagination,
        pages: res.data.pagination.pages || res.data.pagination.totalPages || 1
      }));
    } catch (err) {
      toast.error("Failed to load sales history");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    // If we're already on page 1, manually call fetchSales
    if (pagination.page === 1) {
      fetchSales(1);
    }
  };

  const clearFilters = () => {
    setFilters({ search: "", startDate: "", endDate: "" });
    setPagination(prev => ({ ...prev, page: 1 }));
    // Small timeout to allow state update if already on page 1
    setTimeout(() => fetchSales(1), 0);
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
      <div className="d-flex flex-column flex-xl-row justify-content-between align-items-xl-center mb-4 gap-3">
        <div>
          <h2 className="page-title mb-1">Sales History</h2>
          <p className="text-white mb-0">Review all completed transactions</p>
        </div>

        <Form onSubmit={handleSearch} className="d-flex flex-wrap gap-2 align-items-end">
          {/* Date Filters */}
          <div className="d-flex flex-column">
            <span className="tiny text-muted fw-bold mb-1 ms-1">FROM</span>
            <div className="glass p-2 px-3 d-flex gap-2 align-items-center">
              <Form.Control
                type="date"
                name="startDate"
                className="bg-transparent border-0 text-white shadow-none small p-0"
                style={{ width: '130px', fontSize: '0.85rem' }}
                value={filters.startDate}
                onChange={handleFilterChange}
              />
            </div>
          </div>

          <div className="d-flex flex-column">
            <span className="tiny text-muted fw-bold mb-1 ms-1">TO</span>
            <div className="glass p-2 px-3 d-flex gap-2 align-items-center">
              <Form.Control
                type="date"
                name="endDate"
                className="bg-transparent border-0 text-white shadow-none small p-0"
                style={{ width: '130px', fontSize: '0.85rem' }}
                value={filters.endDate}
                onChange={handleFilterChange}
              />
            </div>
          </div>

          {/* Search Bar */}
          <div className="d-flex flex-column">
            <span className="tiny text-muted fw-bold mb-1 ms-1">SEARCH</span>
            <div className="glass p-2 px-3 d-flex gap-2 align-items-center" style={{ minWidth: '250px' }}>
              <i className="bi bi-search text-muted"></i>
              <Form.Control
                type="text"
                name="search"
                placeholder="Customer name, ID..."
                className="bg-transparent border-0 text-white shadow-none"
                value={filters.search}
                onChange={handleFilterChange}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="d-flex gap-2">
            <button type="submit" className="btn btn-gradient px-4 py-2" style={{ borderRadius: '12px', height: '42px' }}>
              Search
            </button>
            {(filters.search || filters.startDate || filters.endDate) && (
              <button
                type="button"
                className="btn btn-soft p-2 px-3"
                onClick={clearFilters}
                style={{ height: '42px' }}
                title="Clear Filters"
              >
                <i className="bi bi-arrow-clockwise"></i>
              </button>
            )}
          </div>
        </Form>
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
                    {currencySymbol}{parseFloat(s.total).toFixed(2)}
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
        currencySymbol={currencySymbol}
        settings={settings}
      />
    </div>
  );
}