import { useState, useMemo } from "react";
import { toast } from "react-toastify";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { fetchUsersList, createUser, updateUser, deleteUser } from "../api/userApi";
import { fetchRolesList } from "../api/roleApi";
import { useAuth } from "../auth/AuthContext";
import { api } from "../api/client";
import { Modal, Button, Form } from "react-bootstrap";
import ConfirmDialog from "../components/ConfirmDialog";
import PaginationControl from "../components/PaginationControl";
import Skeleton from "../components/Skeleton";

export default function Users() {
    const { token } = useAuth();
    const queryClient = useQueryClient();

    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState({ show: false, id: null, name: "" });
    const [pagination, setPagination] = useState({ page: 1, limit: 10 });

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role_ids: [],
        branch_ids: []
    });

    const { data: usersData, isLoading: loadingUsers } = useQuery({
        queryKey: ["users"],
        queryFn: async () => {
            const res = await fetchUsersList(token);
            return res.data || [];
        },
        enabled: !!token,
        placeholderData: keepPreviousData
    });

    const { data: rolesData } = useQuery({
        queryKey: ["roles"],
        queryFn: async () => {
            const res = await fetchRolesList(token);
            return res.data || [];
        },
        enabled: !!token
    });

    const { data: branchesData } = useQuery({
        queryKey: ["branches-minimal"],
        queryFn: async () => {
            const res = await api.get("/api/branches?limit=all"); // Fetch all branches for assignment
            return res.data.data || res.data || [];
        },
        enabled: !!token
    });

    const users = usersData || [];
    const roles = rolesData || [];

    const paginatedUsers = useMemo(() => {
        const start = (pagination.page - 1) * pagination.limit;
        return users.slice(start, start + pagination.limit);
    }, [users, pagination.page, pagination.limit]);

    const totalPages = Math.ceil(users.length / pagination.limit);

    const handleOpenAdd = () => {
        setEditMode(false);
        setEditId(null);
        setFormData({ name: "", email: "", password: "", role_ids: [], branch_ids: [] });
        setShowModal(true);
    };

    const handleOpenEdit = (user) => {
        setEditMode(true);
        setEditId(user.id);
        setFormData({
            name: user.name,
            email: user.email,
            password: "",
            role_ids: user.roles ? user.roles.map(r => r.id) : [],
            branch_ids: user.assignedBranches ? user.assignedBranches.map(b => b.id) : []
        });
        setShowModal(true);
    };

    const askDelete = (u) => {
        setConfirmDialog({ show: true, id: u.id, name: u.name });
    };

    const handleDeleteConfirmed = async () => {
        const id = confirmDialog.id;
        setConfirmDialog({ show: false, id: null, name: "" });
        try {
            await deleteUser(id, token);
            toast.success("User deleted successfully");
            queryClient.invalidateQueries({ queryKey: ["users"] });
        } catch (err) {
            toast.error(err.response?.data?.error || "Error deleting user");
        }
    };

    const handleRoleChange = (e) => {
        const value = e.target.value;
        setFormData({
            ...formData,
            role_ids: value ? [Number(value)] : []
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.email) return toast.error("Name and Email are required");
        if (!editMode && !formData.password) return toast.error("Password is required for new users");
        if (formData.role_ids.length === 0) return toast.error("Please select a role for the user");

        try {
            if (editMode) {
                const updateData = { ...formData };
                if (!updateData.password) delete updateData.password;
                await updateUser(editId, updateData, token);
                toast.success("User updated successfully");
            } else {
                await createUser(formData, token);
                toast.success("User created successfully");
            }
            setShowModal(false);
            queryClient.invalidateQueries({ queryKey: ["users"] });
        } catch (err) {
            toast.error(err.response?.data?.error || "Error saving user");
        }
    };

    return (
        <div className="p-4 h-100">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
                <div>
                    <h2 className="page-title mb-1">Manage Users</h2>
                    <p className="text-white opacity-75 mb-0">Staff and administrator accounts</p>
                </div>
                <button
                    className="btn btn-gradient gap-2 d-flex align-items-center justify-content-center"
                    onClick={handleOpenAdd}
                >
                    <i className="bi bi-person-plus"></i> Add User
                </button>
            </div>

            <div className="table-darkx">
                <div className="table-responsive">
                    <table className="table table-borderless table-hover mb-0">
                        <thead>
                            <tr className="text-nowrap">
                                <th className="px-4 py-3">NAME</th>
                                <th className="px-4 py-3">EMAIL</th>
                                <th className="px-4 py-3">ROLES</th>
                                <th className="px-4 py-3 text-end">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingUsers && users.length === 0 ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i}>
                                        <td className="px-4 py-3"><Skeleton width="150px" /></td>
                                        <td className="px-4 py-3"><Skeleton width="180px" /></td>
                                        <td className="px-4 py-3"><Skeleton width="100px" /></td>
                                        <td className="px-4 py-3 text-end"><Skeleton width="80px" className="ms-auto" /></td>
                                    </tr>
                                ))
                            ) : (
                                paginatedUsers.map(u => (
                                    <tr key={u.id}>
                                        <td className="px-4 py-3 align-middle fw-bold text-white text-nowrap">{u.name}</td>
                                        <td className="px-4 py-3 align-middle text-white text-nowrap">{u.email}</td>
                                        <td className="px-4 py-3 align-middle text-nowrap">
                                            {u.roles && u.roles.length > 0 ? u.roles.map(r => (
                                                <span key={r.id} className="badge-soft me-1" style={{ fontSize: '10px', textTransform: 'capitalize' }}>
                                                    {r.name}
                                                </span>
                                            )) : <span className="text-muted small">No roles</span>}
                                        </td>
                                        <td className="px-4 py-3 text-end align-middle">
                                            <div className="d-flex justify-content-end gap-1">
                                                <button
                                                    className="btn btn-sm btn-outline-light rounded-3 border-0"
                                                    onClick={() => handleOpenEdit(u)}
                                                    title="Edit User"
                                                >
                                                    <i className="bi bi-pencil-square text-primary"></i>
                                                </button>
                                                {(!u.roles || !u.roles.some(r => r.name.toLowerCase() === 'super admin')) && (
                                                    <button
                                                        className="btn btn-sm btn-outline-light rounded-3 border-0"
                                                        onClick={() => askDelete(u)}
                                                        title="Delete User"
                                                    >
                                                        <i className="bi bi-trash text-danger"></i>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <PaginationControl
                pagination={{
                    ...pagination,
                    total: users.length,
                    pages: totalPages
                }}
                setPage={(page) => setPagination(prev => ({ ...prev, page }))}
            />

            <Modal show={showModal} onHide={() => setShowModal(false)} centered contentClassName="glass border-0">
                <Modal.Header closeButton closeVariant="white" className="border-bottom border-secondary">
                    <Modal.Title className="fw-bold">{editMode ? "Edit User" : "Add New User"}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body className="p-4">
                        <Form.Group className="mb-3">
                            <Form.Label className="text-muted small fw-bold">FULL NAME</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter staff name"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="bg-dark text-light border-secondary shadow-none"
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="text-muted small fw-bold">EMAIL ADDRESS</Form.Label>
                            <Form.Control
                                type="email"
                                placeholder="staff@example.com"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className="bg-dark text-light border-secondary shadow-none"
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="text-muted small fw-bold">PASSWORD {editMode && "(leave blank to keep current)"}</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Minimum 6 characters"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                className="bg-dark text-light border-secondary shadow-none"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="text-muted small fw-bold">USER ROLE</Form.Label>
                            <Form.Select
                                className="bg-dark text-light border-secondary shadow-none"
                                value={formData.role_ids[0] || ""}
                                onChange={handleRoleChange}
                                required
                            >
                                <option value="">-- Select Role --</option>
                                {roles.map(r => (
                                    <option key={r.id} value={r.id} style={{ textTransform: 'capitalize' }}>
                                        {r.name}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label className="text-muted small fw-bold">ASSIGNED BRANCHES</Form.Label>
                            <div className="d-flex flex-wrap gap-2 mt-1">
                                {branchesData?.map(b => (
                                    <Form.Check
                                        key={b.id}
                                        type="checkbox"
                                        id={`branch-${b.id}`}
                                        label={b.name}
                                        checked={formData.branch_ids.includes(b.id)}
                                        onChange={(e) => {
                                            const ids = e.target.checked
                                                ? [...formData.branch_ids, b.id]
                                                : formData.branch_ids.filter(id => id !== b.id);
                                            setFormData({ ...formData, branch_ids: ids });
                                        }}
                                        className="text-white small"
                                    />
                                ))}
                            </div>
                            <Form.Text className="text-muted">
                                If empty, the user only has access to their primary branch.
                            </Form.Text>
                        </Form.Group>

                    </Modal.Body >
                    <Modal.Footer className="border-top border-secondary">
                        <Button variant="outline-secondary" onClick={() => setShowModal(false)} className="border-0">
                            Cancel
                        </Button>
                        <Button type="submit" className="btn-gradient border-0 px-4">
                            {editMode ? "Save Changes" : "Create User"}
                        </Button>
                    </Modal.Footer>
                </Form >
            </Modal >
            <ConfirmDialog
                show={confirmDialog.show}
                title="Delete User"
                message={`Are you sure you want to delete "${confirmDialog.name}"? This cannot be undone.`}
                confirmText="Delete"
                confirmVariant="danger"
                onConfirm={handleDeleteConfirmed}
                onCancel={() => setConfirmDialog({ show: false, id: null, name: "" })}
            />
        </div >
    );
}
