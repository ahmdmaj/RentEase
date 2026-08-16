import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { signIn, profile } = useAuth();
    const navigate = useNavigate();

    // Redirect if already logged in as admin
    React.useEffect(() => {
        if (profile?.role === 'admin') {
            navigate('/');
        }
    }, [profile, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const { error } = await signIn(email, password);

        if (error) {
            setError(error.message);
            setLoading(false);
            return;
        }

        setLoading(false);
    };

    return (
        <div className="login-container">
            {/* Decorative blobs */}
            <div className="login-blob login-blob--tl" />
            <div className="login-blob login-blob--br" />

            <div className="login-card">
                {/* Logo area */}
                <div className="login-logo-area">
                    <div className="login-logo-icon">🚗</div>
                    <div>
                        <h1 className="login-title">RentEase</h1>
                        <p className="login-badge">Admin Portal</p>
                    </div>
                </div>

                <p className="login-subtitle">Sign in to manage your platform</p>

                {error && (
                    <div className="login-error">
                        <span className="login-error-icon">⚠️</span>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <div className="input-wrapper">
                            <span className="input-icon">✉️</span>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@rentease.com"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <div className="input-wrapper">
                            <span className="input-icon">🔒</span>
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••••"
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword((v) => !v)}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                tabIndex={0}
                            >
                                {showPassword ? (
                                    // Eye-off SVG
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                                        <line x1="1" y1="1" x2="23" y2="23"/>
                                    </svg>
                                ) : (
                                    // Eye SVG
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                        <circle cx="12" cy="12" r="3"/>
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? (
                            <span className="login-btn-loading">
                                <span className="spinner" /> Signing in…
                            </span>
                        ) : (
                            'Sign In to Dashboard'
                        )}
                    </button>
                </form>

                <p className="login-footer-note">
                    🔒 Secured access — authorised personnel only
                </p>
            </div>
        </div>
    );
}