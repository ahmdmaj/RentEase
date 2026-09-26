import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { Vehicle, BookingRPCResult } from '../../lib/types';

function calcDays(start: string, end: string): number {
  if (!start || !end) return 0;
  const diff = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(0, Math.floor(diff / 86_400_000));
}

export default function BookingPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loadingVehicle, setLoadingVehicle] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Minimum date = today
  const today = new Date().toISOString().split('T')[0];
  const days = calcDays(startDate, endDate);
  const totalPrice = vehicle ? days * vehicle.price_per_day : 0;

  useEffect(() => {
    if (!id) return;
    const fetchVehicle = async () => {
      const { data, error: err } = await supabase
        .from('vehicles')
        .select('*, vehicle_images(image_url, display_order)')
        .eq('id', id)
        .single();
      if (!err && data) {
        const v = data as Vehicle;
        v.vehicle_images = v.vehicle_images?.sort((a, b) => a.display_order - b.display_order);
        setVehicle(v);
      }
      setLoadingVehicle(false);
    };
    fetchVehicle();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user) { navigate('/login'); return; }
    if (!id || !vehicle) return;
    if (days <= 0) { setError('Return date must be after pick-up date.'); return; }

    setSubmitting(true);

    const { data, error: rpcErr } = await supabase.rpc('check_and_create_booking', {
      p_vehicle_id: id,
      p_renter_id: user.id,
      p_start_date: new Date(startDate).toISOString(),
      p_end_date: new Date(endDate).toISOString(),
    });

    if (rpcErr) {
      setError(rpcErr.message);
      setSubmitting(false);
      return;
    }

    const result = data as BookingRPCResult;

    if (!result.success) {
      setError(result.error ?? 'Booking failed. Please try again.');
      setSubmitting(false);
      return;
    }

    // Success → go to my bookings
    navigate('/my-bookings', { state: { bookingId: result.booking_id, success: true } });
  };

  if (loadingVehicle) {
    return (
      <div className="max-w-xl mx-auto space-y-4 animate-pulse">
        <div className="h-7 bg-slate-200 rounded w-48" />
        <div className="card h-24" />
        <div className="card h-72" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="max-w-xl mx-auto text-center py-20">
        <p className="text-slate-500">Vehicle not found.</p>
        <Link to="/" className="btn-primary mt-4 inline-block">Back to Browse</Link>
      </div>
    );
  }

  const thumb = vehicle.vehicle_images?.[0]?.image_url ?? null;

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <Link to={`/vehicle/${id}`} className="text-sm text-slate-500 hover:text-primary-600 mb-2 inline-block">← Back to vehicle</Link>
        <h1 className="page-title">Confirm Booking</h1>
        <p className="page-subtitle">Review your details before submitting</p>
      </div>

      {/* Vehicle Summary */}
      <div className="card mb-6 flex gap-4 items-center">
        <div className="w-20 h-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 flex items-center justify-center">
          {thumb ? (
            <img src={thumb} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-bold text-slate-300">{vehicle.make[0]}</span>
          )}
        </div>
        <div>
          <p className="font-bold text-slate-900">{vehicle.make} {vehicle.model}</p>
          <p className="text-slate-400 text-sm">📍 {vehicle.location}</p>
          <p className="text-primary-600 font-semibold text-sm mt-1">LKR {vehicle.price_per_day.toLocaleString()} / day</p>
        </div>
      </div>

      {/* Booking Form */}
      <form onSubmit={handleSubmit} className="card space-y-5">
        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="startDate">Pick-up Date</label>
            <input
              id="startDate"
              type="date"
              className="input"
              min={today}
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (endDate && e.target.value >= endDate) setEndDate('');
              }}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="endDate">Return Date</label>
            <input
              id="endDate"
              type="date"
              className="input"
              min={startDate || today}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="notes">Notes for Owner <span className="text-slate-400 font-normal">(optional)</span></label>
          <textarea
            id="notes"
            className="input resize-none"
            rows={3}
            placeholder="Any special requests or info for the owner?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Price Breakdown */}
        <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
          <div className="flex justify-between text-slate-500">
            <span>Duration</span>
            <span>{days > 0 ? `${days} day${days !== 1 ? 's' : ''}` : '—'}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Rate</span>
            <span>LKR {vehicle.price_per_day.toLocaleString()} / day</span>
          </div>
          <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-900">
            <span>Total</span>
            <span>{days > 0 ? `LKR ${totalPrice.toLocaleString()}` : '—'}</span>
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary w-full text-base py-3"
          disabled={submitting || days <= 0}
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Submitting...
            </span>
          ) : 'Submit Booking Request →'}
        </button>

        <p className="text-center text-xs text-slate-400">
          Your booking will be <strong>pending</strong> until the owner approves it.
        </p>
      </form>
    </div>
  );
}
