import { useState, useMemo } from "react";
import { toast } from "react-toastify";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { fetchProducts as getProducts, createProduct, updateProduct, deleteProduct, fetchCategoriesFlat, fetchSuppliersList } from "../api/productApi";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { useSettings } from "../context/SettingsContext";
import ProductFormModal from "../components/ProductFormModal";
import PaginationControl from "../components/PaginationControl";
import ConfirmDialog from "../components/ConfirmDialog";
import ProductTable from "../components/Products/ProductTable";
import ImportProductsModal from "../components/Products/ImportProductsModal";
import Skeleton from "../components/Skeleton";

export default function Products() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 12 });
  const [confirmDialog, setConfirmDialog] = useState({ show: false, id: null, name: "" });
  const [showImportModal, setShowImportModal] = useState(false);
  const { currencySymbol } = useSettings();
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
    supplier_id: "", // <-- Initialize supplier_id
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [removeImageFlag, setRemoveImageFlag] = useState(false);

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await getProducts(token);
      return res.data || [];
    },
    enabled: !!token,
    placeholderData: keepPreviousData
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories-flat"],
    queryFn: async () => {
      const res = await fetchCategoriesFlat(token);
      const data = res.data || [];

      const getLevel = (catId, cats) => {
        const cat = cats.find(c => c.id === catId);
        if (!cat || !cat.parentId) return 0;
        return 1 + getLevel(cat.parentId, cats);
      };

      const flattenTree = (parentId = null, cats) => {
        const levelItems = cats
          .filter(c => c.parentId === parentId)
          .sort((a, b) => a.name.localeCompare(b.name));

        let flat = [];
        levelItems.forEach(item => {
          const level = getLevel(item.id, cats);
          flat.push({ ...item, level });
          const children = flattenTree(item.id, cats);
          flat = [...flat, ...children];
        });
        return flat;
      };

      return flattenTree(null, data);
    },
    enabled: !!token
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers-list"],
    queryFn: async () => {
      const res = await fetchSuppliersList(token);
      return res.data || [];
    },
    enabled: !!token
  });

  const products = productsData || [];
  const loading = productsLoading;

  // Instant Search & Pagination logic
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    const s = searchTerm.toLowerCase();
    return products.filter(p =>
      p.name.toLowerCase().includes(s) ||
      (p.sku && p.sku.toLowerCase().includes(s))
    );
  }, [products, searchTerm]);

  const totalPages = Math.ceil(filteredProducts.length / pagination.limit);

  const paginatedProducts = useMemo(() => {
    const start = (pagination.page - 1) * pagination.limit;
    return filteredProducts.slice(start, start + pagination.limit);
  }, [filteredProducts, pagination.page]);




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
      supplier_id: "",
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
      supplier_id: p.supplierId || "",
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
      await deleteProduct(id, token);
      toast.success("Product deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products-pos"] });
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
      data.append("supplier_id", formData.supplier_id === "" ? "" : formData.supplier_id);

      if (formData.image) {
        data.append("image", formData.image);
      } else if (removeImageFlag) {
        data.append("remove_image", "true");
      }

      if (editMode) {
        await updateProduct(editId, data, token);
        toast.success("Product updated successfully");
      } else {
        await createProduct(data, token);
        toast.success("Product created successfully");
      }

      setShowModal(false);
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products-pos"] });
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      queryClient.invalidateQueries({ queryKey: ["lowStock"] });
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
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-primary gap-2 d-flex align-items-center rounded-pill px-4"
            onClick={() => setShowImportModal(true)}
          >
            <i className="bi bi-file-earmark-arrow-up"></i> Import CSV
          </button>
          <button
            className="btn btn-gradient gap-2 d-flex align-items-center"
            onClick={handleOpenAdd}
          >
            <i className="bi bi-plus-lg"></i> Add Product
          </button>
        </div>
      </div>

      <div className="glass p-3 mb-4 d-flex gap-3 align-items-center shadow-soft">
        <i className="bi bi-search text-primary h5 mb-0"></i>
        <input
          type="text"
          placeholder="Search items by name or SKU..."
          className="bg-transparent border-0 text-white shadow-none fs-5 w-100 outline-none"
          style={{ outline: 'none' }}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <ProductTable
        loading={loading}
        paginatedProducts={paginatedProducts}
        products={products}
        handleOpenEdit={handleOpenEdit}
        askDelete={askDelete}
        currencySymbol={currencySymbol}
        apiBaseURL={api.defaults.baseURL}
      />

      <PaginationControl
        pagination={{
          ...pagination,
          total: filteredProducts.length,
          pages: totalPages
        }}
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
        suppliers={suppliers} // <-- Pass suppliers
        currencySymbol={currencySymbol}
        imagePreview={imagePreview}
        handleImageChange={handleImageChange}
        setImagePreview={setImagePreview}
        setRemoveImageFlag={setRemoveImageFlag}
      />
      <ImportProductsModal
        show={showImportModal}
        onHide={() => setShowImportModal(false)}
        token={token}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["products"] });
          queryClient.invalidateQueries({ queryKey: ["products-pos"] });
          queryClient.invalidateQueries({ queryKey: ["stock"] });
          queryClient.invalidateQueries({ queryKey: ["lowStock"] });
        }}
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