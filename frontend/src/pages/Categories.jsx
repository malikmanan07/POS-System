import React, { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import { fetchCategoriesAll, createCategory, updateCategory, deleteCategory } from "../api/categoryApi";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
// No react-bootstrap imports needed here

import CategoryFormModal from "../components/CategoryFormModal";
import PaginationControl from "../components/PaginationControl";
import ConfirmDialog from "../components/ConfirmDialog";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [allCategories, setAllCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 12 }); // Consistent with other pages
  const [confirmDialog, setConfirmDialog] = useState({ show: false, id: null, name: "" });
  const [expandedCats, setExpandedCats] = useState({}); // Track which cats are expanded
  const { token } = useAuth();
  const API_PATH = "/api/categories";

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetchCategoriesAll(token);
      const data = res.data || [];
      setCategories(data);
      setAllCategories(data);
    } catch (err) {
      toast.error("Failed to load categories");
    }
  };

  // No need for separate fetchAllCategories now as fetchCategories gets everything
  const processedCategories = useMemo(() => {
    const getFullPath = (catId, cats) => {
      const cat = cats.find(c => c.id === catId);
      if (!cat) return "";
      if (!cat.parentId) return cat.name;
      const parentPath = getFullPath(cat.parentId, cats);
      return parentPath ? `${parentPath} > ${cat.name}` : cat.name;
    };

    return categories.map(c => ({
      ...c,
      fullPath: getFullPath(c.id, categories)
    })).sort((a, b) => a.fullPath.localeCompare(b.fullPath));
  }, [categories]);

  const filteredCategories = useMemo(() => {
    return processedCategories; // Can add search term filtering here if needed
  }, [processedCategories]);

  const totalPages = Math.ceil(filteredCategories.length / pagination.limit);

  const paginatedCategories = useMemo(() => {
    const start = (pagination.page - 1) * pagination.limit;
    return filteredCategories.slice(start, start + pagination.limit);
  }, [filteredCategories, pagination.page]);

  const handleOpenAdd = (pId = "") => {
    // If called directly from onClick={handleOpenAdd}, pId will be the event object
    const finalParentId = (typeof pId === 'object' && pId !== null) ? "" : pId;
    setEditMode(false);
    setEditId(null);
    setName("");
    setParentId(finalParentId);
    setShowModal(true);
  };

  const handleOpenEdit = (category) => {
    setEditMode(true);
    setEditId(category.id);
    setName(category.name);
    setParentId(category.parentId || "");
    setShowModal(true);
  };

  const askDelete = (c) => {
    setConfirmDialog({ show: true, id: c.id, name: c.name });
  };

  const handleDeleteConfirmed = async () => {
    const id = confirmDialog.id;
    setConfirmDialog({ show: false, id: null, name: "" });
    try {
      await deleteCategory(id, token);
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
        await updateCategory(editId, { name, parentId: parentId || null }, token);
        toast.success("Category updated successfully");
      } else {
        await createCategory({ name, parentId: parentId || null }, token);
        toast.success("Category created successfully");
      }

      setName("");
      setParentId("");
      setShowModal(false);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.error || "Error saving category");
    }
  };

  return (
    <div className="p-4 h-100">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h2 className="page-title mb-1">Manage Categories</h2>
          <p className="text-white opacity-75 mb-0">Group your products by category</p>
        </div>
        <button
          className="btn btn-gradient gap-2 d-flex align-items-center justify-content-center"
          onClick={handleOpenAdd}
        >
          <i className="bi bi-plus-lg"></i> Add Category
        </button>
      </div>

      <div className="table-darkx">
        <div className="table-responsive">
          <table className="table table-borderless table-hover mb-0">
            <thead>
              <tr className="text-nowrap">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">NAME</th>
                <th className="px-4 py-3">PARENT CATEGORY</th>
                <th className="px-4 py-3 text-end">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const toggleExpand = (id) => {
                  setExpandedCats(prev => ({ ...prev, [id]: !prev[id] }));
                };

                const renderRows = (parentId = null, level = 0, prefix = "") => {
                  const results = [];
                  // If parentId is null, we only want to show things that HAVE NO parent
                  const levelItems = parentId === null
                    ? processedCategories.filter(c => !c.parentId).slice((pagination.page - 1) * pagination.limit, pagination.page * pagination.limit)
                    : processedCategories.filter(c => c.parentId === parentId);

                  return levelItems.map((c, index) => {
                    const children = processedCategories.filter(child => child.parentId === c.id);
                    const hasChildren = children.length > 0;
                    const isExpanded = expandedCats[c.id];
                    const currentPrefix = prefix ? `${prefix}.${index + 1}` : `${(pagination.page - 1) * pagination.limit + index + 1}`;

                    return (
                      <React.Fragment key={c.id}>
                        <tr className={level > 0 ? "bg-dark-subtle" : ""}>
                          <td className="px-4 py-3 align-middle text-muted small" title={`DB ID: ${c.id}`}>
                            {currentPrefix}
                          </td>
                          <td className="px-4 py-3 align-middle">
                            <div className="d-flex align-items-center" style={{ marginLeft: `${level * 25}px` }}>
                              {hasChildren ? (
                                <button
                                  className="btn btn-sm p-0 border-0 text-primary me-2 shadow-none"
                                  onClick={() => toggleExpand(c.id)}
                                >
                                  <i className={`bi bi-chevron-${isExpanded ? 'down' : 'right'}`} style={{ fontSize: '0.9rem' }}></i>
                                </button>
                              ) : (
                                <div style={{ width: '22px' }}></div>
                              )}
                              <span
                                className={`badge-soft ${level === 0 ? 'fw-bold text-white' : ''} ${hasChildren ? 'cursor-pointer' : ''}`}
                                onClick={() => hasChildren && toggleExpand(c.id)}
                              >
                                {c.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 align-middle text-muted small">
                            {c.parentName || (level === 0 ? "Root" : "-")}
                          </td>
                          <td className="px-4 py-3 text-end align-middle">
                            <button
                              className="btn btn-sm btn-outline-light me-2 rounded-3 border-0"
                              onClick={() => handleOpenAdd(c.id)}
                              title="Add Sub-category"
                            >
                              <i className="bi bi-plus-circle text-success"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-outline-light me-2 rounded-3 border-0"
                              onClick={() => handleOpenEdit(c)}
                              title="Edit"
                            >
                              <i className="bi bi-pencil-square text-primary"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-outline-light rounded-3 border-0"
                              onClick={() => askDelete(c)}
                              title="Delete"
                            >
                              <i className="bi bi-trash text-danger"></i>
                            </button>
                          </td>
                        </tr>
                        {hasChildren && isExpanded && renderRows(c.id, level + 1, currentPrefix)}
                      </React.Fragment>
                    );
                  });
                };

                const rootItemsCount = processedCategories.filter(c => !c.parentId).length;
                return rootItemsCount > 0 ? renderRows(null, 0) : (
                  <tr>
                    <td colSpan="4" className="text-center py-4 text-muted">No categories found</td>
                  </tr>
                );
              })()}
            </tbody>
          </table>
        </div>

        <PaginationControl
          pagination={{
            ...pagination,
            total: processedCategories.filter(c => !c.parentId).length,
            pages: Math.ceil(processedCategories.filter(c => !c.parentId).length / pagination.limit)
          }}
          setPage={(page) => setPagination(prev => ({ ...prev, page }))}
        />

        <CategoryFormModal
          show={showModal}
          onHide={() => setShowModal(false)}
          handleSubmit={handleSubmit}
          name={name}
          setName={setName}
          parentId={parentId}
          setParentId={setParentId}
          allCategories={processedCategories}
          editMode={editMode}
          editId={editId}
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
    </div>
  );
}