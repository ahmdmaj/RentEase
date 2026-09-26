import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

// Simple inline SVG icon component
const Icon = ({ d, size = 18 }: { d: string; size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />
    </svg>
);

const NAV_ITEMS = [
    {
        to: '/',
        label: 'Dashboard',
        end: true,
        icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    },
    {
        to: '/approvals',
        label: 'Owner Approvals',
        icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z',
    },
    {
        to: '/users',
        label: 'Users',
        icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M9 7a4 4 0 100 8 4 4 0 000-8z',
    },
    {
        to: '/vehicles',
        label: 'Vehicles',
        icon: 'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l1 1h1m7-1h4l3-3V9a1 1 0 00-1-1h-4l-1 1v6z',
    },
    {
        to: '/bookings',
        label: 'Bookings',
        icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    },
];

export default function Layout() {
    const { profile, signOut } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    // Build initials for avatar
    const initials = (profile?.full_name || 'Admin')
        .split(' ')
        .map((w: string) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <div className="layout">
            {/* ── Sidebar ── */}
            <aside className="sidebar">
                {/* Brand */}
                <div className="sidebar-brand">
                    <div className="brand-text">
                        <span className="brand-name">
                            Rent<span style={{ color: '#2563eb' }}>Ease</span>
                        </span>
                        <span className="brand-tag">Admin Portal</span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="sidebar-nav">
                    <p className="nav-section-label">Navigation</p>
                    {NAV_ITEMS.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) =>
                                `nav-link${isActive ? ' active' : ''}`
                            }
                        >
                            <span className="nav-icon">
                                <Icon d={item.icon} />
                            </span>
                            <span className="nav-label">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Footer */}
                <div className="sidebar-footer">
                    <div className="user-card">
                        <div className="user-avatar">{initials}</div>
                        <div className="user-details">
                            <span className="user-name">{profile?.full_name || 'Admin'}</span>
                            <span className="user-role">Administrator</span>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="logout-btn">
                        <Icon d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* ── Main Content ── */}
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
}