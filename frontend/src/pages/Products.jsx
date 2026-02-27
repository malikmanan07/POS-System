import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
// No react-bootstrap imports needed here

import ProductFormModal from "../components/ProductFormModal";
import PaginationControl from "../components/PaginationControl";
import ConfirmDialog from "../components/ConfirmDialog";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [confirmDialog, setConfirmDialog] = useState({ show: false, id: null, name: "" });
  const { token } = useAuth();
  const API_PATH = "/api/products";

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category_id: "",
    cost_price: 0,
    price: 0,
    stock: 0,
    is_active: true,
    alert_quantity: 5,
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [removeImageFlag, setRemoveImageFlag] = useState(false);

  useEffect(() => {
    fetchProducts(pagination.page);
    fetchCategories();
  }, [pagination.page]);

  const fetchProducts = async (page = 1) => {
    try {
      const res = await api.get(`${API_PATH}?page=${page}&limit=${pagination.limit}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(res.data.data);
      setPagination(prev => ({ ...prev, ...res.data.pagination, pages: res.data.pagination.totalPages || res.data.pagination.pages || 1 }));
    } catch (err) {
      toast.error("Failed to load products");
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get("/api/categories?limit=all", {
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
    setFormData({
      name: "",
      sku: "",
      category_id: "",
      cost_price: 0,
      price: 0,
      stock: 0,
      is_active: true,
      alert_quantity: 5,
      image: null
    });
    setImagePreview(null);
    setRemoveImageFlag(false);
    setShowModal(true);
  };

  const handleOpenEdit = (p) => {
    setEditMode(true);
    setEditId(p.id);
    setFormData({
      name: p.name,
      sku: p.sku || "",
      category_id: p.category_id || "",
      cost_price: p.cost_price,
      price: p.price,
      stock: p.stock,
      is_active: p.is_active,
      alert_quantity: p.alert_quantity || 5,
      image: null
    });
    setImagePreview(p.image ? `${api.defaults.baseURL}${p.image}` : null);
    setRemoveImageFlag(false);
    setShowModal(true);
  };

  const askDelete = (p) => {
    setConfirmDialog({ show: true, id: p.id, name: p.name });
  };

  const handleDeleteConfirmed = async () => {
    const id = confirmDialog.id;
    setConfirmDialog({ show: false, id: null, name: "" });
    try {
      await api.delete(`${API_PATH}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Product deleted successfully");
      fetchProducts(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.error || "Error deleting product");
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error("Product name is required");

    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("sku", formData.sku);
      data.append("category_id", formData.category_id === "" ? "" : formData.category_id);
      data.append("cost_price", formData.cost_price);
      data.append("price", formData.price);
      data.append("stock", formData.stock);
      data.append("is_active", formData.is_active);
      data.append("alert_quantity", formData.alert_quantity);

      if (formData.image) {
        data.append("image", formData.image);
      } else if (removeImageFlag) {
        data.append("remove_image", "true");
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      };

      if (editMode) {
        await api.put(`${API_PATH}/${editId}`, data, config);
        toast.success("Product updated successfully");
      } else {
        await api.post(API_PATH, data, config);
        toast.success("Product created successfully");
      }

      setShowModal(false);
      fetchProducts(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.error || "Error saving product");
    }
  };

  return (
    <div className="p-4 h-100">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="page-title mb-1">Manage Products</h2>
          <p className="text-white mb-0">List and manage your inventory products</p>
        </div>
        <button
          className="btn btn-gradient gap-2 d-flex align-items-center"
          onClick={handleOpenAdd}
        >
          <i className="bi bi-plus-lg"></i> Add Product
        </button>
      </div>

      <div className="table-darkx">
        <table className="table table-borderless table-hover mb-0">
          <thead>
            <tr>
              <th className="px-4 py-3">PRODUCT</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">CATEGORY</th>
              <th className="px-4 py-3">PRICE</th>
              <th className="px-4 py-3">STOCK</th>
              <th className="px-4 py-3">STATUS</th>
              <th className="px-4 py-3 text-end">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id}>
                <td className="px-4 py-3 align-middle">
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="rounded-3 bg-dark border border-secondary"
                      style={{ width: '45px', height: '45px', overflow: 'hidden', flexShrink: 0 }}
                    >
                      {p.image ? (
                        <img
                          src={`${api.defaults.baseURL}${p.image}`}
                          alt={p.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div className="w-100 h-100 d-flex align-items-center justify-content-center text-muted">
                          <i className="bi bi-image" style={{ fontSize: '1.2rem' }}></i>
                        </div>
                      )}
                    </div>
                    <div className="fw-bold">{p.name}</div>
                  </div>
                </td>
                <td className="px-4 py-3 align-middle text-muted">{p.sku || "N/A"}</td>
                <td className="px-4 py-3 align-middle">
                  <span className="badge-soft">{p.category_name || "Uncategorized"}</span>
                </td>
                <td className="px-4 py-3 align-middle">${parseFloat(p.price).toFixed(2)}</td>
                <td className="px-4 py-3 align-middle">
                  <span className={`fw-bold ${p.stock <= (p.alert_quantity || 5) ? 'text-danger' : ''}`}>
                    {p.stock}
                  </span>
                </td>
                <td className="px-4 py-3 align-middle">
                  {p.is_active ? (
                    <span className="text-success small"><i className="bi bi-circle-fill me-1" style={{ fontSize: '8px' }}></i> Active</span>
                  ) : (
                    <span className="text-muted small"><i className="bi bi-circle-fill me-1" style={{ fontSize: '8px' }}></i> Inactive</span>
                  )}
                </td>
                <td className="px-4 py-3 text-end align-middle">
                  <button
                    className="btn btn-sm btn-outline-light me-2 rounded-3 border-0"
                    onClick={() => handleOpenEdit(p)}
                  >
                    <i className="bi bi-pencil-square text-primary"></i>
                  </button>
                  <button
                    className="btn btn-sm btn-outline-light rounded-3 border-0"
                    onClick={() => askDelete(p)}
                  >
                    <i className="bi bi-trash text-danger"></i>
                  </button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center py-4 text-muted">No products found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <PaginationControl
        pagination={pagination}
        setPage={(page) => setPagination(prev => ({ ...prev, page }))}
      />

      <ProductFormModal
        show={showModal}
        onHide={() => setShowModal(false)}
        handleSubmit={handleSubmit}
        formData={formData}
        setFormData={setFormData}
        editMode={editMode}
        categories={categories}
        imagePreview={imagePreview}
        handleImageChange={handleImageChange}
        setImagePreview={setImagePreview}
        setRemoveImageFlag={setRemoveImageFlag}
      />
      <ConfirmDialog
        show={confirmDialog.show}
        title="Delete Product"
        message={`Are you sure you want to delete "${confirmDialog.name}"? This cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setConfirmDialog({ show: false, id: null, name: "" })}
      />
    </div>
  );
}