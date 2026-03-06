import React from 'react';
import { FiActivity, FiLogOut } from "react-icons/fi";

const DevNavbar = ({ loading, handleLogout }) => {
    return (
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
                    <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px', color: 'white' }}>Master Console</h1>
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
                        gap: '8px',
                        transition: '0.3s'
                    }}
                    className="cursor-pointer hover-danger"
                >
                    <FiLogOut /> Exit Panel
                </button>
            </div>
        </nav>
    );
};

export default DevNavbar;
