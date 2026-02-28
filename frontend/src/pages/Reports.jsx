import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Table, Form, Button, Spinner, Badge } from "react-bootstrap";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { toast } from "react-toastify";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell
} from 'recharts';

const KPI = ({ title, value, icon, color }) => (
    <Card className="glass shadow-soft border-0 h-100 p-3">
        <div className="d-flex align-items-center justify-content-between">
            <div>
                <p className="text-muted small mb-1">{title}</p>
                <h4 className="fw-bold text-white mb-0">{value}</h4>
            </div>
            <div className="rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                style={{ width: '45px', height: '45px', backgroundColor: 'rgba(255,255,255,0.05)', color }}>
                <i className={`bi ${icon} fs-4`}></i>
            </div>
        </div>
    </Card>
);

const CustomTooltip = ({ active, payload, label, currencySymbol }) => {
    if (active && payload && payload.length) {
        return (
            <div className="glass p-3 rounded border-0 shadow-lg" style={{ backgroundColor: "rgba(15, 23, 42, 0.95)" }}>
                <p className="fw-bold text-white mb-1">{label}</p>
                <p className="mb-0 fw-bold fs-5" style={{ color: "#22c55e" }}>
                    {currencySymbol}{parseFloat(payload[0].value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
            </div>
        );
    }
    return null;
};

export default function Reports() {
    const { token } = useAuth();
    const { currencySymbol } = useSettings();
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [data, setData] = useState({
        summary: { totalSales: 0, totalRevenue: 0, totalCustomers: 0, avgOrderValue: 0 },
        chartData: [],
        topProducts: [],
        customerStats: []
    });

    const [filters, setFilters] = useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams(filters).toString();
            const res = await api.get(`/api/reports/analytics?${queryParams}`);
            setData(res.data);
        } catch (err) {
            toast.error("Failed to load analytics");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchAnalytics();
    };

    const handleExportCsv = async () => {
        setExporting(true);
        try {
            const queryParams = new URLSearchParams(filters).toString();
            const response = await api.get(`/api/reports/export-csv?${queryParams}`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `sales_report_${filters.startDate}_to_${filters.endDate}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            toast.error("Export failed");
        } finally {
            setExporting(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading && !data.chartData.length) {
        return (
            <div className="d-flex justify-content-center align-items-center h-100">
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    return (
        <Container fluid className="py-4 report-container">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4 no-print">
                <div>
                    <h2 className="page-title text-white mb-0">Reports & Analytics</h2>
                    <p className="text-muted small">Deep dive into your business performance</p>
                </div>
                <div className="d-flex gap-2">
                    <Button variant="outline-primary" onClick={handlePrint}>
                        <i className="bi bi-file-earmark-pdf me-2"></i> Export PDF
                    </Button>
                    <Button variant="outline-success" onClick={handleExportCsv} disabled={exporting}>
                        {exporting ? <Spinner size="sm" /> : <i className="bi bi-file-earmark-spreadsheet me-2"></i>}
                        Export CSV
                    </Button>
                </div>
            </div>

            {/* Print Header (Visible only on print) */}
            <div className="d-none d-print-block mb-4">
                <h1 className="text-dark">Business Performance Report</h1>
                <p className="text-secondary">Period: {filters.startDate} to {filters.endDate}</p>
                <hr />
            </div>

            {/* Filters */}
            <Card className="glass shadow-soft border-0 mb-4 p-3 no-print">
                <Form onSubmit={handleSearch}>
                    <Row className="g-3 align-items-end">
                        <Col md={4}>
                            <Form.Label className="text-muted small">From Date</Form.Label>
                            <Form.Control
                                type="date"
                                name="startDate"
                                value={filters.startDate}
                                onChange={handleFilterChange}
                                className="bg-dark text-white border-secondary"
                            />
                        </Col>
                        <Col md={4}>
                            <Form.Label className="text-muted small">To Date</Form.Label>
                            <Form.Control
                                type="date"
                                name="endDate"
                                value={filters.endDate}
                                onChange={handleFilterChange}
                                className="bg-dark text-white border-secondary"
                            />
                        </Col>
                        <Col md={4}>
                            <Button type="submit" variant="primary" className="w-100" disabled={loading}>
                                {loading ? <Spinner size="sm" /> : <><i className="bi bi-filter me-2"></i>Apply Filters</>}
                            </Button>
                        </Col>
                    </Row>
                </Form>
            </Card>

            {/* KPI Cards */}
            <Row className="g-3 mb-4">
                <Col md={3}>
                    <KPI
                        title="Total Sales"
                        value={data.summary.totalSales}
                        icon="bi-receipt"
                        color="#6d5efc"
                    />
                </Col>
                <Col md={3}>
                    <KPI
                        title="Total Revenue"
                        value={`${currencySymbol}${parseFloat(data.summary.totalRevenue).toLocaleString()}`}
                        icon="bi-currency-dollar"
                        color="#22c55e"
                    />
                </Col>
                <Col md={3}>
                    <KPI
                        title="Total Customers"
                        value={data.summary.totalCustomers}
                        icon="bi-people"
                        color="#06b6d4"
                    />
                </Col>
                <Col md={3}>
                    <KPI
                        title="Avg Order Value"
                        value={`${currencySymbol}${parseFloat(data.summary.avgOrderValue).toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                        icon="bi-calculator"
                        color="#f59e0b"
                    />
                </Col>
            </Row>

            {/* Daily Revenue Chart */}
            <Row className="mb-4">
                <Col lg={12}>
                    <Card className="glass shadow-soft border-0 p-4">
                        <h6 className="fw-bold text-white mb-4">Daily Revenue Trend</h6>
                        <div style={{ width: "100%", height: 350 }}>
                            <ResponsiveContainer>
                                <AreaChart data={data.chartData}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 12 }} />
                                    <YAxis stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 12 }} tickFormatter={(val) => `${currencySymbol}${val}`} />
                                    <Tooltip content={<CustomTooltip currencySymbol={currencySymbol} />} />
                                    <Area type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={3} fill="url(#colorRevenue)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Tables Section */}
            <Row className="g-4">
                {/* Best Selling Products */}
                <Col lg={6}>
                    <Card className="glass shadow-soft border-0 h-100 overflow-hidden">
                        <div className="p-3 bg-black d-flex justify-content-between align-items-center">
                            <h6 className="fw-bold text-white mb-0">Best Selling Products</h6>
                            <Badge bg="success">Top 10</Badge>
                        </div>
                        <div className="table-responsive">
                            <Table hover variant="dark" className="mb-0">
                                <thead>
                                    <tr>
                                        <th className="ps-3">Product Name</th>
                                        <th>Qty Sold</th>
                                        <th className="pe-3 text-end">Revenue</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.topProducts.map(p => (
                                        <tr key={p.id}>
                                            <td className="ps-3 fw-bold">{p.name}</td>
                                            <td>{p.qtySold}</td>
                                            <td className="pe-3 text-end text-success fw-bold">
                                                {currencySymbol}{parseFloat(p.revenue).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                    {data.topProducts.length === 0 && (
                                        <tr><td colSpan="3" className="text-center py-4 text-muted">No data available</td></tr>
                                    )}
                                </tbody>
                            </Table>
                        </div>
                    </Card>
                </Col>

                {/* Customer Breakdown */}
                <Col lg={6}>
                    <Card className="glass shadow-soft border-0 h-100 overflow-hidden">
                        <div className="p-3 bg-black d-flex justify-content-between align-items-center">
                            <h6 className="fw-bold text-white mb-0">Customer Breakdown</h6>
                            <Badge bg="info">Top Spenders</Badge>
                        </div>
                        <div className="table-responsive">
                            <Table hover variant="dark" className="mb-0">
                                <thead>
                                    <tr>
                                        <th className="ps-3">Customer Name</th>
                                        <th>Orders</th>
                                        <th className="pe-3 text-end">Total Spent</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.customerStats.map(c => (
                                        <tr key={c.id}>
                                            <td className="ps-3 fw-bold">{c.name}</td>
                                            <td>{c.totalOrders}</td>
                                            <td className="pe-3 text-end text-info fw-bold">
                                                {currencySymbol}{parseFloat(c.totalSpent).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                    {data.customerStats.length === 0 && (
                                        <tr><td colSpan="3" className="text-center py-4 text-muted">No data available</td></tr>
                                    )}
                                </tbody>
                            </Table>
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Print Friendly Styles */}
            <style>
                {`
                @media print {
                    body { background: white !important; color: black !important; }
                    .glass { background: white !important; border: 1px solid #ddd !important; box-shadow: none !important; }
                    .text-white, .page-title { color: black !important; }
                    .text-muted { color: #666 !important; }
                    .no-print { display: none !important; }
                    .report-container { padding: 0 !important; }
                    .card { margin-bottom: 20px !important; break-inside: avoid; }
                    .recharts-area-path { fill: #eee !important; cursor: default; }
                    .recharts-curve { stroke: #333 !important; }
                    table { color: black !important; border-top: 2px solid black !important; }
                    th { background-color: #f0f0f0 !important; color: black !important; }
                    td { border-bottom: 1px solid #eee !important; }
                    h4, h6 { color: black !important; }
                    .badge { border: 1px solid #333 !important; color: black !important; background: transparent !important; }
                }
                `}
            </style>
        </Container>
    );
}
