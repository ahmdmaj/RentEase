import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { Booking, BookingStatus } from '../../lib/types';

const STATUS_STYLES: Record<BookingStatus, string> = {
  pending:   'bg-yellow-100 text-yellow-700',
  approved:  'bg-blue-100 text-blue-700',
  confirmed: 'bg-indigo-100 text-indigo-700',
  rejected:  'bg-red-100 text-red-600',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-slate-100 text-slate-500',
};

const FILTER_TABS: { label: string; value: BookingStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Completed', value: 'completed' },
];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function OwnerBookingsPage() {
  const { user } = useAuth();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<BookingStatus | 'all'>('all');
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchBookings = async () => {
    if (!user) return;
    setLoading(true);
    setError('');

    const { data, error: err } = await supabase
      .from('bookings')
      .select(`
        *,
        vehicles!inner (id, make, model, location, owner_id, vehicle_images (image_url, display_order)),
        profiles (full_name, phone)
      `)
      .eq('vehicles.owner_id', user.id)
      .order('created_at', { ascending: false });

    if (err) { setError('Failed to load booking requests.'); setLoading(false); return; }
    setBookings((data ?? []) as Booking[]);
    setLoading(false);
  };

  useEffect(() => { fetchBookings(); }, [user]);

  const updateStatus = async (bookingId: string, status: 'approved' | 'rejected') => {
    setActionId(bookingId);
    const { error: err } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', bookingId);

    if (err) {
      alert('Failed to update booking: ' + err.message);
    } else {
      setBookings((prev) =>
        prev.map((b) => b.id === bookingId ? { ...b, status } : b)
      );
    }
    setActionId(null);
  };

  const filtered = activeTab === 'all' ? bookings : bookings.filter((b) => b.status === activeTab);
  const pendingCount = bookings.filter((b) => b.status === 'pending').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <h1 className="page-title">Booking Requests</h1>
          <p className="page-subtitle">Review and manage rental requests for your vehicles</p>
        </div>
        {pendingCount > 0 && (
          <span className="badge bg-yellow-100 text-yellow-700 text-sm px-3 py-1">
            {pendingCount} pending
          </span>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {FILTER_TABS.map((tab) => (
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
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse space-y-3">
              <div className="flex gap-4">
                <div className="w-16 h-16 bg-slate-200 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-slate-200 rounded w-1/3" />
                  <div className="h-4 bg-slate-100 rounded w-2/3" />
                  <div className="h-4 bg-slate-100 rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📥</div>
          <h2 className="text-lg font-semibold text-slate-700 mb-2">No requests yet</h2>
          <p className="text-slate-400 text-sm">
            {activeTab === 'all' ? "You haven't received any booking requests." : `No ${activeTab} requests.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((booking) => {
            const v = booking.vehicles;
            const renter = booking.profiles;
            const thumb = v?.vehicle_images?.sort((a, b) => a.display_order - b.display_order)[0]?.image_url ?? null;
            const days = Math.ceil(
              (new Date(booking.end_date).getTime() - new Date(booking.start_date).getTime()) / 86_400_000
            );
            const isActioning = actionId === booking.id;

            return (
              <div key={booking.id} className="card">
                <div className="flex gap-4 items-start">
                  {/* Vehicle thumb */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 flex items-center justify-center">
                    {thumb ? (
                      <img src={thumb} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl font-bold text-slate-300">{v?.make?.[0] ?? '?'}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <p className="font-bold text-slate-900">
                        {v ? `${v.make} ${v.model}` : 'Vehicle'}
                      </p>
                      <span className={`badge ${STATUS_STYLES[booking.status]} capitalize flex-shrink-0`}>
                        {booking.status}
                      </span>
                    </div>

                    {/* Renter info */}
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                      <span>👤 {renter?.full_name ?? 'Renter'}</span>
                      {renter?.phone && <span>· {renter.phone}</span>}
                    </div>

                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span>📅 {formatDate(booking.start_date)} → {formatDate(booking.end_date)}</span>
                      <span>⏱ {days} day{days !== 1 ? 's' : ''}</span>
                      <span className="font-semibold text-slate-700">LKR {booking.total_price.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Actions for pending */}
                {booking.status === 'pending' && (
                  <div className="flex gap-3 mt-4 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => updateStatus(booking.id, 'approved')}
                      disabled={isActioning}
                      className="btn-primary text-sm py-2 px-5 flex items-center gap-1.5"
                    >
                      {isActioning ? (
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : '✓'} Accept
                    </button>
                    <button
                      onClick={() => updateStatus(booking.id, 'rejected')}
                      disabled={isActioning}
                      className="btn-ghost text-sm text-red-500 hover:bg-red-50 hover:text-red-600"
                    >
                      ✕ Decline
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
