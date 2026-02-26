import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Modal, Button, Form } from "react-bootstrap";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
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
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await api.get(API_PATH, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCustomers(res.data);
    } catch (err) {
      toast.error("Failed to load customers");
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
      fetchCustomers();
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
          <p className="text-white mb-0">{isCashierLike ? "Add & search customers" : "Maintain your customer database"}</p>
        </div>
        <button
          className="btn btn-gradient gap-2 d-flex align-items-center"
          onClick={handleOpenAdd}
        >
          <i className="bi bi-person-plus-fill"></i> Add Customer
        </button>
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
          </tbody>
        </table>
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