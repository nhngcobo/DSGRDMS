import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    ShieldCheck,
    Settings,
    LogOut,
} from 'lucide-react';
import { useT } from '../../hooks/useT';
import './Sidebar.css';

export default function Sidebar() {
    const t = useT();

    const navItems = [
        { to: '/',           label: t.nav.dashboard,  icon: LayoutDashboard },
        { to: '/growers',    label: t.nav.growers,    icon: Users },
        { to: '/compliance', label: t.nav.compliance, icon: ShieldCheck },
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <img src="/logo.png" alt="Glad Business Development Consultancy" className="sidebar-logo" />
                <span className="sidebar-brand-name">DSGRDMS</span>
            </div>

            <nav className="sidebar-nav">
                {navItems.map(({ to, label, icon: Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={to === '/'}
                        className={({ isActive }) =>
                            'sidebar-link' + (isActive ? ' active' : '')
                        }
                    >
                        <Icon size={18} />
                        <span>{label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-user">
                    <div className="sidebar-avatar">J</div>
                    <div className="sidebar-user-info">
                        <span className="sidebar-user-name">{t.user.name}</span>
                        <span className="sidebar-user-role">{t.user.role}</span>
                    </div>
                </div>
                <div className="sidebar-footer-links">
                    <NavLink
                        to="/settings"
                        className={({ isActive }) =>
                            'sidebar-link' + (isActive ? ' active' : '')
                        }
                    >
                        <Settings size={18} />
                        <span>{t.nav.settings}</span>
                    </NavLink>
                    <button className="sidebar-link sidebar-logout">
                        <LogOut size={18} />
                        <span>{t.nav.logout}</span>
                    </button>
                </div>
            </div>
        </aside>
    );
}
