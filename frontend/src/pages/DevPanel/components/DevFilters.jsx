import React from 'react';
import { FiSearch, FiDownload } from "react-icons/fi";

const DevFilters = ({ searchTerm, setSearchTerm, sortBy, setSortBy, dateRange, setDateRange, handleExport, exporting, setCurrentPage }) => {
    return (
        <div className="row g-3 mb-4 align-items-center">
            <div className="col-md-6">
                <div style={{ position: 'relative' }}>
                    <FiSearch style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <input
                        type="text"
                        className="glass dev-search-input"
                        placeholder="Search business, admin or email..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    />
                </div>
            </div>
            <div className="col-md-6 d-flex gap-3 justify-content-md-end flex-wrap">
                <select
                    className="glass dev-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                >
                    <option value="revenue">Sort: Highest Revenue</option>
                    <option value="users">Sort: Most Users</option>
                    <option value="sales">Sort: Total Sales</option>
                    <option value="date">Sort: Newest First</option>
                </select>

                <select
                    className="glass dev-select"
                    value={dateRange}
                    onChange={(e) => { setDateRange(e.target.value); setCurrentPage(1); }}
                >
                    <option value="today">Period: Today</option>
                    <option value="7days">Period: Last 7 Days</option>
                    <option value="30days">Period: Last 30 Days</option>
                    <option value="thisMonth">Period: This Month</option>
                </select>

                <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="btn-export"
                >
                    {exporting ? <div className="spinner-border spinner-border-sm" role="status"></div> : <FiDownload />}
                    Export CSV
                </button>
            </div>
        </div>
    );
};

export default DevFilters;
