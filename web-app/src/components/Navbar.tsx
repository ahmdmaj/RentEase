import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    // 1. Fetch initial counts
    const fetchCounts = async () => {
      const { count: notifCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      setUnreadNotifications(notifCount ?? 0);

      const { count: msgCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false);

      setUnreadMessages(msgCount ?? 0);
    };

    fetchCounts();

    // 2. Realtime listener for notifications
    const notifChannel = supabase
      .channel(`navbar-notifs-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchCounts();
        }
      )
      .subscribe();

    // 3. Realtime listener for messages
    const msgChannel = supabase
      .channel(`navbar-msgs-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          fetchCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notifChannel);
      supabase.removeChannel(msgChannel);
    };
  }, [user, location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const isActive = (path: string) =>
    location.pathname === path
      ? 'text-primary-600 bg-primary-50/70 font-semibold'
      : 'text-slate-600 hover:text-primary-600 hover:bg-slate-50';

  const isOwner = profile?.role === 'owner';

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-black text-xl text-primary-600 tracking-tight">
            <span className="text-2xl">🚗</span>
            <span>RentEase</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all duration-150 ${isActive('/')}`}
            >
              <span>🚗</span>
              <span>Browse</span>
            </Link>

            <Link
              to="/my-bookings"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all duration-150 ${isActive('/my-bookings')}`}
            >
              <span>📅</span>
              <span>My Bookings</span>
            </Link>

            <Link
              to="/messages"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all duration-150 relative ${isActive('/messages')}`}
            >
              <span>💬</span>
              <span>Messages</span>
              {unreadMessages > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold bg-primary-600 text-white rounded-full">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              )}
            </Link>

            <Link
              to="/notifications"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all duration-150 relative ${isActive('/notifications')}`}
            >
              <span>🔔</span>
              <span>Notifications</span>
              {unreadNotifications > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold bg-red-500 text-white rounded-full">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </Link>

            {isOwner && (
              <>
                <div className="h-4 w-px bg-slate-200 mx-1" />
                <Link
                  to="/my-listings"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all duration-150 ${isActive('/my-listings')}`}
                >
                  <span>📋</span>
                  <span>My Listings</span>
                </Link>
                <Link
                  to="/owner-bookings"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all duration-150 ${isActive('/owner-bookings')}`}
                >
                  <span>📥</span>
                  <span>Requests</span>
                </Link>
              </>
            )}
          </div>

          {/* Right side Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {isOwner && (
              <Link to="/add-vehicle" className="hidden sm:inline-flex btn-primary text-xs py-2 px-3.5">
                + Add Vehicle
              </Link>
            )}

            <Link
              to="/profile"
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors duration-150"
            >
              <div className="w-7 h-7 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {profile?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
              </div>
              <span className="text-xs font-semibold text-slate-700 hidden sm:block max-w-[100px] truncate">
                {profile?.full_name?.split(' ')[0] ?? 'Profile'}
              </span>
            </Link>

            <button
              onClick={handleSignOut}
              className="btn-ghost text-xs text-red-500 hover:bg-red-50 hover:text-red-600 px-2 sm:px-3 py-1.5 hidden md:block"
            >
              Sign Out
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen((p) => !p)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1 shadow-lg">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium ${isActive('/')}`}
          >
            <span>🚗</span>
            <span>Browse Vehicles</span>
          </Link>

          <Link
            to="/my-bookings"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium ${isActive('/my-bookings')}`}
          >
            <span>📅</span>
            <span>My Bookings</span>
          </Link>

          <Link
            to="/messages"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium ${isActive('/messages')}`}
          >
            <div className="flex items-center gap-2">
              <span>💬</span>
              <span>Messages</span>
            </div>
            {unreadMessages > 0 && (
              <span className="px-1.5 py-0.5 text-xs font-bold bg-primary-600 text-white rounded-full">
                {unreadMessages}
              </span>
            )}
          </Link>

          <Link
            to="/notifications"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium ${isActive('/notifications')}`}
          >
            <div className="flex items-center gap-2">
              <span>🔔</span>
              <span>Notifications</span>
            </div>
            {unreadNotifications > 0 && (
              <span className="px-1.5 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                {unreadNotifications}
              </span>
            )}
          </Link>

          {isOwner && (
            <>
              <div className="border-t border-slate-100 my-2 pt-2">
                <p className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Owner Controls</p>
                <Link
                  to="/my-listings"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium ${isActive('/my-listings')}`}
                >
                  <span>📋</span>
                  <span>My Listings</span>
                </Link>
                <Link
                  to="/owner-bookings"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium ${isActive('/owner-bookings')}`}
                >
                  <span>📥</span>
                  <span>Booking Requests</span>
                </Link>
                <Link
                  to="/add-vehicle"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-primary-600 bg-primary-50 mt-1"
                >
                  <span>➕</span>
                  <span>Add New Vehicle</span>
                </Link>
              </div>
            </>
          )}

          <div className="border-t border-slate-100 my-2 pt-2">
            <Link
              to="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium ${isActive('/profile')}`}
            >
              <span>👤</span>
              <span>My Profile</span>
            </Link>
            <button
              onClick={handleSignOut}
              className="w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <span>🚪</span>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
