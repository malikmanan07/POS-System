import React, { useState, useEffect } from 'react';
import { Modal, Tabs, Tab, Table, Badge } from 'react-bootstrap';
import { FiUser, FiLogIn, FiTrendingUp, FiShoppingBag, FiUsers, FiClock, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { getBusinessDetails } from "../../../api/devApi";
import { useQuery, keepPreviousData } from "@tanstack/react-query";

const BusinessDetailsModal = ({ show, onHide, business, handleImpersonate }) => {
    const [salesPage, setSalesPage] = useState(1);
    const [productsPage, setProductsPage] = useState(1);
    const [usersPage, setUsersPage] = useState(1);
    const [shiftsPage, setShiftsPage] = useState(1);

    const { data, isPlaceholderData, isLoading, isFetching } = useQuery({
        queryKey: ["business-details", business?.id, salesPage, productsPage, usersPage, shiftsPage],
        queryFn: async () => {
            if (!business?.id) return null;
            const res = await getBusinessDetails(business.id, {
                salesPage, productsPage, usersPage, shiftsPage,
                limit: 8
            });
            return res.data;
        },
        enabled: !!business?.id && show,
        placeholderData: keepPreviousData,
        staleTime: 5000
    });

    const details = data || {};
    const pagination = details.pagination || {};

    useEffect(() => {
        if (show) {
            setSalesPage(1);
            setProductsPage(1);
            setUsersPage(1);
            setShiftsPage(1);
        }
    }, [business?.id, show]);

    const TableSkeleton = ({ rows = 5 }) => (
        <div className="skeleton-table">
            {[...Array(rows)].map((_, i) => (
                <div key={i} className="skeleton-row mb-3" style={{ height: '50px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', opacity: 1 - (i * 0.15) }}></div>
            ))}
        </div>
    );

    const Paginator = ({ current, total, onPageChange }) => (
        <div className="d-flex justify-content-end align-items-center gap-3 mt-4 px-2">
            <span className="text-muted small fw-bold">Page {current} of {total || 1}</span>
            <div className="d-flex gap-2">
                <button
                    disabled={current <= 1 || isFetching}
                    onClick={() => onPageChange(current - 1)}
                    className="pagination-btn"
                >
                    <FiChevronLeft />
                </button>
                <button
                    disabled={current >= total || isFetching}
                    onClick={() => onPageChange(current + 1)}
                    className="pagination-btn"
                >
                    <FiChevronRight />
                </button>
            </div>
        </div>
    );

    const formatDateTime = (dateStr) => {
        if (!dateStr) return '—';
        const date = new Date(dateStr);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    return (
        <Modal
            show={show}
            onHide={onHide}
            size="xl"
            centered
            contentClassName="dev-modal-content shadow-2xl"
        >
            <Modal.Header closeButton closeVariant="white" className="border-0 pb-0">
                <Modal.Title className="text-white fw-bold d-flex align-items-center gap-3">
                    <div className="business-avatar">
                        {business?.name?.charAt(0)}
                    </div>
                    <div>
                        <div className="modal-title-text">{business?.name}</div>
                        <div className="modal-subtitle-text">
                            Dynamic Analytics Portal • {business?.currency} Stats
                        </div>
                    </div>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4 pt-2">
                <Tabs defaultActiveKey="sales" className="custom-dev-tabs mb-4 border-0">
                    <Tab eventKey="sales" title={<span><FiTrendingUp className="me-2" /> Sales</span>}>
                        {isLoading && !data ? <TableSkeleton /> : (
                            <div className={`tab-content-wrapper ${isFetching ? 'fetching' : ''}`}>
                                <div className="glass-table-container">
                                    <Table responsive borderless className="m-0 custom-glass-table">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>CASHIER</th>
                                                <th>CUSTOMER</th>
                                                <th>TOTAL</th>
                                                <th>DATE</th>
                                                <th className="text-center">STATUS</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {details?.recentSales?.map(sale => (
                                                <tr key={sale.id}>
                                                    <td className="text-indigo fw-bold">#{sale.id}</td>
                                                    <td>{sale.userName}</td>
                                                    <td>{sale.customerName || <span className="text-muted opacity-50 italic">Walk-in</span>}</td>
                                                    <td className="fw-bold text-white">{business?.currency} {parseFloat(sale.total).toLocaleString()}</td>
                                                    <td className="text-muted small">{formatDateTime(sale.createdAt)}</td>
                                                    <td className="text-center">
                                                        <Badge bg={sale.status === 'completed' ? 'success' : 'danger'} className="status-badge">
                                                            {sale.status.toUpperCase()}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            ))}
                                            {details?.recentSales?.length === 0 && (
                                                <tr><td colSpan="6" className="text-center py-5 text-muted opacity-50">No transactions recorded.</td></tr>
                                            )}
                                        </tbody>
                                    </Table>
                                </div>
                                <Paginator current={salesPage} total={pagination.salesTotalPages} onPageChange={setSalesPage} />
                            </div>
                        )}
                    </Tab>

                    <Tab eventKey="products" title={<span><FiShoppingBag className="me-2" /> Products</span>}>
                        {isLoading && !data ? <TableSkeleton /> : (
                            <div className={`tab-content-wrapper ${isFetching ? 'fetching' : ''}`}>
                                <div className="row g-4">
                                    {details?.topProducts?.map((product, idx) => (
                                        <div key={idx} className="col-md-6 col-lg-4">
                                            <div className="product-stat-card glass p-4 h-100">
                                                <div className="d-flex justify-content-between align-items-start mb-3">
                                                    <div className="fw-bold text-white fs-5">{product.name}</div>
                                                    <div className="rank-chip">Rank #{(productsPage - 1) * 8 + idx + 1}</div>
                                                </div>
                                                <div className="stats-row">
                                                    <div className="stat-box">
                                                        <span className="label">Qty</span>
                                                        <span className="value text-white">{product.totalQty}</span>
                                                    </div>
                                                    <div className="stat-box">
                                                        <span className="label">Revenue</span>
                                                        <span className="value text-emerald">{business?.currency} {parseFloat(product.totalRevenue).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {details?.topProducts?.length === 0 && (
                                        <div className="col-12 text-center py-5 text-muted">No product movements detected.</div>
                                    )}
                                </div>
                                <Paginator current={productsPage} total={pagination.productsTotalPages} onPageChange={setProductsPage} />
                            </div>
                        )}
                    </Tab>

                    <Tab eventKey="users" title={<span><FiUsers className="me-2" /> Staff</span>}>
                        {isLoading && !data ? <TableSkeleton /> : (
                            <div className={`tab-content-wrapper ${isFetching ? 'fetching' : ''}`}>
                                <div className="row g-3">
                                    {details?.users?.map(user => (
                                        <div key={user.id} className="col-md-6">
                                            <div className="staff-card glass p-4 d-flex align-items-center gap-4">
                                                <div className="staff-icon">
                                                    <FiUser className="text-indigo fs-3" />
                                                </div>
                                                <div className="flex-grow-1">
                                                    <div className="d-flex align-items-center gap-2 mb-1">
                                                        <span className="fw-bold text-white fs-5">{user.name}</span>
                                                        <Badge bg="indigo-soft" className="role-badge">{user.role}</Badge>
                                                    </div>
                                                    <div className="text-muted small">{user.email}</div>
                                                </div>
                                                <div className="text-end d-none d-sm-block">
                                                    <div className="text-muted x-small text-uppercase fw-800 m-0">Joined</div>
                                                    <div className="text-white small fw-bold">{new Date(user.createdAt).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {details?.users?.length === 0 && (
                                        <div className="col-12 text-center py-5 text-muted">No staff members found.</div>
                                    )}
                                </div>
                                <Paginator current={usersPage} total={pagination.usersTotalPages} onPageChange={setUsersPage} />
                            </div>
                        )}
                    </Tab>

                    <Tab eventKey="shifts" title={<span><FiClock className="me-2" /> Shifts</span>}>
                        {isLoading && !data ? <TableSkeleton /> : (
                            <div className={`tab-content-wrapper ${isFetching ? 'fetching' : ''}`}>
                                <div className="glass-table-container">
                                    <Table responsive borderless className="m-0 custom-glass-table">
                                        <thead>
                                            <tr>
                                                <th>OPERATOR</th>
                                                <th>START</th>
                                                <th>END</th>
                                                <th>SESSION REVENUE</th>
                                                <th className="text-center">STATUS</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {details?.shifts?.map(shift => (
                                                <tr key={shift.id}>
                                                    <td className="fw-bold text-white">{shift.userName}</td>
                                                    <td className="text-muted small">{formatDateTime(shift.startTime)}</td>
                                                    <td className="text-muted small">
                                                        {shift.endTime ? formatDateTime(shift.endTime) : <Badge bg="success-soft text-emerald">LIVE SESSION</Badge>}
                                                    </td>
                                                    <td className="fw-bold text-emerald">{business?.currency} {parseFloat(shift.totalSales || 0).toLocaleString()}</td>
                                                    <td className="text-center">
                                                        <div className="d-flex align-items-center justify-content-center gap-2">
                                                            <div className={`status-dot ${shift.status === 'active' ? 'pulse-green' : 'dimmed'}`}></div>
                                                            <span className="small text-uppercase fw-bold text-muted" style={{ fontSize: '10px' }}>{shift.status}</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {details?.shifts?.length === 0 && (
                                                <tr><td colSpan="5" className="text-center py-5 text-muted opacity-50">Logbook empty.</td></tr>
                                            )}
                                        </tbody>
                                    </Table>
                                </div>
                                <Paginator current={shiftsPage} total={pagination.shiftsTotalPages} onPageChange={setShiftsPage} />
                            </div>
                        )}
                    </Tab>
                </Tabs>
            </Modal.Body>
            <Modal.Footer className="border-0 pt-0 px-4 pb-4 bg-transparent">
                <button
                    className="btn btn-primary rounded-pill px-5 py-3 shadow-glow"
                    onClick={() => handleImpersonate(business.id)}
                    disabled={business?.isSuspended}
                    style={{
                        background: business?.isSuspended ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                        border: 'none',
                        fontWeight: '800',
                        opacity: business?.isSuspended ? 0.3 : 1,
                        cursor: business?.isSuspended ? 'not-allowed' : 'pointer'
                    }}
                    title={business?.isSuspended ? "Business Account is Suspended" : "Enter Subsystem"}
                >
                    {business?.isSuspended ? 'SUBSYSTEM RESTRICTED' : 'ENTER SUBSYSTEM'} <FiLogIn className="ms-2" />
                </button>
                <button className="btn btn-outline-light rounded-pill px-4 py-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }} onClick={onHide}>
                    CLOSE DOCK
                </button>
            </Modal.Footer>
        </Modal>
    );
};

export default BusinessDetailsModal;
