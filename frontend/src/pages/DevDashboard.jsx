import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getDevDashboardStats, impersonateBusiness, exportDevDashboardStats } from "../api/devApi";
import { toast } from "react-toastify";
import {
    FiUsers,
    FiBox,
    FiTrendingUp,
    FiDollarSign,
    FiLogIn,
    FiLogOut,
    FiAward,
    FiCalendar,
    FiUser,
    FiSearch,
    FiFilter,
    FiChevronLeft,
    FiChevronRight,
    FiActivity,
    FiClock,
    FiDownload
} from "react-icons/fi";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell
} from 'recharts';
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";

export default function DevDashboard() {
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("revenue");
    const [currentPage, setCurrentPage] = useState(1);
    const [dateRange, setDateRange] = useState("7days");
    const [exporting, setExporting] = useState(false);
    const itemsPerPage = 3;

    const navigate = useNavigate();
    const { setAuthData } = useAuth();

    // Dev Token handling
    const devToken = localStorage.getItem("dev_token");

    const { data: dashboardData, isLoading: loading } = useQuery({
        queryKey: ["dev-dashboard", searchTerm, sortBy, currentPage, dateRange],
        queryFn: async () => {
            if (devToken) {
                api.defaults.headers.common.Authorization = `Bearer ${devToken}`;
            }
            const res = await getDevDashboardStats({
                search: searchTerm,
                sortBy: sortBy,
                page: currentPage,
                limit: itemsPerPage,
                dateRange: dateRange
            });
            return res.data;
        },
        enabled: !!devToken,
        placeholderData: keepPreviousData,
        staleTime: 30000,
        retry: false
    });

    const businesses = dashboardData?.businesses || [];
    const topPerformingBusinesses = dashboardData?.topPerformingBusinesses || [];
    const networkRevenueBreakdown = dashboardData?.networkRevenueBreakdown || [];
    const totalPages = dashboardData?.totalPages || 1;
    const totalItems = dashboardData?.totalItems || 0;

    useEffect(() => {
        if (!devToken) {
            navigate("/dev-panel");
        }
    }, [devToken, navigate]);

    const handleLogout = () => {
        localStorage.removeItem("dev_token");
        localStorage.removeItem("dev_user");
        delete api.defaults.headers.common.Authorization;
        navigate("/dev-panel");
    };

    const handleImpersonate = async (businessId) => {
        try {
            const res = await impersonateBusiness(businessId);
            const { token, user, permissions } = res.data;
            setAuthData(user, token, permissions || []);
            toast.success(`Accessing ${user.name}'s account...`);
            navigate("/app");
        } catch (err) {
            toast.error(err.response?.data?.error || "Impersonation failed");
        }
    };

    const handleExport = async () => {
        try {
            setExporting(true);
            const res = await exportDevDashboardStats({ dateRange });
            const data = res.data;

            const headers = ["Business Name", "Admin Email", "Users", "Sales", "Revenue", "Currency", "Last Sale Date"];
            const csvRows = [
                headers.join(","),
                ...data.map(b => [
                    `"${b.name.replace(/"/g, '""')}"`,
                    `"${(b.adminEmail || '').replace(/"/g, '""')}"`,
                    b.usersCount,
                    b.salesCount,
                    b.revenue,
                    b.currency,
                    b.lastSaleAt ? `"${new Date(b.lastSaleAt).toLocaleString()}"` : '"Never"'
                ].join(","))
            ];

            const blob = new Blob([csvRows.join("\n")], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `Dev_Export_${dateRange}_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success("CSV Report downloaded!");
        } catch (err) {
            toast.error("Export failed");
        } finally {
            setExporting(false);
        }
    };

    // No longer needed due to server-side logic
    const currentItems = businesses;

    // Global Performance Chart Data (Aggregated Time Series for Top 5)
    const performanceDataTrend = useMemo(() => {
        if (topPerformingBusinesses.length === 0) return [];

        const dayLabels = topPerformingBusinesses[0]?.chartData?.map(d => d.name) || [];

        return dayLabels.map((day, i) => {
            const point = { name: day };
            topPerformingBusinesses.forEach(b => {
                point[b.name] = b.chartData[i]?.revenue || 0;
            });
            return point;
        });
    }, [topPerformingBusinesses]);

    const topBusinessesNames = useMemo(() => {
        return topPerformingBusinesses.map(b => b.name);
    }, [topPerformingBusinesses]);

    const chartColors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444', '#06b6d4', '#f43f5e', '#84cc16', '#eab308'];
    const getChartColor = (i) => chartColors[i % chartColors.length];

    const getCurrencySymbol = (currency) => {
        if (currency === 'PKR') return 'Rs';
        if (currency === 'EUR') return '€';
        if (currency === 'GBP') return '£';
        return '$';
    };

    const LoadingSkeleton = () => (
        <div style={{ height: '100vh', overflowY: 'auto', background: '#020617', color: '#e2e8f0', paddingBottom: '50px' }}>
            <nav className="glass py-3 px-4 sticky-top">
                <div className="container-fluid d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-3">
                        <div style={{ width: '40px', height: '40px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px' }}></div>
                        <div style={{ width: '150px', height: '24px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}></div>
                    </div>
                </div>
            </nav>
            <main className="container py-5">
                <div className="glass p-4 mb-5" style={{ borderRadius: '24px', height: '450px' }}>
                    <div className="d-flex justify-content-between mb-4">
                        <div style={{ width: '300px', height: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}></div>
                        <div className="d-flex gap-3">
                            <div style={{ width: '80px', height: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}></div>
                            <div style={{ width: '80px', height: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}></div>
                        </div>
                    </div>
                    <div style={{ width: '100%', height: '300px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}></div>
                </div>

                <div className="row g-3 mb-4">
                    <div className="col-md-6">
                        <div style={{ height: '50px', background: 'rgba(255,255,255,0.05)', borderRadius: '14px' }}></div>
                    </div>
                    <div className="col-md-6 d-flex justify-content-end">
                        <div style={{ width: '200px', height: '50px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}></div>
                    </div>
                </div>

                {[...Array(2)].map((_, i) => (
                    <div key={i} className="glass mb-4" style={{ borderRadius: '24px', height: '350px' }}></div>
                ))}
            </main>
        </div>
    );

    if (loading && businesses.length === 0) {
        return <LoadingSkeleton />;
    }

    return (
        <div style={{ height: '100vh', overflowY: 'auto', background: '#020617', color: '#e2e8f0', paddingBottom: '50px' }}>
            {/* Navbar */}
            <nav className="glass py-3 px-4 sticky-top">
                <div className="container-fluid d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-3">
                        <div style={{
                            padding: '10px',
                            background: 'rgba(99, 102, 241, 0.15)',
                            borderRadius: '12px',
                            border: '1px solid rgba(99, 102, 241, 0.3)'
                        }}>
                            <FiActivity style={{ color: '#6366f1', fontSize: '20px' }} />
                        </div>
                        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px' }}>Master Console</h1>
                        {loading && <div className="spinner-border spinner-border-sm text-primary ms-2" role="status"></div>}
                    </div>
                    <button
                        onClick={handleLogout}
                        style={{
                            background: 'rgba(255, 68, 68, 0.1)',
                            color: '#ff4444',
                            border: '1px solid rgba(255, 68, 68, 0.2)',
                            padding: '8px 16px',
                            borderRadius: '10px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                        className="cursor-pointer"
                    >
                        <FiLogOut /> Exit Panel
                    </button>
                </div>
            </nav>

            <main className="container py-5">
                {/* SECTION: Global Performance Graph (Multi-Line Area Chart) */}
                <div className="mb-5">
                    <div className="glass shadow-soft p-4" style={{ borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <div>
                                <h3 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>Network Performance Growth Matrix</h3>
                                <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>
                                    {dateRange === 'today' ? 'Today\'s performance' :
                                        dateRange === '30days' ? 'Last 30 days revenue trend' :
                                            dateRange === 'thisMonth' ? 'Current month performance' :
                                                '7-Day revenue comparison of all businesses'}
                                </p>
                            </div>
                            <div className="d-flex flex-wrap gap-4 align-items-center">
                                <div className="text-center px-3 border-end border-secondary border-opacity-25">
                                    <p style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginBottom: '2px' }}>Total Stores</p>
                                    <p style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>{totalItems}</p>
                                </div>
                                {networkRevenueBreakdown.map((item, idx) => (
                                    <div key={idx} className="text-center px-3">
                                        <p style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginBottom: '2px' }}>Total {item.currency}</p>
                                        <p style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#10b981' }}>
                                            {parseFloat(item.revenue).toLocaleString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div style={{ width: '100%', height: '350px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={performanceDataTrend}>
                                    <defs>
                                        {topBusinessesNames.map((name, i) => (
                                            <linearGradient key={`grad-${i}`} id={`grad-top-${i}`} x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={getChartColor(i)} stopOpacity={0.15} />
                                                <stop offset="95%" stopColor={getChartColor(i)} stopOpacity={0} />
                                            </linearGradient>
                                        ))}
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#475569"
                                        fontSize={11}
                                        tickLine={false}
                                        axisLine={false}
                                        padding={{ left: 10, right: 10 }}
                                    />
                                    <YAxis
                                        stroke="#475569"
                                        fontSize={11}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(val) => `${val > 1000 ? (val / 1000).toFixed(0) + 'k' : val}`}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                    />
                                    {topBusinessesNames.map((name, i) => (
                                        <Area
                                            key={name}
                                            type="monotone"
                                            dataKey={name}
                                            stroke={getChartColor(i)}
                                            fillOpacity={1}
                                            fill={`url(#grad-top-${i})`}
                                            strokeWidth={3}
                                            activeDot={{ r: 6 }}
                                        />
                                    ))}
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="d-flex justify-content-center flex-wrap gap-4 mt-3">
                            {topBusinessesNames.map((name, i) => (
                                <div key={name} className="d-flex align-items-center gap-2">
                                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: getChartColor(i) }}></div>
                                    <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>{name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* SECTION: Tools (Search, Filter, Sort) */}
                <div className="row g-3 mb-4 align-items-center">
                    <div className="col-md-6">
                        <div style={{ position: 'relative' }}>
                            <FiSearch style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                            <input
                                type="text"
                                className="glass w-100"
                                placeholder="Search business, admin or email..."
                                style={{
                                    borderRadius: '14px',
                                    padding: '12px 15px 12px 45px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'white',
                                    outline: 'none'
                                }}
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            />
                        </div>
                    </div>
                    <div className="col-md-6 d-flex gap-3 justify-content-md-end">
                        <div className="d-flex align-items-center gap-2">
                            <FiFilter style={{ color: '#64748b' }} />
                            <select
                                className="glass"
                                style={{
                                    borderRadius: '12px',
                                    padding: '10px 15px',
                                    background: 'rgba(30, 41, 59, 0.5)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'white',
                                    outline: 'none',
                                    fontSize: '14px'
                                }}
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="revenue">Sort: Highest Revenue</option>
                                <option value="users">Sort: Most Users</option>
                                <option value="sales">Sort: Total Sales</option>
                                <option value="date">Sort: Newest First</option>
                            </select>
                        </div>

                        <div className="d-flex align-items-center gap-2">
                            <FiClock style={{ color: '#64748b' }} />
                            <select
                                className="glass"
                                style={{
                                    borderRadius: '12px',
                                    padding: '10px 15px',
                                    background: 'rgba(30, 41, 59, 0.5)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'white',
                                    outline: 'none',
                                    fontSize: '14px'
                                }}
                                value={dateRange}
                                onChange={(e) => { setDateRange(e.target.value); setCurrentPage(1); }}
                            >
                                <option value="today">Period: Today</option>
                                <option value="7days">Period: Last 7 Days</option>
                                <option value="30days">Period: Last 30 Days</option>
                                <option value="thisMonth">Period: This Month</option>
                            </select>
                        </div>

                        <button
                            onClick={handleExport}
                            disabled={exporting}
                            className="glass"
                            style={{
                                padding: '10px 20px',
                                borderRadius: '12px',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                background: 'rgba(16, 185, 129, 0.1)',
                                color: '#10b981',
                                fontWeight: '700',
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            {exporting ? (
                                <div className="spinner-border spinner-border-sm" role="status"></div>
                            ) : (
                                <FiDownload />
                            )}
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* SECTION: Business List */}
                <div className="row g-4">
                    {currentItems.length > 0 ? (
                        currentItems.map((business, index) => {
                            const actualRank = (currentPage - 1) * itemsPerPage + index + 1;
                            return (
                                <div key={business.id} className="col-12 mb-4">
                                    <div
                                        className="glass shadow-soft"
                                        style={{
                                            borderRadius: '24px',
                                            overflow: 'hidden',
                                            border: '1px solid rgba(255, 255, 255, 0.05)',
                                            position: 'relative'
                                        }}
                                    >
                                        {/* Ranking Badge */}
                                        {actualRank <= 3 && (
                                            <div style={{
                                                position: 'absolute',
                                                top: 0,
                                                right: 0,
                                                padding: '8px 25px',
                                                borderBottomLeftRadius: '20px',
                                                fontWeight: '800',
                                                fontSize: '12px',
                                                textTransform: 'uppercase',
                                                letterSpacing: '1px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                background: actualRank === 1 ? '#fbbf24' : actualRank === 2 ? '#cbd5e1' : '#ea580c',
                                                color: actualRank === 1 ? '#78350f' : actualRank === 2 ? '#334155' : 'white',
                                                zIndex: 10
                                            }}>
                                                <FiAward /> #{actualRank} TOP PERFORMER
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
                                                    {(!business.lastSaleAt || (new Date() - new Date(business.lastSaleAt)) > 24 * 60 * 60 * 1000) && (
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

                                                    <div style={{
                                                        background: 'rgba(0,0,0,0.2)',
                                                        padding: '15px',
                                                        borderRadius: '16px',
                                                        border: '1px solid rgba(255,255,255,0.05)',
                                                        marginBottom: '25px'
                                                    }}>
                                                        <p style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>Super Admin</p>
                                                        <div className="d-flex align-items-center gap-3">
                                                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                                                <FiUser />
                                                            </div>
                                                            <div>
                                                                <p style={{ margin: 0, fontWeight: '700', fontSize: '15px' }}>{business.adminName || 'N/A'}</p>
                                                                <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>{business.adminEmail || 'N/A'}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => handleImpersonate(business.id)}
                                                        className="btn-gradient w-100 py-3"
                                                        style={{ borderRadius: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                                                    >
                                                        <FiLogIn /> Access Account
                                                    </button>
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
                                                    <div style={{
                                                        background: 'rgba(0,0,0,0.15)',
                                                        padding: '20px',
                                                        borderRadius: '20px',
                                                        height: '240px',
                                                        border: '1px solid rgba(255,255,255,0.03)'
                                                    }}>
                                                        <div className="d-flex justify-content-between align-items-center mb-4">
                                                            <p style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', margin: 0 }}>7-Day Revenue Trend</p>
                                                            <div style={{ padding: '4px 10px', borderRadius: '100px', background: '#10b98115', color: '#10b981', fontSize: '10px', fontWeight: '700' }}>
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
                                                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
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
                        })
                    ) : (
                        <div className="text-center py-5">
                            <p style={{ color: '#64748b' }}>No businesses found matching your criteria.</p>
                        </div>
                    )}
                </div>

                {/* SECTION: Pagination */}
                {totalPages > 1 && (
                    <div className="d-flex justify-content-center gap-2 mt-4">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                            className="glass"
                            style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', color: 'white', opacity: currentPage === 1 ? 0.3 : 1 }}
                        >
                            <FiChevronLeft />
                        </button>

                        {[...Array(totalPages)].map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentPage(i + 1)}
                                className="glass"
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'white',
                                    background: currentPage === i + 1 ? '#6366f1' : 'transparent',
                                    fontWeight: '700'
                                }}
                            >
                                {i + 1}
                            </button>
                        ))}

                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            className="glass"
                            style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', color: 'white', opacity: currentPage === totalPages ? 0.3 : 1 }}
                        >
                            <FiChevronRight />
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}

function StatItem({ icon, label, value, color, isWide = false, subValue = null }) {
    return (
        <div className={isWide ? "col-12" : "col-6"}>
            <div style={{
                padding: '18px 12px',
                textAlign: 'center',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.03)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
            }}>
                <div style={{
                    width: '32px',
                    height: '32px',
                    margin: '0 auto 10px',
                    background: `${color}15`,
                    color: color,
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {React.cloneElement(icon, { size: 16 })}
                </div>
                <p style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', margin: 0, letterSpacing: '0.5px' }}>{label}</p>
                <p style={{ fontSize: isWide ? '22px' : '17px', fontWeight: '800', color: 'white', margin: '4px 0 0 0' }}>{value}</p>
                {subValue && (
                    <p style={{ fontSize: '11px', fontWeight: '700', color: '#10b981', margin: '2px 0 0 0' }}>{subValue}</p>
                )}
            </div>
        </div>
    );
}
