import { useState, useEffect, useMemo } from "react";
import { Button } from "react-bootstrap";
import { toast } from "react-toastify";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import PaginationControl from "../components/PaginationControl";
import ConfirmDialog from "../components/ConfirmDialog";

// Components
import SupplierFormModal from "../components/Suppliers/SupplierFormModal";
import SupplierProductsModal from "../components/Suppliers/SupplierProductsModal";
import SupplierTable from "../components/Suppliers/SupplierTable";

export default function Suppliers() {
    const { token, hasPermission } = useAuth();
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [pagination, setPagination] = useState({ page: 1, limit: 10 });

    const [formData, setFormData] = useState({ name: "", phone: "", email: "", address: "" });
    const [isSaving, setIsSaving] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({ show: false, id: null, name: "" });

    // View Products Logic
    const [showProductsModal, setShowProductsModal] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [productsList, setProductsList] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [productSearchTerm, setProductSearchTerm] = useState("");
    const [productPagination, setProductPagination] = useState({ page: 1, limit: 5 });

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        setLoading(true);
        try {
            const res = await api.get("/api/suppliers", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuppliers(res.data || []);
        } catch (err) {
            toast.error("Error loading suppliers");
        } finally {
            setLoading(false);
        }
    };

    // Instant High-speed Search
    const filteredSuppliers = useMemo(() => {
        if (!searchTerm) return suppliers;
        const s = searchTerm.toLowerCase();
        return suppliers.filter(sup =>
            sup.name.toLowerCase().includes(s) ||
            (sup.phone && sup.phone.includes(s)) ||
            (sup.email && sup.email.toLowerCase().includes(s))
        );
    }, [suppliers, searchTerm]);

    const totalPages = Math.ceil(filteredSuppliers.length / pagination.limit);
    const paginatedSuppliers = useMemo(() => {
        const start = (pagination.page - 1) * pagination.limit;
        return filteredSuppliers.slice(start, start + pagination.limit);
    }, [filteredSuppliers, pagination.page, pagination.limit]);

    useEffect(() => {
        setPagination(prev => ({ ...prev, page: 1 }));
    }, [searchTerm]);

    // Modal Products Search & Pagination
    const filteredModalProducts = useMemo(() => {
        if (!productSearchTerm) return productsList;
        const s = productSearchTerm.toLowerCase();
        return productsList.filter(p =>
            p.name.toLowerCase().includes(s) ||
            (p.sku && p.sku.toLowerCase().includes(s))
        );
    }, [productsList, productSearchTerm]);

    const modalTotalPages = Math.ceil(filteredModalProducts.length / productPagination.limit);
    const paginatedModalProducts = useMemo(() => {
        const start = (productPagination.page - 1) * productPagination.limit;
        return filteredModalProducts.slice(start, start + productPagination.limit);
    }, [filteredModalProducts, productPagination.page, productPagination.limit]);

    useEffect(() => {
        setProductPagination(prev => ({ ...prev, page: 1 }));
    }, [productSearchTerm]);

    const handleOpenModal = (supplier = null) => {
        if (supplier) {
            setEditingSupplier(supplier);
            setFormData({
                name: supplier.name,
                phone: supplier.phone || "",
                email: supplier.email || "",
                address: supplier.address || ""
            });
        } else {
            setEditingSupplier(null);
            setFormData({ name: "", phone: "", email: "", address: "" });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) return toast.error("Supplier name is required");

        setIsSaving(true);
        try {
            if (editingSupplier) {
                await api.put(`/api/suppliers/${editingSupplier.id}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success("Supplier updated successfully");
            } else {
                await api.post("/api/suppliers", formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success("Supplier added successfully");
            }
            fetchSuppliers();
            setShowModal(false);
        } catch (err) {
            toast.error(err.response?.data?.error || "Error saving supplier");
        } finally {
            setIsSaving(false);
        }
    };

    const askDelete = (s) => {
        setConfirmDialog({ show: true, id: s.id, name: s.name });
    };

    const handleDeleteConfirmed = async () => {
        const id = confirmDialog.id;
        setConfirmDialog({ show: false, id: null, name: "" });
        try {
            await api.delete(`/api/suppliers/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Supplier deleted successfully");
            fetchSuppliers();
        } catch (err) {
            toast.error(err.response?.data?.error || "Error deleting supplier");
        }
    };

    const handleViewProducts = async (supplier) => {
        setSelectedSupplier(supplier);
        setProductsList([]);
        setProductSearchTerm("");
        setProductPagination({ page: 1, limit: 5 });
        setLoadingProducts(true);
        setShowProductsModal(true);
        try {
            const res = await api.get(`/api/suppliers/${supplier.id}/products`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProductsList(res.data || []);
        } catch (err) {
            toast.error("Error loading linked products");
        } finally {
            setLoadingProducts(false);
        }
    };

    return (
        <div className="p-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="page-title mb-1 text-white">Manage Suppliers</h2>
                    <p className="text-white mb-0 opacity-75">Sellers & vendor contact management</p>
                </div>
                {hasPermission("manage_suppliers") && (
                    <Button
                        className="btn btn-gradient gap-2 d-flex align-items-center"
                        onClick={() => handleOpenModal()}
                    >
                        <i className="bi bi-plus-lg"></i> Add Supplier
                    </Button>
                )}
            </div>

            <div className="glass p-3 mb-4 d-flex gap-3 align-items-center shadow-soft">
                <i className="bi bi-search text-primary h5 mb-0"></i>
                <input
                    type="text"
                    placeholder="Search suppliers by name, phone or email..."
                    className="bg-transparent border-0 text-white shadow-none fs-5 w-100 outline-none"
                    style={{ outline: "none" }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <SupplierTable
                loading={loading}
                paginatedSuppliers={paginatedSuppliers}
                handleViewProducts={handleViewProducts}
                handleOpenModal={handleOpenModal}
                askDelete={askDelete}
            />

            <PaginationControl
                pagination={{
                    ...pagination,
                    total: filteredSuppliers.length,
                    pages: totalPages
                }}
                setPage={(page) => setPagination(prev => ({ ...prev, page }))}
            />

            <SupplierFormModal
                show={showModal}
                onHide={() => setShowModal(false)}
                handleSubmit={handleSubmit}
                formData={formData}
                setFormData={setFormData}
                editingSupplier={editingSupplier}
                isSaving={isSaving}
            />

            <ConfirmDialog
                show={confirmDialog.show}
                title="Delete Supplier"
                message={`Are you sure you want to delete "${confirmDialog.name}"? This action will unlink their products.`}
                confirmText="Remove Supplier"
                confirmVariant="danger"
                onConfirm={handleDeleteConfirmed}
                onCancel={() => setConfirmDialog({ show: false, id: null, name: "" })}
            />

            <SupplierProductsModal
                show={showProductsModal}
                onHide={() => setShowProductsModal(false)}
                selectedSupplier={selectedSupplier}
                productSearchTerm={productSearchTerm}
                setProductSearchTerm={setProductSearchTerm}
                loadingProducts={loadingProducts}
                paginatedModalProducts={paginatedModalProducts}
                productPagination={productPagination}
                setProductPagination={setProductPagination}
                modalTotalPages={modalTotalPages}
                filteredModalProducts={filteredModalProducts}
                apiBaseUrl={api.defaults.baseURL}
            />
        </div>
    );
}
