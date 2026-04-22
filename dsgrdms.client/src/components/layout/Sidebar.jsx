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
    Sprout,
    Calendar,
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
        { to: '/',             label: 'Grower Overview', icon: Sprout },
        { to: '/growers',      label: 'Grower Registry',    icon: Users },
        { to: '/applications', label: 'Applications',       icon: FileText },
        { to: '/compliance',   label: 'Compliance Hub',     icon: ShieldCheck },
        { to: '/field-visits', label: 'Field Visit Coordination', icon: ClipboardList },
        { to: '/messages',     label: 'Messaging',          icon: MessageSquare },
    ];
    const fieldOfficerNav = [
        { to: '/',             label: 'Grower Overview', icon: Sprout },
        { to: '/growers',      label: 'Grower Registry',    icon: Users },
        { to: '/applications', label: 'Applications',       icon: FileText },
        { to: '/field-visits', label: 'Field Visit Coordination', icon: ClipboardList },
        { to: '/compliance',   label: 'Compliance Hub',     icon: ShieldCheck },
        { to: '/messages',     label: 'Messaging',          icon: MessageSquare },
    ];
    const growerNav = [
        { to: '/',             label: 'Grower Overview', icon: Sprout },
        { to: '/compliance',   label: 'Compliance Documents',     icon: ShieldCheck },
        { to: '/field-visits', label: 'Visit Timeline',     icon: Calendar },
        { to: '/messages',     label: 'Messaging',          icon: MessageSquare },
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
        : user?.fullName 
            ? user.fullName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
            : '?';

    function handleLogout() {
        logout();
        navigate('/');
    }

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-brand">
                    <div className="sidebar-logo-wrapper">
                        <img src="/logov2.png" alt="GrowHub Logo" className="sidebar-logo-icon" />
                    </div>
                    <div className="sidebar-brand-text">
                        <div className="sidebar-brand-name">GrowHub Plantation</div>
                    </div>
                </div>
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
                        <Icon size={20} />
                        <span>{label}</span>
                        {badge && <span className="sidebar-badge">{badge > 99 ? '99+' : badge}</span>}
                    </NavLink>
                ))}

                <NavLink
                    to="/settings"
                    className={({ isActive }) =>
                        'sidebar-link sidebar-settings' + (isActive ? ' active' : '')
                    }
                >
                    <Settings size={20} />
                    <span>Settings</span>
                </NavLink>
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-user">
                    <div className="sidebar-avatar">{initials}</div>
                    <div className="sidebar-user-info">
                        <span className="sidebar-user-name">{user?.name || user?.fullName || '—'}</span>
                        <span className="sidebar-user-role">{roleLabel}</span>
                    </div>
                    <button className="sidebar-logout" onClick={handleLogout}>
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </aside>
    );
}
