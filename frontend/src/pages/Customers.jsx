import { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Form } from "react-bootstrap";
import { useSettings } from "../context/SettingsContext";

import CustomerHistoryModal from "../components/CustomerHistoryModal";
import CustomerFormModal from "../components/CustomerFormModal";
import PaginationControl from "../components/PaginationControl";
import ConfirmDialog from "../components/ConfirmDialog";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "", email: "", address: "" });
  const [editId, setEditId] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 12 });
  const { token, hasPermission } = useAuth();
  const { currencySymbol, settings } = useSettings();
  const isCashierLike = hasPermission("create_sale") && !hasPermission("view_reports");

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [history, setHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState({ show: false, id: null, name: "" });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/customers?limit=all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCustomers(res.data || []);
    } catch (err) {
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  // Instant Search & Pagination logic
  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers;
    const s = searchTerm.toLowerCase();
    return customers.filter(c =>
      c.name.toLowerCase().includes(s) ||
      (c.phone && c.phone.toLowerCase().includes(s)) ||
      (c.email && c.email.toLowerCase().includes(s))
    );
  }, [customers, searchTerm]);

  const totalPages = Math.ceil(filteredCustomers.length / pagination.limit);

  const paginatedCustomers = useMemo(() => {
    const start = (pagination.page - 1) * pagination.limit;
    return filteredCustomers.slice(start, start + pagination.limit);
  }, [filteredCustomers, pagination.page]);

  // Reset page when search term changes
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [searchTerm]);

  const fetchHistory = async (customer) => {
    setSelectedCustomer(customer);
    setShowHistoryModal(true);
    setIsLoadingHistory(true);
    setHistory([]);
    try {
      // Correct endpoint: /api/customers/:id/history
      const res = await api.get(`/api/customers/${customer.id}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(res.data);
    } catch (err) {
      toast.error("Failed to load purchase history");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleOpenAdd = () => {
    setEditMode(false);
    setEditId(null);
    setFormData({ name: "", phone: "", email: "", address: "" });
    setShowModal(true);
  };

  const handleOpenEdit = (c) => {
    setEditMode(true);
    setEditId(c.id);
    setFormData({ name: c.name, phone: c.phone || "", email: c.email || "", address: c.address || "" });
    setShowModal(true);
  };

  const askDelete = (c) => {
    setConfirmDialog({ show: true, id: c.id, name: c.name });
  };

  const handleDeleteConfirmed = async () => {
    const id = confirmDialog.id;
    setConfirmDialog({ show: false, id: null, name: "" });
    try {
      await api.delete(`/api/customers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Customer deleted successfully");
      fetchCustomers();
    } catch (err) {
      toast.error(err.response?.data?.error || "Error deleting customer");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await api.put(`/api/customers/${editId}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Customer updated successfully");
      } else {
        await api.post("/api/customers", formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Customer added successfully");
      }
      setShowModal(false);
      fetchCustomers();
    } catch (err) {
      toast.error(err.response?.data?.error || "Error saving customer");
    }
  };

  return (
    <div className="p-4 h-100">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="page-title mb-1">{isCashierLike ? "Customers" : "Manage Customers"}</h2>
          <p className="text-white mb-0">{isCashierLike ? "View customer purchase history" : "Maintain your customer database and view history"}</p>
        </div>
        {!isCashierLike && (
          <button className="btn btn-gradient gap-2 d-flex align-items-center" onClick={handleOpenAdd}>
            <i className="bi bi-person-plus"></i> Add Customer
          </button>
        )}
      </div>

      <div className="glass p-3 mb-4 d-flex gap-3 align-items-center">
        <i className="bi bi-search text-muted h5 mb-0"></i>
        <Form.Control
          type="text"
          placeholder="Search by name or phone number..."
          className="bg-transparent border-0 text-white shadow-none fs-5"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="table-darkx">
        <table className="table table-borderless table-hover mb-0">
          <thead>
            <tr>
              <th className="px-4 py-3">NAME</th>
              <th className="px-4 py-3">PHONE</th>
              <th className="px-4 py-3">EMAIL</th>
              <th className="px-4 py-3">ADDRESS</th>
              <th className="px-4 py-3 text-end">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedCustomers.length > 0 ? (
              paginatedCustomers.map(c => (
                <tr key={c.id}>
                  <td className="px-4 py-3 align-middle fw-bold text-white">{c.name}</td>
                  <td className="px-4 py-3 align-middle text-white">{c.phone || "N/A"}</td>
                  <td className="px-4 py-3 align-middle text-white">{c.email || "N/A"}</td>
                  <td className="px-4 py-3 align-middle text-muted small">{c.address || "N/A"}</td>
                  <td className="px-4 py-3 text-end align-middle">
                    <button
                      className="btn btn-sm btn-outline-light me-2 rounded-3 border-0"
                      onClick={() => fetchHistory(c)}
                      title="View History"
                    >
                      <i className="bi bi-eye text-info"></i>
                    </button>
                    {!isCashierLike && (
                      <>
                        <button
                          className="btn btn-sm btn-outline-light me-2 rounded-3 border-0"
                          onClick={() => handleOpenEdit(c)}
                          title="Edit Customer"
                        >
                          <i className="bi bi-pencil-square text-primary"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-light rounded-3 border-0"
                          onClick={() => askDelete(c)}
                          title="Delete Customer"
                        >
                          <i className="bi bi-trash text-danger"></i>
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center py-4 text-muted">No customers found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <PaginationControl
        pagination={{
          ...pagination,
          total: filteredCustomers.length,
          pages: totalPages
        }}
        setPage={(page) => setPagination(prev => ({ ...prev, page }))}
      />

      <CustomerHistoryModal
        show={showHistoryModal}
        onHide={() => setShowHistoryModal(false)}
        selectedCustomer={selectedCustomer}
        isLoadingHistory={isLoadingHistory}
        history={history}
        apiBaseUrl={api.defaults.baseURL}
        currency={currencySymbol}
        settings={settings}
      />

      <CustomerFormModal
        show={showModal}
        onHide={() => setShowModal(false)}
        handleSubmit={handleSubmit}
        formData={formData}
        setFormData={setFormData}
        editMode={editMode}
      />

      <ConfirmDialog
        show={confirmDialog.show}
        title="Delete Customer"
        message={`Are you sure you want to delete "${confirmDialog.name}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setConfirmDialog({ show: false, id: null, name: "" })}
      />
    </div>
  );
}
