import React from 'react';
import { FiShield, FiShieldOff } from "react-icons/fi";

const ConfirmationModal = ({ show, onHide, onConfirm, isSuspended, businessName }) => {
    return (
        <div className={`confirmation-backdrop ${show ? 'show' : ''}`} onClick={onHide}>
            <div className={`glass confirmation-card ${show ? 'show' : ''}`} onClick={e => e.stopPropagation()}>
                <div className="text-center mb-4">
                    <div style={{
                        width: '80px', height: '80px', borderRadius: '50%',
                        background: isSuspended ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        border: `2px solid ${isSuspended ? '#ef4444' : '#10b981'}`,
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        color: isSuspended ? '#ef4444' : '#10b981',
                        fontSize: '32px', marginBottom: '20px',
                        boxShadow: `0 0 20px -5px ${isSuspended ? '#ef444450' : '#10b98150'}`
                    }}>
                        {isSuspended ? <FiShield /> : <FiShieldOff />}
                    </div>
                    <h4 style={{ color: 'white', fontWeight: '800', fontSize: '24px' }}>
                        {isSuspended ? 'Confirm Suspension' : 'Confirm Activation'}
                    </h4>
                    <p style={{ color: '#94a3b8', fontSize: '15px', marginTop: '10px' }}>
                        Are you sure you want to <strong>{isSuspended ? 'SUSPEND' : 'ACTIVATE'}</strong> <br />
                        <span style={{ color: 'white', fontWeight: '700' }}>"{businessName}"</span>?
                    </p>
                </div>
                <div className="d-flex gap-3">
                    <button
                        className="glass flex-grow-1"
                        style={{ padding: '15px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontWeight: '700' }}
                        onClick={onHide}
                    >Cancel</button>
                    <button
                        className="flex-grow-1"
                        style={{
                            padding: '15px', borderRadius: '16px', border: 'none',
                            background: isSuspended ? '#ef4444' : '#10b981',
                            color: 'white', fontWeight: '700', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                        }}
                        onClick={onConfirm}
                    >
                        Yes, Proceed
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
