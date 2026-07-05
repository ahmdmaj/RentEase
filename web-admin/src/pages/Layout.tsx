import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

export default function Layout() {
    const { profile, signOut } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <div className="layout">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <h2>🚗 RentEase</h2>
                    <span className="sidebar-subtitle">Admin Panel</span>
                </div>

                <nav className="sidebar-nav">
                    <NavLink to="/" className="nav-link" end>
                        📊 Dashboard
                    </NavLink>
                    <NavLink to="/approvals" className="nav-link">
                        ✅ Owner Approvals
                    </NavLink>
                    <NavLink to="/users" className="nav-link">
                        👤 Users
                    </NavLink>
                    <NavLink to="/vehicles" className="nav-link">
                        🚗 Vehicles
                    </NavLink>
                    <NavLink to="/bookings" className="nav-link">
                        📅 Bookings
                    </NavLink>
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <span className="user-name">{profile?.full_name || 'Admin'}</span>
                        <span className="user-email">{profile?.email || ''}</span>
                    </div>
                    <button onClick={handleLogout} className="logout-btn">
                        🚪 Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
}