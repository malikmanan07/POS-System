import { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Modal, Button, Form } from "react-bootstrap";
import ConfirmDialog from "../components/ConfirmDialog";
import PaginationControl from "../components/PaginationControl";

export default function Roles() {
    const [roles, setRoles] = useState([]);
    const [name, setName] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState(null);
    const { token } = useAuth();
    const API_PATH = "/api/roles";
    const [confirmDialog, setConfirmDialog] = useState({ show: false, id: null, name: "" });
    const [pagination, setPagination] = useState({ page: 1, limit: 10 });

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            const res = await api.get(API_PATH, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRoles(res.data);
            setPagination(prev => ({ ...prev, page: 1 }));
        } catch (err) {
            toast.error("Failed to load roles");
        }
    };

    const paginatedRoles = useMemo(() => {
        const start = (pagination.page - 1) * pagination.limit;
        return roles.slice(start, start + pagination.limit);
    }, [roles, pagination.page, pagination.limit]);

    const totalPages = Math.ceil(roles.length / pagination.limit);

    const handleOpenAdd = () => {
        setEditMode(false);
        setEditId(null);
        setName("");
        setShowModal(true);
    };

    const handleOpenEdit = (role) => {
        setEditMode(true);
        setEditId(role.id);
        setName(role.name);
        setShowModal(true);
    };

    const askDelete = (r) => {
        setConfirmDialog({ show: true, id: r.id, name: r.name });
    };

    const handleDeleteConfirmed = async () => {
        const id = confirmDialog.id;
        setConfirmDialog({ show: false, id: null, name: "" });
        try {
            await api.delete(`${API_PATH}/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Role deleted successfully");
            fetchRoles();
        } catch (err) {
            toast.error(err.response?.data?.error || "Error deleting role");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return toast.error("Role name is required");

        try {
            if (editMode) {
                await api.put(`${API_PATH}/${editId}`, { name }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success("Role updated successfully");
            } else {
                await api.post(API_PATH, { name }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success("Role created successfully");
            }

            setName("");
            setShowModal(false);
            fetchRoles();
        } catch (err) {
            toast.error(err.response?.data?.error || "Error saving role");
        }
    };

    return (
        <div className="p-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="page-title mb-1">Manage Roles</h2>
                    <p className="text-white mb-0">System roles and permissions management</p>
                </div>
                <button
                    className="btn btn-gradient gap-2 d-flex align-items-center"
                    onClick={handleOpenAdd}
                >
                    <i className="bi bi-plus-lg"></i> Add Role
                </button>
            </div>

            <div className="table-darkx">
                <table className="table table-borderless table-hover mb-0">
                    <thead>
                        <tr>
                            <th className="px-4 py-3">S.NO</th>
                            <th className="px-4 py-3">NAME</th>
                            <th className="px-4 py-3 text-end">ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedRoles.map((r, index) => (
                            <tr key={r.id}>
                                <td className="px-4 py-3 align-middle text-muted small" title={`DB ID: ${r.id}`}>
                                    {(pagination.page - 1) * pagination.limit + index + 1}
                                </td>
                                <td className="px-4 py-3 align-middle">
                                    <span className="badge-soft" style={{ textTransform: "capitalize" }}>
                                        {r.name}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-end align-middle">
                                    <button
                                        className="btn btn-sm btn-outline-light me-2 rounded-3 border-0"
                                        onClick={() => handleOpenEdit(r)}
                                    >
                                        <i className="bi bi-pencil-square text-primary"></i>
                                    </button>
                                    <button
                                        className="btn btn-sm btn-outline-light rounded-3 border-0"
                                        onClick={() => askDelete(r)}
                                    >
                                        <i className="bi bi-trash text-danger"></i>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {roles.length === 0 && (
                            <tr>
                                <td colSpan="3" className="text-center py-4 text-muted">No roles found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <PaginationControl
                pagination={{
                    ...pagination,
                    total: roles.length,
                    pages: totalPages
                }}
                setPage={(page) => setPagination(prev => ({ ...prev, page }))}
            />

            <Modal
                show={showModal}
                onHide={() => setShowModal(false)}
                centered
                contentClassName="glass border-0"
            >
                <Modal.Header closeButton closeVariant="white" className="border-bottom border-secondary">
                    <Modal.Title className="fw-bold">{editMode ? "Edit Role" : "Create New Role"}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label className="text-muted small fw-bold">ROLE NAME</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="e.g., manager, supervisor"
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
                            {editMode ? "Save Changes" : "Add Role"}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
            <ConfirmDialog
                show={confirmDialog.show}
                title="Delete Role"
                message={`Are you sure you want to delete the "${confirmDialog.name}" role? This cannot be undone.`}
                confirmText="Delete"
                confirmVariant="danger"
                onConfirm={handleDeleteConfirmed}
                onCancel={() => setConfirmDialog({ show: false, id: null, name: "" })}
            />
        </div>
    );
}
