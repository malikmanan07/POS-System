import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Table, Form, Button, Badge, Spinner } from "react-bootstrap";
import PaginationControl from "../components/PaginationControl";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { toast } from "react-toastify";

export default function ActivityLog() {
    const { token } = useAuth();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [filters, setFilters] = useState({
        module: "",
        userName: "",
        startDate: "",
        endDate: ""
    });
    const [pagination, setPagination] = useState({
        page: 1,
        pages: 1,
        total: 0,
        limit: 12
    });
    const [availableModules, setAvailableModules] = useState([]);

    const fetchModules = async () => {
        try {
            const res = await api.get("/api/activity/modules");
            setAvailableModules(res.data);
        } catch (err) {
            console.error("Failed to fetch modules", err);
        }
    };

    const fetchLogs = async (page = 1, overriddenFilters = null) => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page,
                limit: 12,
                ...(overriddenFilters || filters)
            }).toString();

            const res = await api.get(`/api/activity?${queryParams}`);
            setLogs(res.data.data);
            setPagination(res.data.pagination);
        } catch (err) {
            toast.error("Failed to fetch activity logs");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs(1);
        fetchModules();
    }, []);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchLogs(1);
    };

    const resetFilters = () => {
        const emptyFilters = { module: "", userName: "", startDate: "", endDate: "" };
        setFilters(emptyFilters);
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchLogs(1, emptyFilters);
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const queryParams = new URLSearchParams(filters).toString();
            const response = await api.get(`/api/activity/export?${queryParams}`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'activity_logs.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            toast.error("Export failed");
        } finally {
            setExporting(false);
        }
    };

    const getModuleBadge = (module) => {
        const colors = {
            'SALES': 'success',
            'PRODUCTS': 'primary',
            'CATEGORIES': 'warning text-dark',
            'CUSTOMERS': 'info',
            'INVENTORY': 'secondary',
            'USERS': 'dark',
            'AUTH': 'danger',
            'ROLES': 'info',
            'ACCESS': 'primary',
            'SETTINGS': 'secondary'
        };
        return <Badge bg={colors[module] || 'dark'}>{module}</Badge>;
    };

    const getActionBadge = (action) => {
        let variant = 'light';
        if (action === 'DELETE') variant = 'danger';
        else if (action === 'LOGIN') variant = 'success';
        else if (action === 'RETURN') variant = 'warning';
        else if (action === 'BULK_IMPORT' || action === 'IMPORT') variant = 'info';

        return <Badge bg={variant} text={(variant === 'light' || variant === 'warning' || variant === 'info') ? 'dark' : 'white'}>{action}</Badge>;
    };

    return (
        <Container fluid className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="page-title text-white mb-0">System Activity Log</h2>
                    <p className="text-muted small">Track every action across the POS system</p>
                </div>
                <Button
                    variant="outline-success"
                    className="d-flex align-items-center gap-2"
                    onClick={handleExport}
                    disabled={exporting}
                >
                    {exporting ? <Spinner size="sm" /> : <i className="bi bi-download"></i>}
                    Export CSV
                </Button>
            </div>

            {/* Filters */}
            <Card className="glass shadow-soft border-0 mb-4 p-3">
                <Form onSubmit={handleSearch}>
                    <Row className="g-3 align-items-end">
                        <Col md={3}>
                            <Form.Label className="text-muted small">Module</Form.Label>
                            <Form.Select
                                name="module"
                                value={filters.module}
                                onChange={handleFilterChange}
                                className="bg-dark text-white border-secondary text-capitalize"
                            >
                                <option value="">All Modules</option>
                                {availableModules.filter(m => m).map(mod => (
                                    <option key={mod} value={mod}>
                                        {mod.charAt(0).toUpperCase() + mod.slice(1).toLowerCase()}
                                    </option>
                                ))}
                            </Form.Select>
                        </Col>
                        <Col md={3}>
                            <Form.Label className="text-muted small">User Name</Form.Label>
                            <Form.Control
                                type="text"
                                name="userName"
                                placeholder="Search by name..."
                                value={filters.userName}
                                onChange={handleFilterChange}
                                className="bg-dark text-white border-secondary"
                            />
                        </Col>
                        <Col md={2}>
                            <Form.Label className="text-muted small">From</Form.Label>
                            <Form.Control
                                type="date"
                                name="startDate"
                                value={filters.startDate}
                                onChange={handleFilterChange}
                                className="bg-dark text-white border-secondary text-sm"
                                style={{ fontSize: '0.85rem' }}
                            />
                        </Col>
                        <Col md={2}>
                            <Form.Label className="text-muted small">To</Form.Label>
                            <Form.Control
                                type="date"
                                name="endDate"
                                value={filters.endDate}
                                onChange={handleFilterChange}
                                className="bg-dark text-white border-secondary text-sm"
                                style={{ fontSize: '0.85rem' }}
                            />
                        </Col>
                        <Col md={2} className="d-flex gap-2">
                            <Button type="submit" variant="primary" className="flex-grow-1">
                                <i className="bi bi-search"></i>
                            </Button>
                            <Button variant="outline-secondary" onClick={resetFilters}>
                                <i className="bi bi-arrow-clockwise"></i>
                            </Button>
                        </Col>
                    </Row>
                </Form>
            </Card>

            {/* Table */}
            <Card className="glass shadow-soft border-0 overflow-hidden">
                <div className="table-responsive">
                    <Table hover variant="dark" className="mb-0">
                        <thead className="bg-black">
                            <tr>
                                <th className="ps-4">Time</th>
                                <th>User</th>
                                <th>Role</th>
                                <th>Module</th>
                                <th>Action</th>
                                <th>Details</th>
                                <th className="pe-4 text-end">IP Address</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-5">
                                        <Spinner animation="border" variant="primary" />
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-5 text-muted">No logs found</td>
                                </tr>
                            ) : (
                                logs.map(log => (
                                    <tr key={log.id}>
                                        <td className="ps-4 small">
                                            {new Date(log.createdAt).toLocaleString()}
                                        </td>
                                        <td>
                                            <div className="fw-bold">{log.userName || `User #${log.userId}`}</div>
                                            {log.userName && <div className="text-muted small" style={{ fontSize: '10px' }}>ID: {log.userId}</div>}
                                        </td>
                                        <td className="small text-capitalize">{log.userRole}</td>
                                        <td>{getModuleBadge(log.module)}</td>
                                        <td>{getActionBadge(log.action)}</td>
                                        <td>
                                            <div style={{ maxWidth: '300px' }} className="text-truncate" title={log.details}>
                                                {log.details}
                                            </div>
                                        </td>
                                        <td className="pe-4 text-end small text-muted">
                                            {log.ipAddress || '—'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </Table>
                </div>
            </Card>

            <PaginationControl
                pagination={pagination}
                setPage={(p) => fetchLogs(p)}
            />
        </Container>
    );
}
