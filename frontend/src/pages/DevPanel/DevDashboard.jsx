import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { toast } from "react-toastify";

// API & Context
import { getDevDashboardStats, impersonateBusiness, exportDevDashboardStats, toggleBusinessStatus } from "../../api/devApi";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";

// Components
import DevNavbar from "./components/DevNavbar";
import PerformanceMatrix from "./components/PerformanceMatrix";
import BusinessCard from "./components/BusinessCard";
import BusinessDetailsModal from "./components/BusinessDetailsModal";
import LoadingSkeleton from "./components/LoadingSkeleton";
import ConfirmationModal from "./components/ConfirmationModal";
import DevFilters from "./components/DevFilters";
import DevPagination from "./components/DevPagination";

// Styles
import "../../styles/DevDashboard.css";

export default function DevDashboard() {
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("revenue");
    const [currentPage, setCurrentPage] = useState(1);
    const [dateRange, setDateRange] = useState("7days");
    const [confirmAction, setConfirmAction] = useState({ show: false, businessId: null, isSuspended: false, businessName: '' });
    const [graphView, setGraphView] = useState("revenue"); // 'revenue' or 'signups'
    const [exporting, setExporting] = useState(false);
    const [selectedBusiness, setSelectedBusiness] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [lastAlertBusiness, setLastAlertBusiness] = useState(null);
    const itemsPerPage = 3;

    const navigate = useNavigate();
    const { setAuthData } = useAuth();
    const devToken = localStorage.getItem("dev_token");

    // Queries
    const { data: dashboardData, isLoading: loading, refetch } = useQuery({
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

    const {
        businesses = [],
        topPerformingBusinesses = [],
        networkRevenueBreakdown = [],
        signupTrend = [],
        latestRegistration = null,
        totalPages = 0,
        totalItems = 0
    } = dashboardData || {};

    // Notifications and Auth check
    useEffect(() => {
        if (latestRegistration && (!lastAlertBusiness || lastAlertBusiness !== latestRegistration.name)) {
            if (lastAlertBusiness) {
                toast.info(`🚀 New business registered: ${latestRegistration.name}`, {
                    position: "top-right",
                    autoClose: 5000,
                    theme: "dark",
                });
            }
            setLastAlertBusiness(latestRegistration.name);
        }
    }, [latestRegistration, lastAlertBusiness]);

    useEffect(() => {
        if (!devToken) {
            navigate("/dev-panel");
        }
    }, [devToken, navigate]);

    // Handlers
    const handleLogout = () => {
        localStorage.removeItem("dev_token");
        localStorage.removeItem("dev_user");
        delete api.defaults.headers.common.Authorization;
        navigate("/dev-panel");
    };

    const openBusinessModal = (business) => {
        setSelectedBusiness(business);
        setShowModal(true);
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

    const handleToggleStatus = async (businessId, isSuspended) => {
        try {
            await toggleBusinessStatus(businessId, isSuspended);
            toast.success(isSuspended ? "Business SUSPENDED 🛡️" : "Business ACTIVATED ✅");
            setConfirmAction({ show: false, businessId: null, isSuspended: false, businessName: '' });
            refetch();
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to toggle status");
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

    // Memoized Data
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

    const topBusinessesNames = useMemo(() => topPerformingBusinesses.map(b => b.name), [topPerformingBusinesses]);

    // Helpers
    const chartColors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444', '#06b6d4', '#f43f5e', '#84cc16', '#eab308'];
    const getChartColor = (i) => chartColors[i % chartColors.length];

    if (loading && businesses.length === 0) return <LoadingSkeleton />;

    return (
        <div className="dev-dashboard-root">
            <DevNavbar loading={loading} handleLogout={handleLogout} />

            <main className="container py-5">
                <PerformanceMatrix
                    graphView={graphView}
                    setGraphView={setGraphView}
                    dateRange={dateRange}
                    totalItems={totalItems}
                    networkRevenueBreakdown={networkRevenueBreakdown}
                    signupTrend={signupTrend}
                    performanceDataTrend={performanceDataTrend}
                    topBusinessesNames={topBusinessesNames}
                    getChartColor={getChartColor}
                />

                <DevFilters
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                    dateRange={dateRange}
                    setDateRange={setDateRange}
                    handleExport={handleExport}
                    exporting={exporting}
                    setCurrentPage={setCurrentPage}
                />

                {/* Business List */}
                <div className="row g-4">
                    {businesses.length > 0 ? (
                        businesses.map((business, index) => (
                            <BusinessCard
                                key={business.id}
                                business={business}
                                index={index}
                                currentPage={currentPage}
                                itemsPerPage={itemsPerPage}
                                openBusinessModal={openBusinessModal}
                                handleImpersonate={handleImpersonate}
                                handleToggleStatus={(id, status, name) => setConfirmAction({ show: true, businessId: id, isSuspended: status, businessName: name })}
                                getCurrencySymbol={(currency) => currency === 'PKR' ? 'Rs' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$'}
                            />
                        ))
                    ) : (
                        <div className="text-center py-5">
                            <p style={{ color: '#64748b' }}>No businesses found matching your criteria.</p>
                        </div>
                    )}
                </div>

                <DevPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    setCurrentPage={setCurrentPage}
                />
            </main>

            <BusinessDetailsModal
                show={showModal}
                onHide={() => setShowModal(false)}
                business={selectedBusiness}
                handleImpersonate={handleImpersonate}
            />

            <ConfirmationModal
                show={confirmAction.show}
                onHide={() => setConfirmAction({ ...confirmAction, show: false })}
                onConfirm={() => handleToggleStatus(confirmAction.businessId, confirmAction.isSuspended)}
                isSuspended={confirmAction.isSuspended}
                businessName={confirmAction.businessName}
            />
        </div>
    );
}
