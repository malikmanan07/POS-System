import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { devLogin } from "../../api/devApi";
import { toast } from "react-toastify";
import { FiLock, FiMail, FiTerminal } from "react-icons/fi";
import { api } from "../../api/client";

export default function DevLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await devLogin(email, password);
            localStorage.setItem("dev_token", res.data.token);
            localStorage.setItem("dev_user", JSON.stringify(res.data.user));
            api.defaults.headers.common.Authorization = `Bearer ${res.data.token}`;
            toast.success("Welcome, Master Developer");
            navigate("/dev-panel/dashboard");
        } catch (err) {
            toast.error(err.response?.data?.error || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: '#020617',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            <div className="glass shadow-soft" style={{
                maxWidth: '450px',
                width: '100%',
                padding: '40px',
                borderRadius: '24px',
                background: 'rgba(30, 41, 59, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '35px' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        background: 'rgba(99, 102, 241, 0.1)',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 20px',
                        border: '1px solid rgba(99, 102, 241, 0.2)'
                    }}>
                        <FiTerminal style={{ fontSize: '30px', color: '#6366f1' }} />
                    </div>
                    <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'white', marginBottom: '8px', letterSpacing: '-0.5px' }}>Master Panel</h1>
                    <p style={{ color: '#64748b', fontSize: '14px' }}>Authorized Personnel Only</p>
                </div>

                <form onSubmit={handleLogin}>
                    <div className="mb-4">
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#94a3b8', marginBottom: '8px', marginLeft: '4px' }}>
                            Developer Email
                        </label>
                        <div style={{ position: 'relative' }}>
                            <FiMail style={{
                                position: 'absolute',
                                left: '14px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#64748b'
                            }} />
                            <input
                                type="email"
                                required
                                style={{
                                    width: '100%',
                                    background: 'rgba(0, 0, 0, 0.2)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '12px',
                                    padding: '12px 15px 12px 42px',
                                    color: 'white',
                                    outline: 'none',
                                    fontSize: '15px'
                                }}
                                className="form-input"
                                placeholder="developer@sys.admin"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#94a3b8', marginBottom: '8px', marginLeft: '4px' }}>
                            Access Key
                        </label>
                        <div style={{ position: 'relative' }}>
                            <FiLock style={{
                                position: 'absolute',
                                left: '14px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#64748b'
                            }} />
                            <input
                                type="password"
                                required
                                style={{
                                    width: '100%',
                                    background: 'rgba(0, 0, 0, 0.2)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '12px',
                                    padding: '12px 15px 12px 42px',
                                    color: 'white',
                                    outline: 'none',
                                    fontSize: '15px'
                                }}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-gradient w-100 py-3 mt-4"
                        style={{
                            borderRadius: '12px',
                            fontSize: '16px',
                            fontWeight: '700',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px'
                        }}
                    >
                        {loading ? (
                            <div className="spinner-border spinner-border-sm" role="status"></div>
                        ) : (
                            <>
                                Initialize Access
                                <FiTerminal />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
