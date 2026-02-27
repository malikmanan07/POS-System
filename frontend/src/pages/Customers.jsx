import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Modal, Button, Form, Table, Badge } from "react-bootstrap";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const { token, hasPermission, user } = useAuth();
  const API_PATH = "/api/customers";

  const isCashierLike =
    typeof hasPermission === "function"
      ? hasPermission("create_sale") && !hasPermission("view_reports")
      : user?.roles?.some(r => r.toLowerCase() === "cashier");

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

  const fetchHistory = async (customer) => {
    setSelectedCustomer(customer);
    setShowHistoryModal(true);
    setIsLoadingHistory(true);
    try {
      const res = await api.get(`${API_PATH}/${customer.id}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(res.data);
    } catch (err) {
      toast.error("Failed to load history");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handlePrintHistory = () => {
    const printWindow = window.open('', '_blank');
    const content = `
      <html>
        <head>
          <title>Purchase History - ${selectedCustomer?.name}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f8f9fa; }
            .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .sale-block { margin-bottom: 40px; page-break-inside: avoid; }
            .sale-header { background: #eee; padding: 10px; font-weight: bold; display: flex; justify-content: space-between; }
            .text-end { text-align: right; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>Purchase History: ${selectedCustomer?.name}</h2>
            <p>Phone: ${selectedCustomer?.phone || 'N/A'} | Email: ${selectedCustomer?.email || 'N/A'}</p>
          </div>
          ${history.map(sale => `
            <div class="sale-block">
              <div class="sale-header">
                <span>SALE #${sale.id}</span>
                <span>${new Date(sale.created_at).toLocaleString()}</span>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${sale.items.map(item => `
                    <tr>
                      <td>${item.name}</td>
                      <td>${item.qty}</td>
                      <td>$${parseFloat(item.price).toFixed(2)}</td>
                      <td>$${parseFloat(item.line_total).toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              <div class="text-end" style="margin-top: 10px;">
                <strong>Grand Total: $${parseFloat(sale.total).toFixed(2)}</strong><br>
                <small>Paid: $${parseFloat(sale.paid_amount).toFixed(2)} | Change: $${parseFloat(sale.change_amount).toFixed(2)}</small>
              </div>
            </div>
          `).join('')}
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `;
    printWindow.document.write(content);
    printWindow.document.close();
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
                        onClick={() => handleDelete(c.id)}
                        title="Delete Customer"
                      >
                        <i className="bi bi-trash text-danger"></i>
                      </button>
                    </>
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

      {/* History Modal */}
      <Modal show={showHistoryModal} onHide={() => setShowHistoryModal(false)} size="lg" centered contentClassName="glass border-0">
        <Modal.Header closeButton closeVariant="white" className="border-bottom border-secondary">
          <Modal.Title className="fw-bold">Purchase History - {selectedCustomer?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4 overflow-auto" style={{ maxHeight: '70vh' }}>
          {isLoadingHistory ? (
            <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
          ) : history.length > 0 ? (
            history.map((sale) => (
              <div key={sale.id} className="mb-4 bg-dark bg-opacity-25 p-3 rounded-4 border border-secondary border-opacity-25">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <Badge bg="primary" className="mb-1">SALE #{sale.id}</Badge>
                    <div className="small text-muted">{new Date(sale.created_at).toLocaleString()}</div>
                  </div>
                  <div className="text-end">
                    <div className="fw-bold text-white fs-5">${parseFloat(sale.total).toFixed(2)}</div>
                    <div className="small text-success">Paid: ${parseFloat(sale.paid_amount).toFixed(2)}</div>
                    {parseFloat(sale.change_amount) > 0 && (
                      <div className="small text-info">Change: ${parseFloat(sale.change_amount).toFixed(2)}</div>
                    )}
                  </div>
                </div>
                <div className="table-responsive">
                  <Table borderless size="sm" className="text-white mb-0 bg-transparent">
                    <thead>
                      <tr className="border-bottom border-secondary border-opacity-25" style={{ background: 'transparent' }}>
                        <th className="small text-muted py-2 bg-transparent text-uppercase ls-1" style={{ fontSize: '10px' }}>PRODUCT</th>
                        <th className="small text-muted py-2 text-center bg-transparent text-uppercase ls-1" style={{ fontSize: '10px' }}>QTY</th>
                        <th className="small text-muted py-2 text-end bg-transparent text-uppercase ls-1" style={{ fontSize: '10px' }}>PRICE</th>
                        <th className="small text-muted py-2 text-end bg-transparent text-uppercase ls-1" style={{ fontSize: '10px' }}>TOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sale.items.map((item, idx) => (
                        <tr key={idx} className="align-middle border-bottom border-white border-opacity-5">
                          <td className="py-2 bg-transparent text-white">
                            <div className="d-flex align-items-center gap-2">
                              {item.image ? (
                                <img src={`${api.defaults.baseURL}${item.image}`} alt="" className="rounded shadow-sm" style={{ width: '35px', height: '35px', objectFit: 'cover' }} />
                              ) : (
                                <div className="rounded bg-primary bg-opacity-20 text-primary d-flex align-items-center justify-content-center fw-bold" style={{ width: '35px', height: '35px', fontSize: '12px' }}>{item.name.charAt(0)}</div>
                              )}
                              <span className="small fw-semibold text-white">{item.name}</span>
                            </div>
                          </td>
                          <td className="py-2 text-center small bg-transparent text-white">{item.qty}</td>
                          <td className="py-2 text-end small bg-transparent text-white-50">${parseFloat(item.price).toFixed(2)}</td>
                          <td className="py-2 text-end small fw-bold bg-transparent text-primary">${parseFloat(item.line_total).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-5 text-muted">No purchase history found</div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-top border-secondary">
          <Button variant="outline-light" onClick={() => setShowHistoryModal(false)} className="border-0 btn-soft">
            Close
          </Button>
          <Button
            className="btn-gradient border-0 px-4 d-flex align-items-center gap-2"
            onClick={handlePrintHistory}
            disabled={history.length === 0}
          >
            <i className="bi bi-printer"></i> Print History
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Modal (Admin Only) */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        centered
        contentClassName="glass border-0"
      >
        <Modal.Header closeButton closeVariant="white" className="border-bottom border-secondary">
          <Modal.Title className="fw-bold">Edit Customer</Modal.Title>
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
              Save Changes
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
