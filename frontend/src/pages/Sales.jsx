import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { Form } from "react-bootstrap";

import SaleDetailsModal from "../components/SaleDetailsModal";
import PaginationControl from "../components/PaginationControl";
import SaleTable from "../components/Sales/SaleTable";

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
      <div className="d-flex flex-column flex-xl-row justify-content-between align-items-xl-center mb-4 gap-4">
        <div>
          <h2 className="page-title mb-1">Sales History</h2>
          <p className="text-white opacity-75 mb-0">Review all completed transactions</p>
        </div>

        <Form onSubmit={handleSearch} className="d-flex flex-wrap gap-3 align-items-center">
          <div className="glass-bar d-flex flex-wrap align-items-center p-1 rounded-pill shadow-soft border border-white-10">
            {/* Start Date */}
            <div className="d-flex align-items-center px-3 border-end border-white-10 py-1">
              <i className="bi bi-calendar-event text-primary me-2"></i>
              <div className="d-flex flex-column">
                <span className="x-small text-muted fw-bold">FROM</span>
                <Form.Control
                  type="date"
                  name="startDate"
                  className="bg-transparent border-0 text-white shadow-none p-0 x-small fw-bold"
                  style={{ width: '110px' }}
                  value={filters.startDate}
                  onChange={handleFilterChange}
                />
              </div>
            </div>

            {/* End Date */}
            <div className="d-flex align-items-center px-3 border-end border-white-10 py-1">
              <i className="bi bi-calendar-check text-success me-2"></i>
              <div className="d-flex flex-column">
                <span className="x-small text-muted fw-bold">TO</span>
                <Form.Control
                  type="date"
                  name="endDate"
                  className="bg-transparent border-0 text-white shadow-none p-0 x-small fw-bold"
                  style={{ width: '110px' }}
                  value={filters.endDate}
                  onChange={handleFilterChange}
                />
              </div>
            </div>

            {/* Search Input */}
            <div className="d-flex align-items-center px-3 flex-grow-1" style={{ minWidth: '220px' }}>
              <i className="bi bi-search text-muted me-2"></i>
              <Form.Control
                type="text"
                name="search"
                placeholder="Customer or Sale ID..."
                className="bg-transparent border-0 text-white shadow-none x-small"
                value={filters.search}
                onChange={handleFilterChange}
              />
            </div>

            {/* Submit Button inside the pill */}
            <button type="submit" className="btn-gradient rounded-pill px-4 py-2 me-1 border-0 d-flex align-items-center gap-2 shadow-sm">
              <i className="bi bi-funnel-fill small"></i>
              <span className="small fw-bold">Filter</span>
            </button>
          </div>

          {/* Clear Button outside */}
          {(filters.search || filters.startDate || filters.endDate) && (
            <button
              type="button"
              className="btn btn-link text-muted text-decoration-none x-small fw-bold hover-white"
              onClick={clearFilters}
            >
              <i className="bi bi-x-lg me-1"></i> Clear filters
            </button>
          )}
        </Form>
      </div>

      <SaleTable
        loading={loading}
        sales={sales}
        pagination={pagination}
        currencySymbol={currencySymbol}
        isCashierLike={isCashierLike}
        handleViewDetail={handleViewDetail}
      />

      <div className="mt-4">
        <PaginationControl
          pagination={pagination}
          setPage={(page) => setPagination(prev => ({ ...prev, page }))}
        />
      </div>

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