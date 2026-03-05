import { useState, useEffect, useMemo } from "react";
import { Form, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { fetchDiscountsList, createDiscount, updateDiscount, deleteDiscount } from "../api/discountApi";
import { fetchProducts as getProducts, fetchCategoriesFlat } from "../api/productApi";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import PaginationControl from "../components/PaginationControl";
import ConfirmDialog from "../components/ConfirmDialog";

// Components
import DiscountFormModal from "../components/Discounts/DiscountFormModal";
import DiscountTable from "../components/Discounts/DiscountTable";

// Styles
import "../styles/Discounts.css";

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
            const [disRes, catRes] = await Promise.all([
                fetchDiscountsList(token),
                fetchCategoriesFlat(token)
            ]);
            setDiscounts(disRes.data || []);
            setCategories(catRes.data || []);
        } catch (err) {
            toast.error("Error loading initial data");
        } finally {
            setLoading(false);
        }
    };

    const fetchAllProducts = async () => {
        if (products.length > 0) return; // Already fetched
        try {
            const res = await getProducts(token);
            setProducts(res.data || []);
        } catch (err) {
            toast.error("Error loading products");
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

            return { ...prev, categoryIds: current };
        });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.value) return toast.error("Basic info required");
        setIsSaving(true);
        try {
            if (editingItem) {
                await updateDiscount(editingItem.id, formData, token);
                toast.success("Discount updated");
            } else {
                await createDiscount(formData, token);
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
            await deleteDiscount(confirmDialog.id, token);
            toast.success("Discount deleted");
            fetchInitialData();
        } catch (err) {
            toast.error("Delete failed");
        }
        setConfirmDialog({ show: false, id: null, name: "" });
    };

    const openModal = async (item = null) => {
        fetchAllProducts(); // Start fetching product list needed for modal
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

            <DiscountTable
                paginatedItems={paginatedItems}
                openModal={openModal}
                setConfirmDialog={setConfirmDialog}
                discounts={discounts}
            />

            <PaginationControl
                pagination={{
                    page: pagination.page,
                    limit: pagination.limit,
                    total: filteredItems.length,
                    pages: totalPages
                }}
                setPage={p => setPagination({ ...pagination, page: p })}
            />

            <DiscountFormModal
                show={showModal}
                onHide={() => setShowModal(false)}
                handleSave={handleSave}
                formData={formData}
                setFormData={setFormData}
                editingItem={editingItem}
                isSaving={isSaving}
                categories={categories}
                products={products}
                catSearch={catSearch}
                setCatSearch={setCatSearch}
                toggleCategorySelection={toggleCategorySelection}
            />

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
