import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchBranchesList, createBranch, updateBranch, assignUserToBranch, removeUserFromBranch } from "../api/branchApi";
import { fetchUsersList } from "../api/userApi";
import { useAuth } from "../auth/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { Modal, Button, Form, Badge, Table, Pagination } from "react-bootstrap";
import { toast } from "react-toastify";
import Skeleton from "../components/Skeleton";

export default function Branches() {
    const { token } = useAuth();
    const { currencySymbol } = useSettings();
    const queryClient = useQueryClient();
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentBranch, setCurrentBranch] = useState(null);
    const [formData, setFormData] = useState({ name: "" });
    const [page, setPage] = useState(1);
    const limit = 10;

    const [showAssignModal, setShowAssignModal] = useState(false);
    const [assignData, setAssignData] = useState({ userId: "", businessId: "" });

    const { data: branchData, isLoading: loadingBranches } = useQuery({
        queryKey: ["branches", page],
        queryFn: async () => {
            const res = await fetchBranchesList(page, limit);
            return res.data;
        }
    });

    const branches = branchData?.data || [];
    const pagination = branchData?.pagination || {};

    const { data: users } = useQuery({
        queryKey: ["users-all"],
        queryFn: async () => {
            const res = await fetchUsersList(token);
            return res.data || [];
        }
    });

    const handleOpenAdd = () => {
        setEditMode(false);
        setFormData({ name: "" });
        setShowModal(true);
    };

    const handleOpenEdit = (b) => {
        setEditMode(true);
        setCurrentBranch(b);
        setFormData({ name: b.name });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editMode) {
                await updateBranch(currentBranch.id, formData);
                toast.success("Branch updated");
            } else {
                await createBranch(formData);
                toast.success("Branch created");
            }
            setShowModal(false);
            queryClient.invalidateQueries({ queryKey: ["branches"] });
        } catch (err) {
            toast.error(err.response?.data?.error || "Error saving branch");
        }
    };

    const handleOpenAssign = (b) => {
        setAssignData({ userId: "", businessId: b.id });
        setShowAssignModal(true);
    };

    const handleAssign = async (e) => {
        e.preventDefault();
        try {
            await assignUserToBranch(assignData);
            toast.success("User assigned to branch");
            setShowAssignModal(false);
        } catch (err) {
            toast.error(err.response?.data?.error || "Error assigning user");
        }
    };

    return (
        <div className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="page-title mb-1">Branch Management</h2>
                    <p className="text-white opacity-75 mb-0">Manage all your business locations</p>
                </div>
                <Button className="btn-gradient border-0 px-4" onClick={handleOpenAdd}>
                    <i className="bi bi-plus-lg me-2"></i> Add Branch
                </Button>
            </div>

            <div className="table-darkx">
                <Table responsive borderless hover className="mb-0">
                    <thead>
                        <tr>
                            <th className="px-4 py-3">BRANCH NAME</th>
                            <th className="px-4 py-3">STATUS</th>
                            <th className="px-4 py-3 text-center">TOTAL SALES</th>
                            <th className="px-4 py-3 text-center">TOTAL REVENUE</th>
                            <th className="px-4 py-3 text-end">ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loadingBranches ? (
                            [...Array(3)].map((_, i) => (
                                <tr key={i}>
                                    <td className="px-4 py-3"><Skeleton width="150px" /></td>
                                    <td className="px-4 py-3"><Skeleton width="80px" /></td>
                                    <td className="px-4 py-3 text-center"><Skeleton width="60px" className="mx-auto" /></td>
                                    <td className="px-4 py-3 text-center"><Skeleton width="100px" className="mx-auto" /></td>
                                    <td className="px-4 py-3 text-end"><Skeleton width="100px" className="ms-auto" /></td>
                                </tr>
                            ))
                        ) : (
                            branches.map(b => (
                                <tr key={b.id}>
                                    <td className="px-4 py-3 align-middle fw-bold text-white">{b.name}</td>
                                    <td className="px-4 py-3 align-middle">
                                        <Badge bg={b.isSuspended ? "danger" : "success"} className="px-3 py-2 rounded-pill">
                                            {b.isSuspended ? "Inactive" : "Active"}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 align-middle text-center text-white-50 small">
                                        {b.totalSales || 0} Orders
                                    </td>
                                    <td className="px-4 py-3 align-middle text-center text-success fw-bold">
                                        {currencySymbol}{parseFloat(b.totalRevenue || 0).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-end align-middle">
                                        <div className="d-flex justify-content-end gap-2">
                                            <Button variant="outline-primary" size="sm" onClick={() => handleOpenAssign(b)}>
                                                Assign Staff
                                            </Button>
                                            <Button variant="outline-light" size="sm" onClick={() => handleOpenEdit(b)}>
                                                Edit
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </Table>
            </div>

            {pagination.totalPages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                    <Pagination>
                        <Pagination.Prev
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                        />
                        {[...Array(pagination.totalPages)].map((_, i) => (
                            <Pagination.Item
                                key={i + 1}
                                active={i + 1 === page}
                                onClick={() => setPage(i + 1)}
                            >
                                {i + 1}
                            </Pagination.Item>
                        ))}
                        <Pagination.Next
                            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                            disabled={page === pagination.totalPages}
                        />
                    </Pagination>
                </div>
            )}

            {/* Branch Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered contentClassName="glass border-0">
                <Modal.Header closeButton closeVariant="white">
                    <Modal.Title>{editMode ? "Edit Branch" : "Add New Branch"}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body className="p-4">
                        <Form.Group className="mb-3">
                            <Form.Label className="text-muted small fw-bold">BRANCH NAME</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Store name / Location"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="bg-dark text-light border-secondary shadow-none"
                                required
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="outline-secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button type="submit" className="btn-gradient border-0 px-4">
                            {editMode ? "Save Changes" : "Create Branch"}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Assign Modal */}
            <Modal show={showAssignModal} onHide={() => setShowAssignModal(false)} centered contentClassName="glass border-0">
                <Modal.Header closeButton closeVariant="white">
                    <Modal.Title>Assign Staff to Branch</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleAssign}>
                    <Modal.Body className="p-4">
                        <Form.Group className="mb-3">
                            <Form.Label className="text-muted small fw-bold">SELECT USER (ADMIN/STAFF)</Form.Label>
                            <Form.Select
                                className="bg-dark text-light border-secondary shadow-none"
                                value={assignData.userId}
                                onChange={e => setAssignData({ ...assignData, userId: e.target.value })}
                                required
                            >
                                <option value="">-- Select User --</option>
                                {users?.map(u => (
                                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="outline-secondary" onClick={() => setShowAssignModal(false)}>Cancel</Button>
                        <Button type="submit" className="btn-gradient border-0 px-4">Assign Now</Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
}
