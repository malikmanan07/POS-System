import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
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
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get(API_PATH, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(res.data);
    } catch (err) {
      toast.error("Failed to load products");
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get("/api/categories", {
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

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await api.delete(`${API_PATH}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Product deleted successfully");
      fetchProducts();
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
      fetchProducts();
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
                    onClick={() => handleDelete(p.id)}
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

      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        centered
        size="lg"
        contentClassName="glass border-0"
      >
        <Modal.Header closeButton closeVariant="white" className="border-bottom border-secondary">
          <Modal.Title className="fw-bold">{editMode ? "Edit Product" : "Create New Product"}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="p-4">
            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-muted small fw-bold">PRODUCT NAME</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter product name"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="bg-dark text-light border-secondary shadow-none"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-muted small fw-bold">SKU / BARCODE</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g., PROD-001"
                    value={formData.sku}
                    onChange={e => setFormData({ ...formData, sku: e.target.value })}
                    className="bg-dark text-light border-secondary shadow-none"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-muted small fw-bold">CATEGORY</Form.Label>
                  <Form.Select
                    value={formData.category_id}
                    onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                    className="bg-dark text-light border-secondary shadow-none"
                  >
                    <option value="">Uncategorized</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-muted small fw-bold">STATUS</Form.Label>
                  <div className="mt-2">
                    <Form.Check
                      type="switch"
                      id="product-active-switch"
                      label={formData.is_active ? "Product is Active" : "Product is Inactive"}
                      checked={formData.is_active}
                      onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                      className="text-light"
                    />
                  </div>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-muted small fw-bold">COST PRICE</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={formData.cost_price}
                    onChange={e => setFormData({ ...formData, cost_price: e.target.value })}
                    className="bg-dark text-light border-secondary shadow-none"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-muted small fw-bold">SELLING PRICE</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                    className="bg-dark text-light border-secondary shadow-none"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-muted small fw-bold">STOCK LEVEL</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.stock}
                    onChange={e => setFormData({ ...formData, stock: e.target.value })}
                    className="bg-dark text-light border-secondary shadow-none"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-muted small fw-bold">PRODUCT IMAGE</Form.Label>
                  <div className="d-flex gap-3 align-items-start">
                    <div
                      className="rounded-3 bg-dark border border-secondary d-flex align-items-center justify-content-center"
                      style={{ width: '100px', height: '100px', overflow: 'hidden', flexShrink: 0 }}
                    >
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Preview"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <i className="bi bi-image text-muted" style={{ fontSize: '2rem' }}></i>
                      )}
                    </div>
                    <div className="flex-grow-1">
                      <Form.Control
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="bg-dark text-light border-secondary shadow-none mb-2"
                      />
                      <Form.Text className="text-muted small d-block">
                        Supported forms: JPG, PNG, WEBP. Max size: 5MB.
                      </Form.Text>
                      {imagePreview && (
                        <Button
                          variant="link"
                          className="text-danger p-0 mt-1 small text-decoration-none"
                          onClick={() => {
                            setImagePreview(null);
                            setFormData({ ...formData, image: null });
                            setRemoveImageFlag(true);
                          }}
                        >
                          Remove image
                        </Button>
                      )}
                    </div>
                  </div>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-muted small fw-bold text-warning">ALERT QUANTITY</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.alert_quantity}
                    onChange={e => setFormData({ ...formData, alert_quantity: e.target.value })}
                    className="bg-dark text-warning border-warning shadow-none"
                    placeholder="Alert at e.g., 5"
                  />
                  <Form.Text className="text-muted small">Show alert when stock hits this level.</Form.Text>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer className="border-top border-secondary">
            <Button variant="outline-secondary" onClick={() => setShowModal(false)} className="border-0">
              Cancel
            </Button>
            <Button type="submit" className="btn-gradient border-0 px-4">
              {editMode ? "Save Changes" : "Add Product"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}