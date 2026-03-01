import { useState, useEffect, useMemo } from "react";
import { Table, Button, Form, Modal, Row, Col, Card, Badge, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import PaginationControl from "../components/PaginationControl";
import ConfirmDialog from "../components/ConfirmDialog";
import HierarchicalCategoryPicker from "../components/HierarchicalCategoryPicker";

// Styles
import "./Discounts.css";

export default function Discounts() {
    const { token, hasPermission } = useAuth();
    const [discounts, setDiscounts] = useState([]);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [catSearch, setCatSearch] = useState("");
    const [pagination, setPagination] = useState({ page: 1, limit: 10 });

    const [formData, setFormData] = useState({
        name: "", type: "percentage", value: "",
        startDate: "", endDate: "", isActive: true,
        productIds: [], categoryIds: []
    });

    const [isSaving, setIsSaving] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({ show: false, id: null, name: "" });

    useEffect(() => { fetchInitialData(); }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [disRes, prodRes, catRes] = await Promise.all([
                api.get("/api/discounts", { headers: { Authorization: `Bearer ${token}` } }),
                api.get("/api/products?limit=all", { headers: { Authorization: `Bearer ${token}` } }),
                api.get("/api/categories?limit=all", { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setDiscounts(disRes.data || []);
            setProducts(prodRes.data || []);
            setCategories(catRes.data || []);
        } catch (err) {
            toast.error("Error loading data");
        } finally {
            setLoading(false);
        }
    };

    const filteredItems = useMemo(() => {
        if (!searchTerm) return discounts;
        const s = searchTerm.toLowerCase();
        return discounts.filter(d => d.name.toLowerCase().includes(s));
    }, [discounts, searchTerm]);

    const totalPages = Math.ceil(filteredItems.length / pagination.limit);
    const paginatedItems = useMemo(() => {
        const start = (pagination.page - 1) * pagination.limit;
        return filteredItems.slice(start, start + pagination.limit);
    }, [filteredItems, pagination.page]);

    const toggleCategorySelection = (catId) => {
        setFormData(prev => {
            const current = [...prev.categoryIds];
            const index = current.indexOf(catId);
            if (index > -1) current.splice(index, 1);
            else current.push(catId);

            return { ...prev, categoryIds: current, productIds: [] };
        });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.value) return toast.error("Basic info required");
        setIsSaving(true);
        try {
            if (editingItem) {
                await api.put(`/api/discounts/${editingItem.id}`, formData, { headers: { Authorization: `Bearer ${token}` } });
                toast.success("Discount updated");
            } else {
                await api.post("/api/discounts", formData, { headers: { Authorization: `Bearer ${token}` } });
                toast.success("Discount created");
            }
            setShowModal(false);
            fetchInitialData();
        } catch (err) {
            toast.error(err.response?.data?.error || "Error saving discount");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            await api.delete(`/api/discounts/${confirmDialog.id}`, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("Discount deleted");
            fetchInitialData();
        } catch (err) {
            toast.error("Delete failed");
        }
        setConfirmDialog({ show: false, id: null, name: "" });
    };

    const openModal = (item = null) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                name: item.name,
                type: item.type,
                value: item.value,
                startDate: item.startDate ? item.startDate.split('T')[0] : "",
                endDate: item.endDate ? item.endDate.split('T')[0] : "",
                isActive: item.isActive,
                productIds: item.products?.map(p => p.productId) || [],
                categoryIds: item.categories?.map(c => c.categoryId) || []
            });
        } else {
            setEditingItem(null);
            setFormData({
                name: "", type: "percentage", value: "",
                startDate: "", endDate: "", isActive: true,
                productIds: [], categoryIds: []
            });
        }
        setShowModal(true);
    };

    if (loading) return <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>;

    return (
        <div className="p-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="page-title mb-1">Discount Management</h2>
                    <p className="text-white mb-0">List and manage your promo campaigns & special offers</p>
                </div>
                {hasPermission("manage_discounts") && (
                    <button
                        className="btn btn-gradient gap-2 d-flex align-items-center"
                        onClick={() => openModal()}
                    >
                        <i className="bi bi-plus-lg"></i> Create Campaign
                    </button>
                )}
            </div>

            <div className="glass p-3 mb-4 d-flex gap-3 align-items-center shadow-soft">
                <i className="bi bi-search text-muted h5 mb-0"></i>
                <Form.Control
                    type="text"
                    placeholder="Search campaigns by name..."
                    className="bg-transparent border-0 text-white shadow-none fs-5 w-100"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="table-darkx shadow-soft">
                <table className="table table-borderless table-hover mb-0">
                    <thead>
                        <tr>
                            <th className="px-4 py-3">CAMPAIGN NAME</th>
                            <th className="px-4 py-3">TYPE</th>
                            <th className="px-4 py-3">VALUE</th>
                            <th className="px-4 py-3">VALIDITY</th>
                            <th className="px-4 py-3">STATUS</th>
                            <th className="px-4 py-3 text-end">ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedItems.map(d => (
                            <tr key={d.id}>
                                <td className="px-4 py-3 align-middle fw-bold">{d.name}</td>
                                <td className="px-4 py-3 align-middle">
                                    <span className="badge-soft text-uppercase x-small">{d.type}</span>
                                </td>
                                <td className="px-4 py-3 align-middle fw-bold text-primary">
                                    {d.type === 'percentage' ? `${parseFloat(d.value).toFixed(2)}%` : `Flat Rs.${parseFloat(d.value).toFixed(2)}`}
                                </td>
                                <td className="px-4 py-3 align-middle">
                                    <div className="small">
                                        {d.startDate ? new Date(d.startDate).toLocaleDateString() : 'Start Now'}
                                        <i className="bi bi-arrow-right mx-2 text-muted"></i>
                                        {d.endDate ? new Date(d.endDate).toLocaleDateString() : 'Forever'}
                                    </div>
                                </td>
                                <td className="px-4 py-3 align-middle">
                                    {d.isActive ? (
                                        <span className="text-success small"><i className="bi bi-circle-fill me-2" style={{ fontSize: '8px' }}></i>Active</span>
                                    ) : (
                                        <span className="text-danger small"><i className="bi bi-circle-fill me-2" style={{ fontSize: '8px' }}></i>Paused</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-end align-middle">
                                    <button
                                        className="btn btn-sm btn-outline-light me-2 rounded-3 border-0"
                                        onClick={() => openModal(d)}
                                    >
                                        <i className="bi bi-pencil-square text-primary"></i>
                                    </button>
                                    <button
                                        className="btn btn-sm btn-outline-light rounded-3 border-0"
                                        onClick={() => setConfirmDialog({ show: true, id: d.id, name: d.name })}
                                    >
                                        <i className="bi bi-trash text-danger"></i>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {discounts.length === 0 && (
                            <tr>
                                <td colSpan="6" className="text-center py-4 text-muted">No campaigns found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>


            <PaginationControl
                pagination={{
                    page: pagination.page,
                    limit: pagination.limit,
                    total: filteredItems.length,
                    pages: totalPages
                }}
                setPage={p => setPagination({ ...pagination, page: p })}
            />


            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered contentClassName="glass border-0">
                <Modal.Header closeButton closeVariant="white" className="border-bottom border-secondary">
                    <Modal.Title className="fw-bold">{editingItem ? "Edit Campaign" : "Create New Campaign"}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSave}>
                    <Modal.Body className="p-4">
                        <Row className="g-3">
                            <Col md={8}>
                                <Form.Label className="text-muted small fw-bold">CAMPAIGN TITLE</Form.Label>
                                <Form.Control required type="text" placeholder="e.g. Summer Sale 2024" className="bg-dark text-white border-secondary shadow-none" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </Col>
                            <Col md={4}>
                                <Form.Label className="text-muted small fw-bold">TYPE</Form.Label>
                                <Form.Select className="bg-dark text-white border-secondary shadow-none" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                    <option value="percentage">Percentage %</option>
                                    <option value="flat">Flat Amount</option>
                                </Form.Select>
                            </Col>
                            <Col md={6}>
                                <Form.Label className="text-muted small fw-bold">VALUE</Form.Label>
                                <Form.Control required type="number" step="0.01" placeholder="Enter amount or %" className="bg-dark text-white border-secondary shadow-none" value={formData.value} onChange={e => setFormData({ ...formData, value: e.target.value })} />
                            </Col>
                            <Col md={6}>
                                <Form.Label className="text-muted small fw-bold">STATUS</Form.Label>
                                <div className="mt-2">
                                    <Form.Check type="switch" label={formData.isActive ? "Active Campaign" : "Inactive Campaign"} checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} className="text-white" />
                                </div>
                            </Col>
                            <Col md={6}>
                                <Form.Label className="text-muted small fw-bold">START DATE</Form.Label>
                                <Form.Control type="date" className="bg-dark text-white border-secondary shadow-none" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                            </Col>
                            <Col md={6}>
                                <Form.Label className="text-muted small fw-bold">END DATE</Form.Label>
                                <Form.Control type="date" className="bg-dark text-white border-secondary shadow-none" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
                            </Col>

                            <Col md={6}>
                                <Form.Label className="text-muted small fw-bold">RESTRICT TO CATEGORIES</Form.Label>
                                <Form.Control size="sm" type="text" placeholder="Search categories..." className="bg-dark text-white border-secondary mb-2 shadow-none" value={catSearch} onChange={e => setCatSearch(e.target.value)} />
                                <HierarchicalCategoryPicker
                                    categories={categories}
                                    selectedIds={formData.categoryIds}
                                    onToggle={toggleCategorySelection}
                                    searchTerm={catSearch}
                                />
                            </Col>

                            <Col md={6}>
                                <Form.Label className="text-muted small fw-bold">SPECIFIC PRODUCTS (OPTIONAL)</Form.Label>
                                <Form.Text className="text-muted d-block mb-2 x-small">If empty, applies to all items in selected categories.</Form.Text>
                                <div className="product-select-box">
                                    {(formData.categoryIds.length > 0
                                        ? products.filter(p => formData.categoryIds.includes(p.category_id))
                                        : products
                                    ).map(p => (
                                        <div
                                            key={p.id}
                                            className={`product-select-item ${formData.productIds.includes(p.id) ? 'selected' : ''}`}
                                            onClick={() => {
                                                setFormData(prev => {
                                                    const ids = [...prev.productIds];
                                                    const idx = ids.indexOf(p.id);
                                                    if (idx > -1) ids.splice(idx, 1); else ids.push(p.id);
                                                    return { ...prev, productIds: ids };
                                                });
                                            }}
                                        >
                                            <div className="flex-grow-1 small">{p.name}</div>
                                            {formData.productIds.includes(p.id) && <i className="bi bi-check-circle-fill text-primary"></i>}
                                        </div>
                                    ))}
                                </div>
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer className="border-top border-secondary">
                        <Button variant="outline-secondary" className="border-0" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button type="submit" className="btn-gradient border-0 px-4" disabled={isSaving}>
                            {isSaving ? "Saving..." : (editingItem ? "Update Campaign" : "Add Campaign")}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            <ConfirmDialog
                show={confirmDialog.show}
                title="Delete Campaign?"
                message={`Are you sure you want to delete "${confirmDialog.name}"?`}
                onConfirm={handleDelete}
                onCancel={() => setConfirmDialog({ show: false, id: null, name: "" })}
            />
        </div>
    );
}
