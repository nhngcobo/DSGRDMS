import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    ShieldCheck,
    ClipboardList,
    Settings,
    LogOut,
    FileText,
} from 'lucide-react';
import { useT } from '../../hooks/useT';
import { useRole, ROLES } from '../../context/RoleContext';
import './Sidebar.css';

export default function Sidebar() {
    const t = useT();
    const { role, setRole } = useRole();

    const adminNav = [
        { to: '/',             label: t.nav.dashboard,   icon: LayoutDashboard },
        { to: '/growers',      label: t.nav.growers,     icon: Users           },
        { to: '/compliance',   label: t.nav.compliance,  icon: ShieldCheck     },
        { to: '/field-visits', label: t.nav.fieldVisits, icon: ClipboardList   },
    ];
    const fieldOfficerNav = [
        { to: '/growers',      label: t.nav.growers,     icon: Users         },
        { to: '/field-visits', label: t.nav.fieldVisits, icon: ClipboardList },
        { to: '/compliance',   label: t.nav.compliance,  icon: ShieldCheck   },
    ];
    const growerNav = [
        { to: '/my-application', label: 'My Application', icon: FileText },
    ];

    const navItems =
        role === 'admin'        ? adminNav
      : role === 'field_officer' ? fieldOfficerNav
      : growerNav;

    const currentRoleLabel = ROLES.find(r => r.key === role)?.label ?? role;
    const currentInitials  = ROLES.find(r => r.key === role)?.initials ?? '?';

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
                {/* Role switcher */}
                <div className="sidebar-role-switcher">
                    <label className="sidebar-role-label">Demo Role</label>
                    <select
                        className="sidebar-role-select"
                        value={role}
                        onChange={e => setRole(e.target.value)}
                    >
                        {ROLES.map(r => (
                            <option key={r.key} value={r.key}>{r.label}</option>
                        ))}
                    </select>
                </div>

                <div className="sidebar-user">
                    <div className="sidebar-avatar">{currentInitials}</div>
                    <div className="sidebar-user-info">
                        <span className="sidebar-user-name">{t.user.name}</span>
                        <span className="sidebar-user-role">{currentRoleLabel}</span>
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
