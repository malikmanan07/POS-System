import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Modal, Button, Form } from "react-bootstrap";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const { token } = useAuth();
  const API_PATH = "/api/categories";

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get(API_PATH, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(res.data);
    } catch (err) {
      toast.error("Failed to load categories");
    }
  };

  const handleOpenAdd = () => {
    setEditMode(false);
    setEditId(null);
    setName("");
    setShowModal(true);
  };

  const handleOpenEdit = (category) => {
    setEditMode(true);
    setEditId(category.id);
    setName(category.name);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      await api.delete(`${API_PATH}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Category deleted successfully");
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.error || "Error deleting category");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Category name is required");

    try {
      if (editMode) {
        await api.put(`${API_PATH}/${editId}`, { name }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Category updated successfully");
      } else {
        await api.post(API_PATH, { name }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Category created successfully");
      }

      setName("");
      setShowModal(false);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.error || "Error saving category");
    }
  };

  return (
    <div className="p-4 h-100">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="page-title mb-1">Manage Categories</h2>
          <p className="text-white mb-0">Group your products by category</p>
        </div>
        <button
          className="btn btn-gradient gap-2 d-flex align-items-center"
          onClick={handleOpenAdd}
        >
          <i className="bi bi-plus-lg"></i> Add Category
        </button>
      </div>

      <div className="table-darkx">
        <table className="table table-borderless table-hover mb-0">
          <thead>
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">NAME</th>
              <th className="px-4 py-3 text-end">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(c => (
              <tr key={c.id}>
                <td className="px-4 py-3 align-middle">#{c.id}</td>
                <td className="px-4 py-3 align-middle">
                  <span className="badge-soft">
                    {c.name}
                  </span>
                </td>
                <td className="px-4 py-3 text-end align-middle">
                  <button
                    className="btn btn-sm btn-outline-light me-2 rounded-3 border-0"
                    onClick={() => handleOpenEdit(c)}
                  >
                    <i className="bi bi-pencil-square text-primary"></i>
                  </button>
                  <button
                    className="btn btn-sm btn-outline-light rounded-3 border-0"
                    onClick={() => handleDelete(c.id)}
                  >
                    <i className="bi bi-trash text-danger"></i>
                  </button>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan="3" className="text-center py-4 text-muted">No categories found</td>
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
          <Modal.Title className="fw-bold">{editMode ? "Edit Category" : "Create New Category"}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="text-muted small fw-bold">CATEGORY NAME</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g., Electronics, Food, Drinks"
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
                className="bg-dark text-light border-secondary shadow-none"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-top border-secondary">
            <Button variant="outline-secondary" onClick={() => setShowModal(false)} className="border-0">
              Cancel
            </Button>
            <Button type="submit" className="btn-gradient border-0 px-4">
              {editMode ? "Save Changes" : "Add Category"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}