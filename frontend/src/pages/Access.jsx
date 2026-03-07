import { useState } from "react";
import { toast } from "react-toastify";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchRolesList,
  fetchPermissionsAll,
  fetchRolePermissions,
  updateRolePermissions,
} from "../api/roleApi";
import { useAuth } from "../auth/AuthContext";
import { Form, Button, Card, Row, Col, Spinner } from "react-bootstrap";
import Skeleton from "../components/Skeleton";

export default function Access() {
  const { token, user, permissions: userPermissions } = useAuth();
  const queryClient = useQueryClient();

  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [rolePermissions, setRolePermissions] = useState([]); // Array of IDs
  const [saving, setSaving] = useState(false);

  const { data: rolesData, isLoading: loadingRoles } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const res = await fetchRolesList(token);
      return res.data || [];
    },
    enabled: !!token,
  });

  const { data: permissionsData, isLoading: loadingPermissions } = useQuery({
    queryKey: ["permissions"],
    queryFn: async () => {
      const res = await fetchPermissionsAll(token);
      return res.data || [];
    },
    enabled: !!token,
  });

  const roles = rolesData || [];
  const permissions = permissionsData || [];
  const loading = loadingRoles || loadingPermissions;

  const handleRoleChange = async (e) => {
    const roleId = e.target.value;
    setSelectedRoleId(roleId);

    if (!roleId) {
      setRolePermissions([]);
      return;
    }

    try {
      const res = await fetchRolePermissions(roleId, token);
      setRolePermissions(res.data);
    } catch (err) {
      toast.error("Failed to fetch role permissions");
      setRolePermissions([]);
    }
  };

  const isSuperAdmin = user?.roles?.some(
    (r) => r.toLowerCase() === "super admin",
  );
  const selectedRole = roles.find(
    (r) => r.id.toString() === selectedRoleId.toString(),
  );
  const isSelectedRoleSuperAdmin =
    selectedRole?.name?.toLowerCase() === "super admin";

  const isPermissionDisabled = (permName) => {
    if (isSelectedRoleSuperAdmin) return true;
    if (isSuperAdmin) return false;
    return !userPermissions.includes(permName);
  };

  const handlePermissionToggle = (perm) => {
    if (isPermissionDisabled(perm.name)) return;

    if (rolePermissions.includes(perm.id)) {
      setRolePermissions(rolePermissions.filter((id) => id !== perm.id));
    } else {
      setRolePermissions([...rolePermissions, perm.id]);
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedRoleId) return toast.error("Please select a role first");

    try {
      setSaving(true);
      await updateRolePermissions(selectedRoleId, rolePermissions, token);
      toast.success("Successfully updated permissions for role");
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
    } catch (err) {
      toast.error("Failed to update permissions");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 h-100">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h2 className="page-title mb-1 text-white">Access Control</h2>
          <p className="text-white opacity-75 mb-0">
            Manage permissions for different user roles
          </p>
        </div>
      </div>

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
                  disabled={loadingRoles}
                >
                  <option value="">-- Choose Role --</option>
                  {roles
                    .filter(
                      (r) =>
                        isSuperAdmin || r.name.toLowerCase() !== "super admin",
                    )
                    .map((r) => (
                      <option
                        key={r.id}
                        value={r.id}
                        style={{ textTransform: "capitalize" }}
                      >
                        {r.name}
                      </option>
                    ))}
                </Form.Select>
              </Form.Group>

              {selectedRoleId && (
                <div className="mt-4">
                  <p className="text-light small">
                    Select a role to view or modify its access levels across the
                    system. Ensure you save changes after modifying permissions.
                  </p>
                  <Button
                    className="btn-gradient w-100 border-0 shadow-none mt-2"
                    onClick={handleSavePermissions}
                    disabled={saving || isSelectedRoleSuperAdmin}
                  >
                    {saving ? (
                      <>
                        <Spinner size="sm" className="me-2" /> Saving...
                      </>
                    ) : (
                      "Save Access"
                    )}
                  </Button>
                  {isSelectedRoleSuperAdmin && (
                    <div className="mt-2 text-warning small text-center">
                      Super Admin permissions are locked and cannot be modified.
                    </div>
                  )}
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
                  {loadingPermissions
                    ? [...Array(12)].map((_, i) => (
                        <Col sm={6} md={6} lg={4} key={i}>
                          <div
                            className="p-3 border rounded-3 d-flex align-items-center"
                            style={{
                              borderColor: "rgba(255,255,255,0.1)",
                              background: "rgba(255,255,255,0.02)",
                            }}
                          >
                            <Skeleton width="100%" height="40px" />
                          </div>
                        </Col>
                      ))
                    : permissions.map((p) => (
                        <Col sm={6} md={6} lg={4} key={p.id}>
                          <div
                            className={`p-3 border rounded-3 d-flex align-items-center ${isPermissionDisabled(p.name) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                            style={{
                              borderColor: "rgba(255,255,255,0.1)",
                              background: rolePermissions.includes(p.id)
                                ? "rgba(34, 197, 94, 0.1)"
                                : "rgba(255,255,255,0.02)",
                              transition: "all 0.2s",
                            }}
                            onClick={() => handlePermissionToggle(p)}
                          >
                            <Form.Check
                              type="checkbox"
                              id={`perm-${p.id}`}
                              checked={rolePermissions.includes(p.id)}
                              disabled={isPermissionDisabled(p.name)}
                              onChange={() => {}} // Controlled by parent div click
                              className="mb-0 me-3"
                              style={{ pointerEvents: "none" }}
                            />
                            <div>
                              <div
                                className="text-white fw-bold"
                                style={{ textTransform: "capitalize" }}
                              >
                                {p.name.replace(/_/g, " ")}
                              </div>
                              <div
                                className="text-muted small"
                                style={{ fontSize: "0.75rem" }}
                              >
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
    </div>
  );
}
