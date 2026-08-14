import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navLinks = [
  { to: '/', label: 'Browse', icon: '🚗' },
  { to: '/my-bookings', label: 'My Bookings', icon: '📅' },
  { to: '/messages', label: 'Messages', icon: '💬' },
  { to: '/notifications', label: 'Notifications', icon: '🔔' },
];

const ownerLinks = [
  { to: '/my-listings', label: 'My Listings', icon: '📋' },
  { to: '/owner-bookings', label: 'Requests', icon: '📥' },
];

export default function Navbar() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const isActive = (path: string) =>
    location.pathname === path
      ? 'text-primary-600 font-semibold'
      : 'text-slate-600 hover:text-primary-600';

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary-600">
            🚗 <span>RentEase</span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${isActive(link.to)}`}
              >
                <span>{link.icon}</span>
                {link.label}
              </Link>
            ))}
            {profile?.role === 'owner' && ownerLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${isActive(link.to)}`}
              >
                <span>{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {profile?.role === 'owner' && (
              <Link to="/add-vehicle" className="btn-primary text-sm py-2 px-4">
                + Add Vehicle
              </Link>
            )}
            <Link
              to="/profile"
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors duration-150"
            >
              <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs">
                {profile?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
              </div>
              <span className="text-sm font-medium text-slate-700 hidden sm:block">
                {profile?.full_name?.split(' ')[0] ?? 'Profile'}
              </span>
            </Link>
            <button
              onClick={handleSignOut}
              className="btn-ghost text-sm text-red-500 hover:bg-red-50 hover:text-red-600"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
