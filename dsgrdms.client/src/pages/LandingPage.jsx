import { useState } from 'react';
import { LogIn, Eye, EyeOff, Users, ShieldCheck, ClipboardList, MessageSquare, BarChart2, FileText, ArrowRight, TreePine } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { friendlyError } from '../utils/apiErrors';
import './LandingPage.css';

const FEATURES = [
    {
        icon: Users,
        title: 'Grower Management',
        body: 'Register, track and manage all growers across your region from one centralised platform.',
        color: 'feat-green',
    },
    {
        icon: ShieldCheck,
        title: 'Compliance & Risk',
        body: 'Monitor document compliance, assign risk levels, and take action on gaps in real time.',
        color: 'feat-blue',
    },
    {
        icon: ClipboardList,
        title: 'Field Visits',
        body: 'Log field verification visits, record observations and track plantation conditions.',
        color: 'feat-amber',
    },
    {
        icon: MessageSquare,
        title: 'Messaging',
        body: 'Field officers can send direct messages to growers who receive them in their inbox.',
        color: 'feat-purple',
    },
    {
        icon: BarChart2,
        title: 'Analytics',
        body: 'Get a real-time overview of compliance rates, risk distribution and registration trends.',
        color: 'feat-pink',
    },
    {
        icon: FileText,
        title: 'Grower Portal',
        body: 'Growers can submit their own application, upload documents and track progress online.',
        color: 'feat-teal',
    },
];

