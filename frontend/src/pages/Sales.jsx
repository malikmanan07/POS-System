import { useState, useMemo } from "react";
import { toast } from "react-toastify";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { fetchSalesList, fetchSaleDetails } from "../api/saleApi";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { Form } from "react-bootstrap";

import SaleDetailsModal from "../components/SaleDetailsModal";
import PaginationControl from "../components/PaginationControl";
import SaleTable from "../components/Sales/SaleTable";
import ReturnSaleModal from "../components/Sales/ReturnSaleModal";
import Skeleton from "../components/Skeleton";

export default function Sales() {
  const { token, hasPermission } = useAuth();
  const { currencySymbol, settings } = useSettings();
  const queryClient = useQueryClient();
  const isCashierLike = hasPermission("create_sale") && !hasPermission("view_reports");

  const [filters, setFilters] = useState({
    search: "",
    startDate: "",
    endDate: ""
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [showModal, setShowModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedReturnId, setSelectedReturnId] = useState(null);

  const { data: salesData, isLoading: loading } = useQuery({
    queryKey: ["sales", pagination.page, filters],
    queryFn: async () => {
      const { search, startDate, endDate } = filters;
      const res = await fetchSalesList({
        page: pagination.page,
        limit: pagination.limit,
        search,
        startDate,
        endDate
      }, token);
      return res.data;
    },
    enabled: !!token,
    placeholderData: keepPreviousData
  });

  const sales = salesData?.data || [];
  const serverPagination = salesData?.pagination || { total: 0, pages: 1, page: 1, limit: 10 };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    queryClient.invalidateQueries({ queryKey: ["sales"] });
  };

  const clearFilters = () => {
    setFilters({ search: "", startDate: "", endDate: "" });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleViewDetail = async (id) => {
    try {
      const res = await fetchSaleDetails(id, token);
      setSelectedSale(res.data);
      setShowModal(true);
    } catch (err) {
      toast.error("Failed to load sale details");
    }
  };

  const handleReturn = (id) => {
    setSelectedReturnId(id);
    setShowReturnModal(true);
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
        pagination={{ ...pagination, total: serverPagination.total }}
        currencySymbol={currencySymbol}
        isCashierLike={isCashierLike}
        handleViewDetail={handleViewDetail}
        handleReturn={handleReturn}
      />

      <div className="mt-4">
        <PaginationControl
          pagination={{
            ...pagination,
            total: serverPagination.total,
            pages: serverPagination.pages || serverPagination.totalPages || 1
          }}
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

      <ReturnSaleModal
        show={showReturnModal}
        onHide={() => setShowReturnModal(false)}
        saleId={selectedReturnId}
        token={token}
        currencySymbol={currencySymbol}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["sales"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
          queryClient.invalidateQueries({ queryKey: ["products-pos"] });
        }}
      />
    </div>
  );
}