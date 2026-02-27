import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Modal, Button, Form, Pagination } from "react-bootstrap";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const { token, hasPermission, user } = useAuth();
  const API_PATH = "/api/customers";
  const isCashierLike =
    typeof hasPermission === "function"
      ? hasPermission("create_sale") && !hasPermission("view_reports")
      : user?.roles?.includes("cashier");

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: ""
  });

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCustomers(pagination.page, searchTerm);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [pagination.page, searchTerm]);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [searchTerm]);

  const fetchCustomers = async (page = 1, search = "") => {
    setLoading(true);
    try {
      const res = await api.get(`${API_PATH}?page=${page}&limit=${pagination.limit}&search=${search}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCustomers(res.data.data);
      setPagination(prev => ({ ...prev, ...res.data.pagination, pages: res.data.pagination.totalPages }));
    } catch (err) {
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
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
    setFormData({
      name: c.name,
      phone: c.phone || "",
      email: c.email || "",
      address: c.address || ""
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this customer?")) return;
    try {
      await api.delete(`${API_PATH}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Customer deleted successfully");
      fetchCustomers(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.error || "Error deleting customer");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error("Customer name is required");

    try {
      if (editMode) {
        await api.put(`${API_PATH}/${editId}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Customer updated successfully");
      } else {
        await api.post(API_PATH, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Customer created successfully");
      }

      setShowModal(false);
      fetchCustomers(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.error || "Error saving customer");
    }
  };

  return (
    <div className="p-4 h-100">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="page-title mb-1">{isCashierLike ? "Customers" : "Manage Customers"}</h2>
          <p className="text-white mb-0">{isCashierLike ? "Add & search customers" : "Maintain your customer database"}</p>
        </div>
        <button
          className="btn btn-gradient gap-2 d-flex align-items-center"
          onClick={handleOpenAdd}
        >
          <i className="bi bi-person-plus-fill"></i> Add Customer
        </button>
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
            ) : (
              <>
                {customers.map(c => (
                  <tr key={c.id}>
                    <td className="px-4 py-3 align-middle fw-bold">{c.name}</td>
                    <td className="px-4 py-3 align-middle">{c.phone || "N/A"}</td>
                    <td className="px-4 py-3 align-middle">{c.email || "N/A"}</td>
                    <td className="px-4 py-3 align-middle text-muted small">{c.address || "N/A"}</td>
                    <td className="px-4 py-3 text-end align-middle">
                      <button
                        className="btn btn-sm btn-outline-light me-2 rounded-3 border-0"
                        onClick={() => handleOpenEdit(c)}
                      >
                        <i className="bi bi-pencil-square text-primary"></i>
                      </button>
                      {!isCashierLike && (
                        <button
                          className="btn btn-sm btn-outline-light rounded-3 border-0"
                          onClick={() => handleDelete(c.id)}
                        >
                          <i className="bi bi-trash text-danger"></i>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {customers.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-4 text-muted">No customers found</td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

      <div className="d-flex justify-content-between align-items-center mt-4">
        <div className="text-muted small">
          Showing {customers.length} of {pagination.total} customers
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
        contentClassName="glass border-0"
      >
        <Modal.Header closeButton closeVariant="white" className="border-bottom border-secondary">
          <Modal.Title className="fw-bold">{editMode ? "Edit Customer" : "Add New Customer"}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="p-4">
            <Form.Group className="mb-3">
              <Form.Label className="text-muted small fw-bold">FULL NAME</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter customer name"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="bg-dark text-light border-secondary shadow-none"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="text-muted small fw-bold">PHONE NUMBER</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g., +123456789"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="bg-dark text-light border-secondary shadow-none"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="text-muted small fw-bold">EMAIL ADDRESS</Form.Label>
              <Form.Control
                type="email"
                placeholder="customer@example.com"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="bg-dark text-light border-secondary shadow-none"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="text-muted small fw-bold">ADDRESS</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Full address"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="bg-dark text-light border-secondary shadow-none"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-top border-secondary">
            <Button variant="outline-secondary" onClick={() => setShowModal(false)} className="border-0">
              Cancel
            </Button>
            <Button type="submit" className="btn-gradient border-0 px-4">
              {editMode ? "Save Changes" : "Add Customer"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}