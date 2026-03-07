import React from 'react';
import { FiAward, FiCalendar, FiUser, FiLogIn, FiUsers, FiBox, FiTrendingUp, FiClock, FiDollarSign, FiShield, FiShieldOff } from "react-icons/fi";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import StatItem from './StatItem';

const BusinessCard = ({ business, index, currentPage, itemsPerPage, openBusinessModal, handleImpersonate, handleToggleStatus, getCurrencySymbol }) => {
    const actualRank = (currentPage - 1) * itemsPerPage + index + 1;

    return (
        <div className="col-12 mb-4">
            <div
                onClick={() => openBusinessModal(business)}
                className={`glass business-card-root ${business.isSuspended ? 'suspended-card' : ''}`}
            >
                {/* Ranking Badge */}
                {actualRank <= 3 && !business.isSuspended && (
                    <div
                        className="ranking-badge"
                        style={{
                            background: actualRank === 1 ? '#fbbf24' : actualRank === 2 ? '#cbd5e1' : '#ea580c',
                            color: actualRank === 1 ? '#78350f' : actualRank === 2 ? '#334155' : 'white',
                        }}
                    >
                        <FiAward /> #{actualRank} TOP PERFORMER
                    </div>
                )}

                {/* Suspended Badge */}
                {business.isSuspended && (
                    <div className="suspended-badge">
                        <FiShield /> ACCOUNT SUSPENDED
                    </div>
                )}

                <div className="p-4 p-md-5">
                    <div className="row">
                        {/* Left: Info */}
                        <div className="col-lg-4 mb-4 mb-lg-0">
                            <div className="mb-4">
                                <h2 style={{ fontSize: '32px', fontWeight: '800', color: 'white', marginBottom: '8px' }}>{business.name}</h2>
                                <div className="d-flex flex-wrap gap-3" style={{ color: '#94a3b8', fontSize: '14px' }}>
                                    <div className="d-flex align-items-center gap-2">
                                        <FiCalendar /> Joined: {new Date(business.createdAt).toLocaleDateString()}
                                    </div>
                                    {business.lastSaleAt ? (
                                        <div className="d-flex align-items-center gap-2" style={{ color: (new Date() - new Date(business.lastSaleAt)) > 24 * 60 * 60 * 1000 ? '#ef4444' : '#10b981' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor', boxShadow: '0 0 10px currentColor' }}></div>
                                            Last Sale: {new Date(business.lastSaleAt).toLocaleString()}
                                        </div>
                                    ) : (
                                        <div className="d-flex align-items-center gap-2" style={{ color: '#ef4444' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor' }}></div>
                                            No Sales Recorded
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Inactive Badge */}
                            {(!business.lastSaleAt || (new Date() - new Date(business.lastSaleAt)) > 24 * 60 * 60 * 1000) && !business.isSuspended && (
                                <div className="mb-4 d-inline-block" style={{
                                    padding: '4px 12px',
                                    borderRadius: '8px',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    color: '#ef4444',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    border: '1px solid rgba(239, 68, 68, 0.2)'
                                }}>
                                    INACTIVE (No sale in 24h)
                                </div>
                            )}

                            <div className="admin-info-box">
                                <p style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>Super Admin</p>
                                <div className="d-flex align-items-center gap-3">
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                        <FiUser />
                                    </div>
                                    <div>
                                        <p style={{ margin: 0, fontWeight: '700', fontSize: '15px', color: 'white' }}>{business.adminName || 'N/A'}</p>
                                        <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>{business.adminEmail || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="d-flex gap-2">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleImpersonate(business.id); }}
                                    className="btn-gradient flex-grow-1 py-3"
                                    style={{ borderRadius: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                                    disabled={business.isSuspended}
                                >
                                    <FiLogIn /> Access Account
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleStatus(business.id, !business.isSuspended, business.name);
                                    }}
                                    className="glass"
                                    style={{
                                        borderRadius: '14px',
                                        width: '54px',
                                        background: business.isSuspended ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.05)',
                                        border: `1px solid ${business.isSuspended ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
                                        color: business.isSuspended ? '#ef4444' : '#64748b',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: '0.3s'
                                    }}
                                    title={business.isSuspended ? "Reactivate Business" : "Suspend Business"}
                                >
                                    {business.isSuspended ? <FiShieldOff size={20} /> : <FiShield size={20} />}
                                </button>
                            </div>
                        </div>

                        {/* Middle: Stats */}
                        <div className="col-lg-4 mb-4 mb-lg-0">
                            <div className="row g-3 px-lg-3">
                                <StatItem icon={<FiUsers />} label="Users" value={business.usersCount} color="#3b82f6" />
                                <StatItem icon={<FiBox />} label="Products" value={business.productsCount} color="#a855f7" />
                                <StatItem icon={<FiTrendingUp />} label="Total Sales" value={business.salesCount} color="#10b981" />
                                <StatItem
                                    icon={<FiClock />}
                                    label="Today Sales"
                                    value={business.todaySalesCount || 0}
                                    color="#6366f1"
                                    subValue={`${getCurrencySymbol(business.currency)}${parseFloat(business.todayRevenue || 0).toLocaleString()}`}
                                />
                                <StatItem
                                    icon={<FiDollarSign />}
                                    label={`Revenue (${business.currency})`}
                                    value={`${getCurrencySymbol(business.currency)}${parseFloat(business.revenue).toLocaleString()}`}
                                    color="#f59e0b"
                                    isWide={true}
                                />
                            </div>
                        </div>

                        {/* Right: Chart */}
                        <div className="col-lg-4">
                            <div className="chart-container-box">
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <p style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', margin: 0 }}>7-Day Revenue Trend</p>
                                    <div className="chart-live-badge">
                                        LIVE
                                    </div>
                                </div>
                                <ResponsiveContainer width="100%" height="75%">
                                    <AreaChart data={business.chartData}>
                                        <defs>
                                            <linearGradient id={`grad-${business.id}`} x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="name" hide />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white' }}
                                        />
                                        <Area type="monotone" dataKey="revenue" stroke="#6366f1" fillOpacity={1} fill={`url(#grad-${business.id})`} strokeWidth={3} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BusinessCard;
