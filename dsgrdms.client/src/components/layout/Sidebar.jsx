import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    ShieldCheck,
    ClipboardList,
    Settings,
    LogOut,
    FileText,
    MessageSquare,
} from 'lucide-react';
import { useT } from '../../hooks/useT';
import { useAuth } from '../../context/AuthContext';
import { useEffect, useState } from 'react';
import { fetchUnreadCount } from '../../services/messagesApi';
import './Sidebar.css';

export default function Sidebar() {
    const t = useT();
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();
    const [unread, setUnread] = useState(0);

    // Fetch unread count for growers
    useEffect(() => {
        if (user?.role !== 'grower' || !token) return;
        fetchUnreadCount(token)
            .then(data => setUnread(data.count ?? 0))
            .catch(() => {});
    }, [user, token]);

    const adminNav = [
        { to: '/',             label: t.nav.dashboard,   icon: LayoutDashboard },
        { to: '/growers',      label: t.nav.growers,     icon: Users           },
        { to: '/compliance',   label: t.nav.compliance,  icon: ShieldCheck     },
        { to: '/field-visits', label: t.nav.fieldVisits, icon: ClipboardList   },
        { to: '/messages',     label: 'Messages',        icon: MessageSquare   },
    ];
    const fieldOfficerNav = [
        { to: '/growers',      label: t.nav.growers,     icon: Users         },
        { to: '/field-visits', label: t.nav.fieldVisits, icon: ClipboardList },
        { to: '/compliance',   label: t.nav.compliance,  icon: ShieldCheck   },
        { to: '/messages',     label: 'Messages',        icon: MessageSquare },
    ];
    const growerNav = [
        { to: '/my-application', label: 'My Application', icon: FileText       },
        { to: '/messages',       label: 'Messages',        icon: MessageSquare, badge: unread > 0 ? unread : null },
    ];

    const navItems =
        user?.role === 'admin'        ? adminNav
      : user?.role === 'field_officer' ? fieldOfficerNav
      : growerNav;

    const roleLabel =
        user?.role === 'admin'        ? 'Admin'
      : user?.role === 'field_officer' ? 'Field Officer'
      : 'Grower';

    const initials = user?.name
        ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
        : '?';

    function handleLogout() {
        logout();
        navigate('/');
    }

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <img src="/logo.png" alt="Glad Business Development Consultancy" className="sidebar-logo" />
                <span className="sidebar-brand-name">DSGRDMS</span>
            </div>

            <nav className="sidebar-nav">
                {navItems.map(({ to, label, icon: Icon, badge }) => (
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
                        {badge && <span className="sidebar-badge">{badge > 99 ? '99+' : badge}</span>}
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-user">
                    <div className="sidebar-avatar">{initials}</div>
                    <div className="sidebar-user-info">
                        <span className="sidebar-user-name">{user?.name ?? '—'}</span>
                        <span className="sidebar-user-role">{roleLabel}</span>
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
                    <button className="sidebar-link sidebar-logout" onClick={handleLogout}>
                        <LogOut size={18} />
                        <span>{t.nav.logout}</span>
                    </button>
                </div>
            </div>
        </aside>
    );
}
