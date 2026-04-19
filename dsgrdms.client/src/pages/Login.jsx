import { useState } from 'react';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { friendlyError } from '../utils/apiErrors';
import './Login.css';

export default function Login() {
    const { login } = useAuth();
    const { showError } = useNotification();

    const [email,    setEmail]    = useState('');
    const [password, setPassword] = useState('');
    const [showPwd,  setShowPwd]  = useState(false);
    const [loading,  setLoading]  = useState(false);
    const [errors,   setErrors]   = useState({});

    function validate() {
        const errs = {};
        if (!email.trim())    errs.email    = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = 'Enter a valid email';
        if (!password)        errs.password = 'Password is required';
        return errs;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }

        setLoading(true);
        try {
            await login(email.trim(), password);
            // AuthContext updates → App re-renders with the app layout
        } catch (err) {
            showError(friendlyError(err));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="login-page">
            <div className="login-card">
                {/* Logo / Brand */}
                <div className="login-brand">
                    <img src="/logo.png" alt="DSGRDMS" className="login-logo" onError={e => { e.currentTarget.style.display = 'none'; }} />
                    <h1 className="login-title">DSGRDMS</h1>
                    <p className="login-subtitle">Grower Registration &amp; Management System</p>
                </div>

                <form className="login-form" onSubmit={handleSubmit} noValidate>
                    {/* Email */}
                    <div className={`login-field ${errors.email ? 'has-error' : ''}`}>
                        <label>Email Address</label>
                        <input
                            type="email"
                            className="login-input"
                            placeholder="you@example.com"
                            value={email}
                            onChange={e => { setEmail(e.target.value); setErrors(p => { const n={...p}; delete n.email; return n; }); }}
                            autoComplete="email"
                            autoFocus
                        />
                        {errors.email && <span className="login-error">{errors.email}</span>}
                    </div>

                    {/* Password */}
                    <div className={`login-field ${errors.password ? 'has-error' : ''}`}>
                        <label>Password</label>
                        <div className="login-password-wrap">
                            <input
                                type={showPwd ? 'text' : 'password'}
                                className="login-input"
                                placeholder="Enter your password"
                                value={password}
                                onChange={e => { setPassword(e.target.value); setErrors(p => { const n={...p}; delete n.password; return n; }); }}
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                className="login-eye"
                                onClick={() => setShowPwd(v => !v)}
                                tabIndex={-1}
                                aria-label={showPwd ? 'Hide password' : 'Show password'}
                            >
                                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {errors.password && <span className="login-error">{errors.password}</span>}
                    </div>

                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? 'Signing in…' : <><LogIn size={15} /> Sign In</>}
                    </button>
                </form>

                {/* Demo credentials hint */}
                <div className="login-demo-hint">
                    <p className="login-demo-title">Demo credentials</p>
                    <table className="login-demo-table">
                        <tbody>
                            <tr>
                                <td>Admin</td>
                                <td>admin@demo.com</td>
                                <td>Admin123!</td>
                            </tr>
                            <tr>
                                <td>Field Officer</td>
                                <td>officer@demo.com</td>
                                <td>Officer123!</td>
                            </tr>
                            <tr>
                                <td>Grower</td>
                                <td>grower@demo.com</td>
                                <td>Grower123!</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