export default function LandingPage() {
    const { login } = useAuth();
    const { showError } = useNotification();

    const [panelOpen, setPanelOpen] = useState(false);
    const [email,     setEmail]     = useState('');
    const [password,  setPassword]  = useState('');
    const [showPwd,   setShowPwd]   = useState(false);
    const [loading,   setLoading]   = useState(false);
    const [errors,    setErrors]    = useState({});

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
            await login(email.trim(), password);
        } catch (err) {
            showError(friendlyError(err));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="lp-root">
            {/* ── Nav ───────────────────────────────────── */}
            <header className="lp-nav">
                <div className="lp-nav-brand">
                    <div className="lp-nav-icon"><TreePine size={20} /></div>
                    <span className="lp-nav-name">DSGRDMS</span>
                </div>
                <button className="lp-nav-cta" onClick={() => setPanelOpen(true)}>
                    Sign In <ArrowRight size={14} />
                </button>
            </header>

            {/* ── Hero ──────────────────────────────────── */}
            <section className="lp-hero">
                <div className="lp-hero-inner">
                    <div className="lp-hero-badge">Deloitte · Sustainable Forestry</div>
                    <h1 className="lp-hero-headline">
                        Grower Registration &amp;<br />
                        Development Management
                    </h1>
                    <p className="lp-hero-sub">
                        A unified platform for field officers and administrators to register growers,
                        track compliance, log field visits and communicate — all in one place.
                    </p>
                    <div className="lp-hero-actions">
                        <button className="lp-btn-primary" onClick={() => setPanelOpen(true)}>
                            Get Started <ArrowRight size={15} />
                        </button>
                        <a className="lp-btn-ghost" href="#features">See features</a>
                    </div>
                    <div className="lp-hero-stats">
                        <div className="lp-stat"><span className="lp-stat-value">3</span><span className="lp-stat-label">User Roles</span></div>
                        <div className="lp-stat-div" />
                        <div className="lp-stat"><span className="lp-stat-value">12+</span><span className="lp-stat-label">Document Types</span></div>
                        <div className="lp-stat-div" />
                        <div className="lp-stat"><span className="lp-stat-value">100%</span><span className="lp-stat-label">Digitised</span></div>
                    </div>
                </div>
                <div className="lp-hero-art" aria-hidden="true">
                    <div className="lp-art-card lp-art-card-1">
                        <ShieldCheck size={22} />
                        <div>
                            <p className="lp-art-card-title">Compliance Rate</p>
                            <p className="lp-art-card-value">87%</p>
                        </div>
                    </div>
                    <div className="lp-art-card lp-art-card-2">
                        <Users size={22} />
                        <div>
                            <p className="lp-art-card-title">Active Growers</p>
                            <p className="lp-art-card-value">142</p>
                        </div>
                    </div>
                    <div className="lp-art-card lp-art-card-3">
                        <ClipboardList size={22} />
                        <div>
                            <p className="lp-art-card-title">Field Visits</p>
                            <p className="lp-art-card-value">38 this month</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Features ──────────────────────────────── */}
            <section className="lp-features" id="features">
                <div className="lp-section-label">Platform Features</div>
                <h2 className="lp-section-title">Everything you need, in one system</h2>
                <p className="lp-section-sub">
                    Designed for field officers, administrators, and growers—each with their own tailored view.
                </p>
                <div className="lp-feat-grid">
                    {FEATURES.map(({ icon: Icon, title, body, color }) => (
                        <div key={title} className="lp-feat-card">
                            <div className={`lp-feat-icon ${color}`}>
                                <Icon size={20} />
                            </div>
                            <h3 className="lp-feat-title">{title}</h3>
                            <p className="lp-feat-body">{body}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── CTA Banner ────────────────────────────── */}
            <section className="lp-cta-band">
                <div className="lp-cta-band-inner">
                    <div>
                        <h2 className="lp-cta-band-title">Ready to get started?</h2>
                        <p className="lp-cta-band-sub">Sign in to access your dashboard.</p>
                    </div>
                    <button className="lp-btn-primary lp-btn-light" onClick={() => setPanelOpen(true)}>
                        Sign In <ArrowRight size={15} />
                    </button>
                </div>
            </section>

            {/* ── Footer ────────────────────────────────── */}
            <footer className="lp-footer">
                <span>© {new Date().getFullYear()} Deloitte · Sustainable Grower Registration &amp; Development Management System</span>
            </footer>

            {/* ── Login slide-over panel ─────────────────── */}
            {panelOpen && (
                <div className="lp-panel-overlay" onClick={e => e.target === e.currentTarget && setPanelOpen(false)}>
                    <aside className="lp-panel">
                        <div className="lp-panel-header">
                            <div className="lp-panel-brand">
                                <div className="lp-nav-icon"><TreePine size={18} /></div>
                                <span>DSGRDMS</span>
                            </div>
                            <button className="lp-panel-close" onClick={() => setPanelOpen(false)} aria-label="Close">✕</button>
                        </div>

                        <div className="lp-panel-body">
                            <h2 className="lp-panel-title">Welcome back</h2>
                            <p className="lp-panel-sub">Sign in to your account to continue.</p>

                            <form className="lp-panel-form" onSubmit={handleSubmit} noValidate>
                                <div className={`lp-pfield ${errors.email ? 'has-error' : ''}`}>
                                    <label>Email Address</label>
                                    <input
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={e => { setEmail(e.target.value); setErrors(p => { const n = {...p}; delete n.email; return n; }); }}
                                        autoComplete="email"
                                        autoFocus
                                    />
                                    {errors.email && <span className="lp-perror">{errors.email}</span>}
                                </div>

                                <div className={`lp-pfield ${errors.password ? 'has-error' : ''}`}>
                                    <label>Password</label>
                                    <div className="lp-pwd-wrap">
                                        <input
                                            type={showPwd ? 'text' : 'password'}
                                            placeholder="Enter your password"
                                            value={password}
                                            onChange={e => { setPassword(e.target.value); setErrors(p => { const n = {...p}; delete n.password; return n; }); }}
                                            autoComplete="current-password"
                                        />
                                        <button type="button" className="lp-pwd-toggle" onClick={() => setShowPwd(s => !s)} aria-label="Toggle password">
                                            {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    {errors.password && <span className="lp-perror">{errors.password}</span>}
                                </div>

                                <button type="submit" className="lp-panel-submit" disabled={loading}>
                                    <LogIn size={16} />
                                    {loading ? 'Signing in…' : 'Sign In'}
                                </button>
                            </form>

                            <div className="lp-demo-table">
                                <p className="lp-demo-label">Demo credentials</p>
                                <table>
                                    <thead><tr><th>Role</th><th>Email</th><th>Password</th></tr></thead>
                                    <tbody>
                                        <tr><td>Admin</td><td>admin@demo.com</td><td>Admin123!</td></tr>
                                        <tr><td>Field Officer</td><td>officer@demo.com</td><td>Officer123!</td></tr>
                                        <tr><td>Grower</td><td>grower@demo.com</td><td>Grower123!</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </aside>
                </div>
            )}
        </div>
    );
}
