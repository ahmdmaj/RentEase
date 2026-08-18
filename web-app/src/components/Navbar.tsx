import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

/* ─── Minimal inline SVG icons ─────────────────────── */
const Svg = ({ d, size = 18 }: { d: string | string[]; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0 }}>
    {(Array.isArray(d) ? d : [d]).map((p, i) => <path key={i} d={p} />)}
  </svg>
);

const icons = {
  browse:    'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l1 1h1m7-1h4l3-3V9a1 1 0 00-1-1h-4l-1 1v6z',
  bookings:  'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  messages:  'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  bell:      'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  listings:  'M4 6h16M4 10h16M4 14h16M4 18h16',
  requests:  'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4',
  owner:     'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z',
  profile:   'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z',
  signout:   'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
  plus:      'M12 4v16m8-8H4',
  menu:      'M4 6h16M4 12h16M4 18h16',
  close:     'M6 18L18 6M6 6l12 12',
};

export default function Navbar() {
  const { user, profile } = useAuth();
  const location = useLocation();

  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Scroll shadow effect
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!user) return;

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

    const notifChannel = supabase
      .channel(`navbar-notifs-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, fetchCounts)
      .subscribe();

    const msgChannel = supabase
      .channel(`navbar-msgs-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` }, fetchCounts)
      .subscribe();

    return () => {
      supabase.removeChannel(notifChannel);
      supabase.removeChannel(msgChannel);
    };
  }, [user, location.pathname]);



  const isActive = (path: string) =>
    location.pathname === path
      ? 'text-primary-700 bg-primary-50 font-semibold'
      : 'text-slate-600 hover:text-primary-700 hover:bg-slate-100/80';

  const isOwner  = profile?.role === 'owner';
  const isRenter = profile?.role === 'renter';

  const initials = (profile?.full_name || '?')
    .split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  /* Badge helper */
  const Badge = ({ count, red }: { count: number; red?: boolean }) =>
    count > 0 ? (
      <span className={`ml-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold text-white rounded-full ${red ? 'bg-red-500' : 'bg-primary-600'}`}>
        {count > 9 ? '9+' : count}
      </span>
    ) : null;

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled
      ? 'bg-white/90 backdrop-blur-xl shadow-md border-b border-slate-100'
      : 'bg-white/70 backdrop-blur-md border-b border-white/60'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ── */}
          <Link to="/" className="flex items-center flex-shrink-0 group">
            <span className="font-heading text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none transition-transform duration-200 group-hover:scale-[1.02]">
              Rent<span className="text-primary-600">Ease</span>
            </span>
          </Link>

          {/* ── Right Side Group ── */}
          <div className="flex items-center">
            
            {/* ── Desktop nav ── */}
            <div className="hidden md:flex items-center gap-3">
              <NavItem to="/" icon={<Svg d={icons.browse} size={15} />} label="Browse" isActive={isActive('/')} />
              <NavItem to="/my-bookings" icon={<Svg d={icons.bookings} size={15} />} label="My Bookings" isActive={isActive('/my-bookings')} />
              <NavItem
                to="/messages"
                icon={<Svg d={icons.messages} size={15} />}
                label="Messages"
                isActive={isActive('/messages')}
                badge={<Badge count={unreadMessages} />}
              />

              {isOwner && (
                <>
                  <div className="h-5 w-px bg-slate-200 mx-2" />
                  <NavItem to="/my-listings"    icon={<Svg d={icons.listings}  size={15} />} label="My Listings"    isActive={isActive('/my-listings')} />
                  <NavItem to="/owner-bookings" icon={<Svg d={icons.requests}  size={15} />} label="Requests"       isActive={isActive('/owner-bookings')} />
                </>
              )}

              {isRenter && (
                <NavItem
                  to="/become-owner"
                  icon={<Svg d={icons.owner} size={15} />}
                  label="Become an Owner"
                  isActive={location.pathname === '/become-owner' ? 'text-emerald-700 bg-emerald-50 font-semibold' : 'text-emerald-700 hover:bg-emerald-50'}
                />
              )}
            </div>

            {/* Separator */}
            <div className="hidden md:block h-8 w-px bg-slate-200 mx-6"></div>

            {/* ── Right actions ── */}
            <div className="flex items-center gap-4">
              {/* Notification Icon */}
              <Link to="/notifications"
                className="relative p-2 text-slate-600 hover:text-primary-700 hover:bg-slate-100 rounded-full transition-colors flex items-center justify-center">
                <Svg d={icons.bell} size={20} />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex items-center justify-center min-w-[16px] h-[16px] text-[9px] font-bold text-white bg-red-500 rounded-full border-[1.5px] border-white">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </Link>

              {isOwner && (
                <Link to="/add-vehicle"
                  className="hidden sm:inline-flex items-center gap-1.5 btn-primary text-sm py-2 px-4">
                  <Svg d={icons.plus} size={14} />
                  Add Vehicle
                </Link>
              )}

              {/* Profile avatar */}
              <Link to="/profile"
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-slate-100 hover:bg-primary-50 border border-transparent hover:border-primary-200 transition-all duration-150">
                <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-sm"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
                  {initials}
                </div>
                <span className="text-xs font-semibold text-slate-700 hidden sm:block max-w-[90px] truncate font-heading">
                  {profile?.full_name?.split(' ')[0] ?? 'Profile'}
                </span>
              </Link>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileMenuOpen((p) => !p)}
                className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
                aria-label="Toggle Menu">
                <Svg d={mobileMenuOpen ? icons.close : icons.menu} size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile drawer ── */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 px-4 py-3 space-y-1 animate-fade-up"
          style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)' }}>

          <MobileLink to="/"              icon={<Svg d={icons.browse}   size={16} />} label="Browse Vehicles"   onClick={() => setMobileMenuOpen(false)} isActive={isActive('/')} />
          <MobileLink to="/my-bookings"   icon={<Svg d={icons.bookings} size={16} />} label="My Bookings"       onClick={() => setMobileMenuOpen(false)} isActive={isActive('/my-bookings')} />
          <MobileLink to="/messages"      icon={<Svg d={icons.messages} size={16} />} label="Messages"          onClick={() => setMobileMenuOpen(false)} isActive={isActive('/messages')}  badge={<Badge count={unreadMessages} />} />
          <MobileLink to="/notifications" icon={<Svg d={icons.bell}     size={16} />} label="Notifications"     onClick={() => setMobileMenuOpen(false)} isActive={isActive('/notifications')} badge={<Badge count={unreadNotifications} red />} />

          {isRenter && (
            <div className="border-t border-slate-100 pt-2 mt-1">
              <MobileLink to="/become-owner" icon={<Svg d={icons.owner} size={16} />} label="Become an Owner" onClick={() => setMobileMenuOpen(false)}
                isActive="text-emerald-700 font-semibold bg-emerald-50" />
            </div>
          )}

          {isOwner && (
            <div className="border-t border-slate-100 pt-2 mt-1">
              <p className="px-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Owner</p>
              <MobileLink to="/my-listings"    icon={<Svg d={icons.listings}  size={16} />} label="My Listings"       onClick={() => setMobileMenuOpen(false)} isActive={isActive('/my-listings')} />
              <MobileLink to="/owner-bookings" icon={<Svg d={icons.requests}  size={16} />} label="Booking Requests"  onClick={() => setMobileMenuOpen(false)} isActive={isActive('/owner-bookings')} />
              <MobileLink to="/add-vehicle"    icon={<Svg d={icons.plus}      size={16} />} label="Add New Vehicle"   onClick={() => setMobileMenuOpen(false)} isActive="text-primary-600 bg-primary-50 font-semibold" />
            </div>
          )}

          <div className="border-t border-slate-100 pt-2 mt-1">
            <MobileLink to="/profile" icon={<Svg d={icons.profile} size={16} />} label="My Profile" onClick={() => setMobileMenuOpen(false)} isActive={isActive('/profile')} />

          </div>
        </div>
      )}
    </nav>
  );
}

/* ─── Small reusable sub-components ─────────────────── */
function NavItem({ to, icon, label, isActive, badge }: {
  to: string; icon: React.ReactNode; label: string; isActive: string; badge?: React.ReactNode;
}) {
  return (
    <Link to={to}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${isActive}`}>
      {icon}
      <span className="font-heading">{label}</span>
      {badge}
    </Link>
  );
}

function MobileLink({ to, icon, label, onClick, isActive, badge }: {
  to: string; icon: React.ReactNode; label: string; onClick: () => void; isActive: string; badge?: React.ReactNode;
}) {
  return (
    <Link to={to} onClick={onClick}
      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive}`}>
      <span className="flex items-center gap-2.5">
        {icon}
        <span className="font-heading">{label}</span>
      </span>
      {badge}
    </Link>
  );
}
