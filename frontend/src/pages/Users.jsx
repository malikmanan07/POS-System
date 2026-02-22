import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Modal, Button, Form } from "react-bootstrap";

export default function Users() {
    const [users, setUsers] = useState([]);
    const [rolesList, setRolesList] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({ name: "", email: "", password: "", roleId: "" });

    const { token } = useAuth();
    const API_PATH = "/api/users";
    const ROLES_PATH = "/api/roles";

    useEffect(() => {
        fetchUsers();
        fetchRoles();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get(API_PATH, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(res.data);
        } catch (err) {
            toast.error("Failed to load users");
        }
    };

    const fetchRoles = async () => {
        try {
            const res = await api.get(ROLES_PATH, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRolesList(res.data);
        } catch (err) {
            toast.error("Failed to load roles");
        }
    };

    const handleOpenAdd = () => {
        setEditMode(false);
        setEditId(null);
        setForm({ name: "", email: "", password: "", roleId: "" });
        setShowModal(true);
    };

    const handleOpenEdit = (user) => {
        setEditMode(true);
        setEditId(user.id);

        let roleIdToSet = "";
        if (user.roles && user.roles.length > 0) {
            const primaryRoleName = user.roles[0];
            const matchingRoleObj = rolesList.find(r => r.name.toLowerCase() === primaryRoleName.toLowerCase());
            if (matchingRoleObj) roleIdToSet = matchingRoleObj.id;
        }

        setForm({
            name: user.name,
            email: user.email,
            password: "",
            roleId: roleIdToSet
        });
        setShowModal(true);
    };

    const handleDelete = async (userId) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;
        try {
            await api.delete(`${API_PATH}/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("User deleted successfully");
            fetchUsers();
        } catch (err) {
            toast.error("Failed to delete user");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (editMode && (!form.name || !form.email || !form.roleId)) {
            return toast.error("Name, email and role are required");
        }

        if (!editMode && (!form.name || !form.email || !form.password || !form.roleId)) {
            return toast.error("All fields including role are required");
        }

        try {
            const payload = {
                name: form.name,
                email: form.email,
                roleId: parseInt(form.roleId)
            };

            // For creating or if password is provided during update
            if (form.password) {
                payload.password = form.password;
            }
            if (!editMode) {
                payload.roles = [parseInt(form.roleId)];
            }

            if (editMode) {
                await api.put(`${API_PATH}/${editId}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success("User updated successfully");
            } else {
                await api.post(API_PATH, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success("User created successfully");
            }

            setForm({ name: "", email: "", password: "", roleId: "" });
            setShowModal(false);
            fetchUsers();
        } catch (err) {
            toast.error(err.response?.data?.error || "Error saving user");
        }
    };

    return (
        <div className="p-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="page-title mb-1">Manage Users</h2>
                    <p className="text-white mb-0">System access and accounts</p>
                </div>
                <button
                    className="btn btn-gradient gap-2 d-flex align-items-center"
                    onClick={handleOpenAdd}
                >
                    <i className="bi bi-person-plus-fill"></i> Add User
                </button>
            </div>

            <div className="table-darkx">
                <table className="table table-borderless table-hover mb-0">
                    <thead>
                        <tr>
                            <th className="px-4 py-3">ID</th>
                            <th className="px-4 py-3">NAME</th>
                            <th className="px-4 py-3">EMAIL</th>
                            <th className="px-4 py-3">ROLE(S)</th>
                            <th className="px-4 py-3 text-end">ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id}>
                                <td className="px-4 py-3 align-middle">#{u.id}</td>
                                <td className="px-4 py-3 fw-bold align-middle">{u.name}</td>
                                <td className="px-4 py-3 text-white align-middle">{u.email}</td>
                                <td className="px-4 py-3 align-middle">
                                    {u.roles && u.roles.length > 0 ? (
                                        u.roles.map((r, i) => (
                                            <span key={i} className="badge-soft me-2" style={{ textTransform: "capitalize" }}>
                                                {r}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-muted small">No Role</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-end align-middle">
                                    <button
                                        className="btn btn-sm btn-outline-light me-2 rounded-3 border-0"
                                        onClick={() => handleOpenEdit(u)}
                                    >
                                        <i className="bi bi-pencil-square text-primary"></i>
                                    </button>
                                    <button
                                        className="btn btn-sm btn-outline-light rounded-3 border-0"
                                        onClick={() => handleDelete(u.id)}
                                    >
                                        <i className="bi bi-trash text-danger"></i>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr>
                                <td colSpan="5" className="text-center py-4 text-muted">No users found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Modal
                show={showModal}
                onHide={() => setShowModal(false)}
                centered
                contentClassName="glass border-0"
            >
                <Modal.Header closeButton closeVariant="white" className="border-bottom border-secondary">
                    <Modal.Title className="fw-bold">{editMode ? "Edit User" : "Create New User"}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label className="text-muted small fw-bold">FULL NAME</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="e.g., John Doe"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                className="bg-dark text-light border-secondary shadow-none"
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label className="text-muted small fw-bold">EMAIL ADDRESS</Form.Label>
                            <Form.Control
                                type="email"
                                placeholder="name@company.com"
                                value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                                className="bg-dark text-light border-secondary shadow-none"
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label className="text-muted small fw-bold">PASSWORD {editMode && <span className="text-warning fw-normal ms-1">(Leave blank to keep current)</span>}</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder={editMode ? "Enter new password..." : "Enter password"}
                                value={form.password}
                                onChange={e => setForm({ ...form, password: e.target.value })}
                                className="bg-dark text-light border-secondary shadow-none"
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label className="text-muted small fw-bold">ASSIGN ROLE</Form.Label>
                            <Form.Select
                                value={form.roleId}
                                onChange={e => setForm({ ...form, roleId: e.target.value })}
                                className="bg-dark text-light border-secondary shadow-none"
                            >
                                <option value="">-- Select Role --</option>
                                {rolesList.map(r => (
                                    <option key={r.id} value={r.id} style={{ textTransform: "capitalize" }}>
                                        {r.name}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer className="border-top border-secondary">
                        <Button variant="outline-secondary" onClick={() => setShowModal(false)} className="border-0">
                            Cancel
                        </Button>
                        <Button type="submit" className="btn-gradient border-0 px-4">
                            {editMode ? "Save Changes" : "Create User"}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
}
