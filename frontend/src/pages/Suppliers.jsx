import { useState, useEffect, useMemo } from "react";
import { Button, Form, Modal, Row, Col, Badge, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import PaginationControl from "../components/PaginationControl";
import ConfirmDialog from "../components/ConfirmDialog";

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

    // Instant High-speed Search for thousands of records
    const filteredSuppliers = useMemo(() => {
        if (!searchTerm) return suppliers;
        const s = searchTerm.toLowerCase();
        return suppliers.filter(sup =>
            sup.name.toLowerCase().includes(s) ||
            (sup.phone && sup.phone.includes(s)) ||
            (sup.email && sup.email.toLowerCase().includes(s))
        );
    }, [suppliers, searchTerm]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredSuppliers.length / pagination.limit);
    const paginatedSuppliers = useMemo(() => {
        const start = (pagination.page - 1) * pagination.limit;
        return filteredSuppliers.slice(start, start + pagination.limit);
    }, [filteredSuppliers, pagination.page, pagination.limit]);

    // Reset page when search changes
    useEffect(() => {
        setPagination(prev => ({ ...prev, page: 1 }));
    }, [searchTerm]);

    // --- Modal Products Logic (Search & Pagination) ---
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

            {/* High-speed Search Bar */}
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

            <div className="table-darkx">
                <table className="table table-borderless table-hover mb-0">
                    <thead>
                        <tr>
                            <th className="px-4 py-3">SUPPLIER</th>
                            <th className="px-4 py-3 text-center">CONTACT</th>
                            <th className="px-4 py-3 text-center">PRODUCTS</th>
                            <th className="px-4 py-3 text-end">ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="4" className="text-center py-5">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : paginatedSuppliers.length > 0 ? (
                            paginatedSuppliers.map((s) => (
                                <tr key={s.id}>
                                    <td className="px-4 py-3 align-middle">
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="icon-box-sm rounded-3 bg-primary-soft text-primary d-flex align-items-center justify-content-center">
                                                <i className="bi bi-person-workspace fs-5"></i>
                                            </div>
                                            <div>
                                                <div className="fw-bold text-white">{s.name}</div>
                                                <div className="text-muted x-small">{s.address || "No address"}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 align-middle text-center">
                                        <div className="small text-white opacity-75">{s.phone || "---"}</div>
                                        <div className="x-small text-muted">{s.email || "---"}</div>
                                    </td>
                                    <td className="px-4 py-3 align-middle text-center">
                                        <Badge
                                            className={`badge-soft pointer ${s.productCount > 0 ? 'bg-info' : 'bg-secondary'}`}
                                            style={{ cursor: s.productCount > 0 ? 'pointer' : 'default' }}
                                            onClick={() => s.productCount > 0 && handleViewProducts(s)}
                                        >
                                            {s.productCount} Products
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-end align-middle">
                                        <button
                                            className="btn btn-sm btn-outline-light me-2 rounded-3 border-0"
                                            onClick={() => handleOpenModal(s)}
                                        >
                                            <i className="bi bi-pencil-square text-primary"></i>
                                        </button>
                                        <button
                                            className="btn btn-sm btn-outline-light rounded-3 border-0"
                                            onClick={() => askDelete(s)}
                                        >
                                            <i className="bi bi-trash text-danger"></i>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="text-center py-5 text-muted">No suppliers matching your search.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <PaginationControl
                pagination={{
                    ...pagination,
                    total: filteredSuppliers.length,
                    pages: totalPages
                }}
                setPage={(page) => setPagination(prev => ({ ...prev, page }))}
            />

            {/* Edit/Add Modal */}
            <Modal
                show={showModal}
                onHide={() => setShowModal(false)}
                centered
                contentClassName="glass border-0"
                size="lg"
            >
                <Modal.Header closeButton closeVariant="white" className="border-bottom border-secondary">
                    <Modal.Title className="fw-bold text-white">
                        {editingSupplier ? "Edit Supplier" : "Add New Supplier"}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body className="p-4 bg-dark">
                        <Form.Group className="mb-4">
                            <Form.Label className="text-muted small fw-bold">VENDOR NAME / COMPANY</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter full name..."
                                className="bg-dark text-white border-secondary shadow-none no-focus-outline"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </Form.Group>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-4">
                                    <Form.Label className="text-muted small fw-bold">CONTACT NUMBER</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="e.g., +92 XXX XXXXXXX"
                                        className="bg-dark text-white border-secondary shadow-none"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-4">
                                    <Form.Label className="text-muted small fw-bold">EMAIL ADDRESS</Form.Label>
                                    <Form.Control
                                        type="email"
                                        placeholder="vendor@company.com"
                                        className="bg-dark text-white border-secondary shadow-none"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Form.Group className="mb-3">
                            <Form.Label className="text-muted small fw-bold">PHYSICAL ADDRESS</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                placeholder="Street, City, Country..."
                                className="bg-dark text-white border-secondary shadow-none"
                                value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer className="border-top border-secondary bg-dark p-3">
                        <Button variant="outline-secondary" onClick={() => setShowModal(false)} className="border-0">
                            Cancel
                        </Button>
                        <Button type="submit" className="btn-gradient px-4 border-0" disabled={isSaving}>
                            {isSaving ? "Saving..." : editingSupplier ? "Save Changes" : "Create Supplier"}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            <ConfirmDialog
                show={confirmDialog.show}
                title="Delete Supplier"
                message={`Are you sure you want to delete "${confirmDialog.name}"? This action will unlink their products.`}
                confirmText="Remove Supplier"
                confirmVariant="danger"
                onConfirm={handleDeleteConfirmed}
                onCancel={() => setConfirmDialog({ show: false, id: null, name: "" })}
            />

            {/* Supplier Products Modal */}
            <Modal
                show={showProductsModal}
                onHide={() => setShowProductsModal(false)}
                centered
                size="lg"
                contentClassName="glass border-0"
            >
                <Modal.Header closeButton closeVariant="white" className="border-bottom border-secondary">
                    <Modal.Title className="fw-bold text-white">
                        Products by {selectedSupplier?.name}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-0 bg-dark overflow-hidden" style={{ minHeight: '400px' }}>
                    {/* Inner Search Bar */}
                    <div className="p-3 bg-black-25 border-bottom border-secondary d-flex align-items-center gap-3">
                        <i className="bi bi-search text-primary small"></i>
                        <input
                            type="text"
                            placeholder="Search among linked products..."
                            className="bg-transparent border-0 text-white shadow-none small w-100 outline-none"
                            style={{ outline: 'none' }}
                            value={productSearchTerm}
                            onChange={(e) => setProductSearchTerm(e.target.value)}
                        />
                    </div>

                    {loadingProducts ? (
                        <div className="d-flex flex-column align-items-center justify-content-center py-5">
                            <Spinner animation="border" variant="primary" className="mb-2" />
                            <span className="text-muted">Fetching product information...</span>
                        </div>
                    ) : paginatedModalProducts.length > 0 ? (
                        <>
                            <div className="table-darkx" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                                <table className="table table-borderless table-hover mb-0">
                                    <thead className="sticky-top bg-dark">
                                        <tr className="border-bottom border-secondary">
                                            <th className="px-4 py-3">PRODUCT</th>
                                            <th className="px-4 py-3">SKU</th>
                                            <th className="px-4 py-3 text-center">PRICE</th>
                                            <th className="px-4 py-3 text-center">STOCK</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedModalProducts.map(p => (
                                            <tr key={p.id} className="border-bottom border-secondary-subtle">
                                                <td className="px-4 py-3">
                                                    <div className="d-flex align-items-center gap-2 text-white">
                                                        <div className="rounded bg-black-25 p-1 border border-secondary" style={{ width: '40px', height: '40px' }}>
                                                            {p.image ? (
                                                                <img src={`${api.defaults.baseURL}${p.image}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            ) : (
                                                                <div className="w-100 h-100 d-flex align-items-center justify-content-center"><i className="bi bi-image"></i></div>
                                                            )}
                                                        </div>
                                                        <span className="small">{p.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 align-middle text-muted x-small">{p.sku || "---"}</td>
                                                <td className="px-4 py-3 align-middle text-center text-white small">Rs.{p.price}</td>
                                                <td className="px-4 py-3 align-middle text-center">
                                                    <span className={`fw-bold small ${p.stock <= 5 ? 'text-danger' : 'text-success'}`}>{p.stock}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="p-3 border-top border-secondary">
                                <PaginationControl
                                    pagination={{
                                        ...productPagination,
                                        total: filteredModalProducts.length,
                                        pages: modalTotalPages
                                    }}
                                    setPage={(page) => setProductPagination(prev => ({ ...prev, page }))}
                                />
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-5 text-muted">
                            {productSearchTerm ? "No products match your search." : "No products found for this supplier."}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-top border-secondary bg-dark">
                    <Button variant="outline-light" onClick={() => setShowProductsModal(false)} className="border-0">
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
