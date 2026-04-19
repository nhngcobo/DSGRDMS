import { useState } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';

export default function LandingLoginPanel({ isOpen, onClose, onSubmit }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    function validate() {
        const errs = {};
        if (!email.trim()) errs.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = 'Enter a valid email';
        if (!password) errs.password = 'Password is required';
        return errs;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }
        setLoading(true);
        try {
            await onSubmit(email.trim(), password);
        } catch (err) {
            // Error handled by parent
        } finally {
            setLoading(false);
        }
    }

    if (!isOpen) return null;

    return (
        <div className="lp-panel-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="lp-panel">
                <div className="lp-panel-header">
                    <h3 className="lp-panel-title">Sign In</h3>
                    <button className="lp-panel-close" onClick={onClose} aria-label="Close">
                        <X size={24} />
                    </button>
                </div>

                <form className="lp-panel-form" onSubmit={handleSubmit} noValidate>
                    <div className={`lp-form-field ${errors.email ? 'error' : ''}`}>
                        <label>Email Address</label>
                        <input
                            type="email"
                            placeholder="agronomist@example.com"
                            value={email}
                            onChange={e => { setEmail(e.target.value); setErrors(p => { const n = {...p}; delete n.email; return n; }); }}
                            autoComplete="email"
                            autoFocus
                        />
                        {errors.email && <span className="lp-error">{errors.email}</span>}
                    </div>

                    <div className={`lp-form-field ${errors.password ? 'error' : ''}`}>
                        <label>Password</label>
                        <div className="lp-pwd-wrap">
                            <input
                                type={showPwd ? 'text' : 'password'}
                                placeholder="••••••••"
                                value={password}
                                onChange={e => { setPassword(e.target.value); setErrors(p => { const n = {...p}; delete n.password; return n; }); }}
                                autoComplete="current-password"
                            />
                            <button type="button" className="lp-pwd-toggle" onClick={() => setShowPwd(s => !s)}>
                                {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {errors.password && <span className="lp-error">{errors.password}</span>}
                    </div>

                    <button type="submit" className="lp-form-submit" disabled={loading}>
                        {loading ? 'Signing in…' : 'Authorise Access'}
                    </button>
                </form>

                <div className="lp-demo-section">
                    <p className="lp-demo-label">Sandbox Access</p>
                    <table className="lp-demo-table">
                        <thead>
                            <tr>
                                <th>Role</th>
                                <th>User</th>
                                <th>Pass</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="lp-role-admin">Admin</td>
                                <td>admin@demo.com</td>
                                <td>Admin123!</td>
                            </tr>
                            <tr>
                                <td className="lp-role-officer">Officer</td>
                                <td>officer@demo.com</td>
                                <td>Officer123!</td>
                            </tr>
                            <tr>
                                <td className="lp-role-grower">Grower</td>
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
