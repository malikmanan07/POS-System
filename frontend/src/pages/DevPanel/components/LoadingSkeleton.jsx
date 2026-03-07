import React from 'react';
import { FiActivity } from "react-icons/fi";

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
            <div className="glass p-4 mb-5" style={{ borderRadius: '24px', height: '450px', background: 'rgba(255,255,255,0.02)' }}>
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
                <div key={i} className="glass mb-4" style={{ borderRadius: '24px', height: '350px', background: 'rgba(255,255,255,0.02)' }}></div>
            ))}
        </main>
    </div>
);

export default LoadingSkeleton;
