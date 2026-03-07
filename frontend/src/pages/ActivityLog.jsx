import { useState } from "react";
import { Container, Row, Col, Card, Form, Button, Badge, Spinner } from "react-bootstrap";
import PaginationControl from "../components/PaginationControl";
import { fetchActivityModules, fetchActivityLogs, exportActivityLogs } from "../api/activityApi";
import { useAuth } from "../auth/AuthContext";
import { toast } from "react-toastify";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import Skeleton from "../components/Skeleton";

export default function ActivityLog() {
    const { token } = useAuth();
    const [filters, setFilters] = useState({
        module: "",
        userName: "",
        startDate: "",
        endDate: ""
    });
    const [page, setPage] = useState(1);
    const [exporting, setExporting] = useState(false);

    const { data: modulesData } = useQuery({
        queryKey: ["activityModules"],
        queryFn: async () => {
            const res = await fetchActivityModules(token);
            return res.data || [];
        },
        enabled: !!token
    });

    const { data: logsData, isLoading: loading } = useQuery({
        queryKey: ["activityLogs", page, filters],
        queryFn: async () => {
            const res = await fetchActivityLogs({
                page,
                limit: 12,
                ...filters
            }, token);
            return res.data;
        },
        enabled: !!token,
        placeholderData: keepPreviousData
    });

    const logs = logsData?.data || [];
    const pagination = logsData?.pagination || { page: 1, pages: 1, total: 0, limit: 12 };
    const availableModules = modulesData || [];

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
    };

    const resetFilters = () => {
        setFilters({ module: "", userName: "", startDate: "", endDate: "" });
        setPage(1);
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const response = await exportActivityLogs(filters, token);
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
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
                <div>
                    <h2 className="page-title text-white mb-0">System Activity Log</h2>
                    <p className="text-muted small">Track every action across the POS system</p>
                </div>
                <Button
                    variant="outline-success"
                    className="d-flex align-items-center justify-content-center gap-2"
                    onClick={handleExport}
                    disabled={exporting}
                >
                    {exporting ? <Spinner size="sm" /> : <i className="bi bi-download"></i>}
                    Export CSV
                </Button>
            </div>

            <Card className="glass shadow-soft border-0 mb-4 p-3">
                <Form onSubmit={handleSearch}>
                    <Row className="g-3 align-items-end">
                        <Col xs={12} md={3}>
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
                        <Col xs={12} md={3}>
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
                        <Col xs={6} md={2}>
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
                        <Col xs={6} md={2}>
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
                        <Col xs={12} md={2} className="d-flex gap-2">
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

            <div className="table-darkx">
                <div className="table-responsive">
                    <table className="table table-borderless table-hover mb-0">
                        <thead>
                            <tr className="text-nowrap">
                                <th className="px-4 py-3">TIME</th>
                                <th className="px-4 py-3">USER</th>
                                <th className="px-4 py-3">ROLE</th>
                                <th className="px-4 py-3">MODULE</th>
                                <th className="px-4 py-3">ACTION</th>
                                <th className="px-4 py-3">DETAILS</th>
                                <th className="px-4 py-3 text-end pe-4">IP ADDRESS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && logs.length === 0 ? (
                                [...Array(8)].map((_, i) => (
                                    <tr key={i}>
                                        <td className="px-4 py-3"><Skeleton width="120px" /></td>
                                        <td className="px-4 py-3"><Skeleton width="100px" /></td>
                                        <td className="px-4 py-3"><Skeleton width="80px" /></td>
                                        <td className="px-4 py-3"><Skeleton width="100px" /></td>
                                        <td className="px-4 py-3"><Skeleton width="80px" /></td>
                                        <td className="px-4 py-3"><Skeleton width="220px" /></td>
                                        <td className="px-4 py-3 text-end"><Skeleton width="100px" className="ms-auto" /></td>
                                    </tr>
                                ))
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-5 text-muted">No logs found</td>
                                </tr>
                            ) : (
                                logs.map(log => (
                                    <tr key={log.id}>
                                        <td className="px-4 py-3 align-middle small text-white">
                                            {new Date(log.createdAt).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 align-middle">
                                            <div className="fw-bold text-white">{log.userName || `User #${log.userId}`}</div>
                                            {log.userName && <div className="text-muted small" style={{ fontSize: '10px' }}>ID: {log.userId}</div>}
                                        </td>
                                        <td className="px-4 py-3 align-middle small text-capitalize text-white-50">{log.userRole}</td>
                                        <td className="px-4 py-3 align-middle">{getModuleBadge(log.module)}</td>
                                        <td className="px-4 py-3 align-middle">{getActionBadge(log.action)}</td>
                                        <td className="px-4 py-3 align-middle">
                                            <div style={{ maxWidth: '300px' }} className="text-truncate text-white-50" title={log.details}>
                                                {log.details}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-end align-middle small text-muted pe-4">
                                            {log.ipAddress || '—'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <PaginationControl
                pagination={pagination}
                setPage={setPage}
            />
        </Container>
    );
}
