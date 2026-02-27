import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
// No react-bootstrap imports needed here

import CategoryFormModal from "../components/CategoryFormModal";
import PaginationControl from "../components/PaginationControl";
import ConfirmDialog from "../components/ConfirmDialog";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [confirmDialog, setConfirmDialog] = useState({ show: false, id: null, name: "" });
  const { token } = useAuth();
  const API_PATH = "/api/categories";

  useEffect(() => {
    fetchCategories(pagination.page);
  }, [pagination.page]);

  const fetchCategories = async (page = 1) => {
    try {
      const res = await api.get(`${API_PATH}?page=${page}&limit=${pagination.limit}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(res.data.data);
      setPagination(prev => ({ ...prev, ...res.data.pagination, pages: res.data.pagination.totalPages || res.data.pagination.pages || 1 }));
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

  const askDelete = (c) => {
    setConfirmDialog({ show: true, id: c.id, name: c.name });
  };

  const handleDeleteConfirmed = async () => {
    const id = confirmDialog.id;
    setConfirmDialog({ show: false, id: null, name: "" });
    try {
      await api.delete(`${API_PATH}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Category deleted successfully");
      fetchCategories(pagination.page);
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
      fetchCategories(pagination.page);
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
                    onClick={() => askDelete(c)}
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

      <PaginationControl
        pagination={pagination}
        setPage={(page) => setPagination(prev => ({ ...prev, page }))}
      />

      <CategoryFormModal
        show={showModal}
        onHide={() => setShowModal(false)}
        handleSubmit={handleSubmit}
        name={name}
        setName={setName}
        editMode={editMode}
      />
      <ConfirmDialog
        show={confirmDialog.show}
        title="Delete Category"
        message={`Are you sure you want to delete "${confirmDialog.name}"? This cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setConfirmDialog({ show: false, id: null, name: "" })}
      />
    </div>
  );
}