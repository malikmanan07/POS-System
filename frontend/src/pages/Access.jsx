import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Form, Button, Card, Row, Col, Spinner } from "react-bootstrap";

export default function Access() {
    const { token } = useAuth();
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);

    const [selectedRoleId, setSelectedRoleId] = useState("");
    const [rolePermissions, setRolePermissions] = useState([]); // Array of IDs
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const API_PATH = "/api/roles";

    useEffect(() => {
        fetchRolesAndPermissions();
    }, []);

    const fetchRolesAndPermissions = async () => {
        try {
            setLoading(true);
            const [rolesRes, permsRes] = await Promise.all([
                api.get(API_PATH, { headers: { Authorization: `Bearer ${token}` } }),
                api.get(`${API_PATH}/permissions/all`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setRoles(rolesRes.data);
            setPermissions(permsRes.data);
        } catch (err) {
            toast.error("Failed to load data.");
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (e) => {
        const roleId = e.target.value;
        setSelectedRoleId(roleId);

        if (!roleId) {
            setRolePermissions([]);
            return;
        }

        try {
            const res = await api.get(`${API_PATH}/${roleId}/permissions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRolePermissions(res.data);
        } catch (err) {
            toast.error("Failed to fetch role permissions");
            setRolePermissions([]);
        }
    };

    const handlePermissionToggle = (permId) => {
        if (rolePermissions.includes(permId)) {
            setRolePermissions(rolePermissions.filter(id => id !== permId));
        } else {
            setRolePermissions([...rolePermissions, permId]);
        }
    };

    const handleSavePermissions = async () => {
        if (!selectedRoleId) return toast.error("Please select a role first");

        try {
            setSaving(true);
            await api.post(
                `${API_PATH}/${selectedRoleId}/permissions`,
                { permissions: rolePermissions },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("Successfully updated permissions for role");
        } catch (err) {
            toast.error("Failed to update permissions");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-4 h-100">
            <div className="mb-4">
                <h2 className="page-title mb-1">Access Control</h2>
                <p className="text-white mb-0">Manage permissions for different user roles</p>
            </div>

            {loading ? (
                <div className="text-center py-5">
                    <Spinner animation="border" variant="light" />
                </div>
            ) : (
                <Row>
                    <Col md={4} lg={3} className="mb-4">
                        <Card className="glass border-0 shadow-soft h-100">
                            <Card.Header className="bg-transparent border-bottom border-secondary pt-3 pb-3">
                                <h6 className="mb-0 text-white fw-bold">Select Role</h6>
                            </Card.Header>
                            <Card.Body>
                                <Form.Group>
                                    <Form.Select
                                        value={selectedRoleId}
                                        onChange={handleRoleChange}
                                        className="bg-dark text-light border-secondary shadow-none"
                                    >
                                        <option value="">-- Choose Role --</option>
                                        {roles.map(r => (
                                            <option key={r.id} value={r.id} style={{ textTransform: "capitalize" }}>
                                                {r.name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>

                                {selectedRoleId && (
                                    <div className="mt-4">
                                        <p className="text-light small">
                                            Select a role to view or modify its access levels across the system. Ensure you save changes after modifying permissions.
                                        </p>
                                        <Button
                                            className="btn-gradient w-100 border-0 shadow-none mt-2"
                                            onClick={handleSavePermissions}
                                            disabled={saving}
                                        >
                                            {saving ? (
                                                <><Spinner size="sm" className="me-2" /> Saving...</>
                                            ) : "Save Access"}
                                        </Button>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col md={8} lg={9}>
                        <Card className="glass border-0 shadow-soft h-100">
                            <Card.Header className="bg-transparent border-bottom border-secondary pt-3 pb-3">
                                <h6 className="mb-0 text-white fw-bold">Permissions</h6>
                            </Card.Header>
                            <Card.Body>
                                {!selectedRoleId ? (
                                    <div className="text-center text-muted py-5">
                                        <i className="bi bi-shield-lock fs-1 d-block mb-3"></i>
                                        Please select a role to manage its permissions
                                    </div>
                                ) : (
                                    <Row className="gy-3">
                                        {permissions.map(p => (
                                            <Col sm={6} md={6} lg={4} key={p.id}>
                                                <div
                                                    className="p-3 border rounded-3 d-flex align-items-center"
                                                    style={{
                                                        borderColor: "rgba(255,255,255,0.1)",
                                                        background: rolePermissions.includes(p.id) ? "rgba(34, 197, 94, 0.1)" : "rgba(255,255,255,0.02)",
                                                        cursor: "pointer",
                                                        transition: "all 0.2s"
                                                    }}
                                                    onClick={() => handlePermissionToggle(p.id)}
                                                >
                                                    <Form.Check
                                                        type="checkbox"
                                                        id={`perm-${p.id}`}
                                                        checked={rolePermissions.includes(p.id)}
                                                        onChange={() => { }} // Controlled by parent div click
                                                        className="mb-0 me-3"
                                                        style={{ pointerEvents: 'none' }}
                                                    />
                                                    <div>
                                                        <div className="text-white fw-bold" style={{ textTransform: "capitalize" }}>
                                                            {p.name.replace(/_/g, " ")}
                                                        </div>
                                                        <div className="text-muted small" style={{ fontSize: "0.75rem" }}>
                                                            {p.name}
                                                        </div>
                                                    </div>
                                                </div>
                                            </Col>
                                        ))}
                                    </Row>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}
        </div>
    );
}
