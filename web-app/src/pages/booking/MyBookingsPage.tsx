import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { Booking, BookingStatus } from '../../lib/types';

const STATUS_STYLES: Record<BookingStatus, string> = {
  pending:   'bg-yellow-100 text-yellow-700',
  approved:  'bg-blue-100 text-blue-700',
  confirmed: 'bg-green-100 text-green-700',
  rejected:  'bg-red-100 text-red-600',
  completed: 'bg-purple-100 text-purple-700',
  cancelled: 'bg-slate-100 text-slate-500',
};

const STATUS_TABS: { label: string; value: BookingStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function MyBookingsPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const successState = location.state as { bookingId?: string; success?: boolean } | null;

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<BookingStatus | 'all'>('all');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [chattingId, setChattingId] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');

    const { data, error: err } = await supabase
      .from('bookings')
      .select(`
        *,
        vehicles (id, make, model, location, price_per_day, owner_id, vehicle_images (image_url, display_order))
      `)
      .eq('renter_id', user.id)
      .order('created_at', { ascending: false });

    if (err) {
      setError('Failed to load bookings.');
      setLoading(false);
      return;
    }
    setBookings((data ?? []) as Booking[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    setCancellingId(bookingId);

    const { error: err } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId)
      .eq('renter_id', user!.id)
      .eq('status', 'pending');

    if (err) {
      alert('Failed to cancel booking: ' + err.message);
    } else {
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' } : b))
      );
    }
    setCancellingId(null);
  };

  const handleChatWithOwner = async (booking: Booking) => {
    if (!user || !booking.vehicles?.owner_id) return;
    setChattingId(booking.id);

    try {
      const { data: existing, error: findErr } = await supabase
        .from('conversations')
        .select('id')
        .eq('vehicle_id', booking.vehicle_id)
        .eq('renter_id', user.id)
        .eq('owner_id', booking.vehicles.owner_id)
        .maybeSingle();

      if (!findErr && existing?.id) {
        navigate(`/chat/${existing.id}`);
        return;
      }

      const { data: newConv, error: createErr } = await supabase
        .from('conversations')
        .insert({
          vehicle_id: booking.vehicle_id,
          renter_id: user.id,
          owner_id: booking.vehicles.owner_id,
        })
        .select('id')
        .single();

      if (createErr) throw createErr;
      navigate(`/chat/${newConv.id}`);
    } catch (err: any) {
      alert('Failed to open chat: ' + err.message);
    } finally {
      setChattingId(null);
    }
  };

  const filtered = activeTab === 'all' ? bookings : bookings.filter((b) => b.status === activeTab);

  return (
    <div>
      <div className="mb-8">
        <h1 className="page-title">My Bookings</h1>
        <p className="page-subtitle">Track all your vehicle rental bookings</p>
      </div>

      {/* Success Banner */}
      {successState?.success && (
        <div className="mb-6 px-4 py-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm flex items-center gap-2">
          <span>✅</span>
          <span>Booking request submitted! The owner will review your request shortly.</span>
        </div>
      )}

      {/* Status Tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150 ${
              activeTab === tab.value
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
            {tab.value !== 'all' && (
              <span className="ml-1.5 opacity-70">
                ({bookings.filter((b) => b.status === tab.value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card flex gap-4 items-center animate-pulse">
              <div className="w-20 h-16 bg-slate-200 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-slate-200 rounded w-1/2" />
                <div className="h-4 bg-slate-100 rounded w-1/3" />
              </div>
              <div className="h-6 bg-slate-200 rounded-full w-20" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 card">
          <div className="text-5xl mb-4">📅</div>
          <h2 className="text-lg font-semibold text-slate-700 mb-2">No bookings found</h2>
          <p className="text-slate-400 text-sm">
            {activeTab === 'all' ? "You haven't made any bookings yet." : `No ${activeTab} bookings.`}
          </p>
          {activeTab === 'all' && (
            <Link to="/" className="btn-primary mt-5 inline-block">
              Browse Vehicles
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((booking) => {
            const v = booking.vehicles;
            const thumb = v?.vehicle_images?.sort((a, b) => a.display_order - b.display_order)[0]?.image_url ?? null;
            const days = Math.max(
              1,
              Math.ceil((new Date(booking.end_date).getTime() - new Date(booking.start_date).getTime()) / 86_400_000)
            );

            const isApprovedUnpaid = booking.status === 'approved' && booking.payment_status !== 'paid';
            const isPaid = booking.status === 'confirmed' || booking.payment_status === 'paid';

            return (
              <div key={booking.id} className="card shadow-sm hover:shadow transition-shadow">
                <div className="flex gap-4 items-start flex-col sm:flex-row">
                  {/* Thumbnail */}
                  <Link
                    to={`/vehicle/${booking.vehicle_id}`}
                    className="w-full sm:w-28 h-20 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 flex items-center justify-center hover:opacity-90 transition-opacity"
                  >
                    {thumb ? (
                      <img src={thumb} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-slate-300">{v?.make?.[0] ?? '🚗'}</span>
                    )}
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <Link
                          to={`/vehicle/${booking.vehicle_id}`}
                          className="font-bold text-slate-900 text-base hover:text-primary-600 transition-colors"
                        >
                          {v ? `${v.make} ${v.model}` : 'Vehicle'}
                        </Link>
                        <p className="text-slate-400 text-xs mt-0.5">📍 {v?.location ?? '—'}</p>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`badge ${STATUS_STYLES[booking.status]} capitalize flex-shrink-0`}>
                          {booking.status}
                        </span>
                        {isPaid && (
                          <span className="badge bg-emerald-100 text-emerald-700 flex-shrink-0">
                            ✓ Paid
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-600">
                      <span>📅 {formatDate(booking.start_date)} → {formatDate(booking.end_date)}</span>
                      <span>⏱ {days} day{days !== 1 ? 's' : ''}</span>
                      <span className="font-bold text-primary-600">
                        LKR {booking.total_price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions Row */}
                <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    {booking.vehicles?.owner_id && (
                      <button
                        onClick={() => handleChatWithOwner(booking)}
                        disabled={chattingId === booking.id}
                        className="btn-ghost text-xs px-3 py-1.5 text-slate-600 hover:text-primary-600 flex items-center gap-1"
                      >
                        <span>💬</span>
                        <span>{chattingId === booking.id ? 'Opening...' : 'Chat with Owner'}</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-auto">
                    {isApprovedUnpaid && (
                      <Link
                        to={`/payment?bookingId=${booking.id}`}
                        className="btn-primary text-xs py-1.5 px-4 font-semibold shadow-sm animate-pulse"
                      >
                        💳 Pay Now (LKR {booking.total_price.toLocaleString()})
                      </Link>
                    )}

                    {booking.status === 'pending' && (
                      <button
                        onClick={() => handleCancel(booking.id)}
                        disabled={cancellingId === booking.id}
                        className="btn-ghost text-xs text-red-500 hover:bg-red-50 hover:text-red-600"
                      >
                        {cancellingId === booking.id ? 'Cancelling...' : '✕ Cancel Booking'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
