import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { Booking } from '../../lib/types';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function PaymentPage() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const { user } = useAuth();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!bookingId || !user) {
      setLoading(false);
      return;
    }

    const fetchBooking = async () => {
      setLoading(true);
      setError('');

      const { data, error: err } = await supabase
        .from('bookings')
        .select(`
          *,
          vehicles (id, make, model, location, price_per_day, vehicle_images (image_url, display_order))
        `)
        .eq('id', bookingId)
        .eq('renter_id', user.id)
        .single();

      if (err || !data) {
        setError('Booking not found or access denied.');
        setLoading(false);
        return;
      }

      setBooking(data as Booking);
      setLoading(false);
    };

    fetchBooking();
  }, [bookingId, user]);

  const handlePay = async () => {
    if (!booking || !user || processing) return;
    setProcessing(true);
    setError('');

    try {
      const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      // 1. Insert payment record into payments table
      const { error: payErr } = await supabase
        .from('payments')
        .insert({
          booking_id: booking.id,
          amount: booking.total_price,
          transaction_id: transactionId,
          status: 'success',
        })
        .select()
        .single();

      if (payErr) throw payErr;

      // 2. Also update booking status directly for instant UI consistency
      await supabase
        .from('bookings')
        .update({
          status: 'confirmed',
          payment_status: 'paid',
        })
        .eq('id', booking.id);

      // 3. Navigate to Payment Success Page
      navigate('/payment-success', {
        state: {
          bookingId: booking.id,
          transactionId: transactionId,
          vehicleName: `${booking.vehicles?.make} ${booking.vehicles?.model}`,
          amount: booking.total_price,
          startDate: booking.start_date,
          endDate: booking.end_date,
        },
      });
    } catch (err: any) {
      setError(err.message || 'Payment failed. Please try again.');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto space-y-4 animate-pulse">
        <div className="h-7 bg-slate-200 rounded w-1/3" />
        <div className="card h-48" />
        <div className="card h-40" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 card">
        <div className="text-5xl mb-3">💳</div>
        <h2 className="text-lg font-semibold text-slate-800 mb-2">{error || 'No booking selected for payment'}</h2>
        <p className="text-slate-400 text-sm mb-6">
          Please select an approved booking from your bookings page to proceed with payment.
        </p>
        <Link to="/my-bookings" className="btn-primary">
          View My Bookings
        </Link>
      </div>
    );
  }

  const v = booking.vehicles;
  const thumb = v?.vehicle_images?.[0]?.image_url ?? null;
  const days = Math.max(
    1,
    Math.ceil((new Date(booking.end_date).getTime() - new Date(booking.start_date).getTime()) / 86_400_000)
  );

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-8">
        <Link to="/my-bookings" className="text-sm text-slate-500 hover:text-primary-600 mb-2 inline-block">
          ← Back to bookings
        </Link>
        <h1 className="page-title">Complete Payment</h1>
        <p className="page-subtitle">Secure checkout for your vehicle rental</p>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Order Summary */}
      <div className="card mb-6 space-y-4">
        <h2 className="font-bold text-slate-900 text-base">Order Summary</h2>

        <div className="flex gap-4 items-center pb-4 border-b border-slate-100">
          <div className="w-16 h-14 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
            {thumb ? (
              <img src={thumb} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-slate-300">{v?.make?.[0] ?? '🚗'}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 truncate">{v?.make} {v?.model}</p>
            <p className="text-slate-400 text-xs mt-0.5">📍 {v?.location}</p>
          </div>
        </div>

        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Rental Dates</span>
            <span className="font-medium text-slate-800">
              {formatDate(booking.start_date)} → {formatDate(booking.end_date)}
            </span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Duration</span>
            <span className="font-medium text-slate-800">{days} day{days !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Daily Rate</span>
            <span>LKR {v?.price_per_day?.toLocaleString()} / day</span>
          </div>
          <div className="flex justify-between font-bold text-slate-900 border-t border-slate-100 pt-3 mt-3 text-base">
            <span>Total Payable</span>
            <span className="text-primary-600">LKR {booking.total_price.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Pay Action */}
      <div className="card text-center space-y-4 shadow-card">
        <div className="w-12 h-12 rounded-full bg-primary-50 text-primary-600 text-2xl flex items-center justify-center mx-auto">
          💳
        </div>
        <div>
          <p className="font-bold text-slate-900 text-base">Pay & Confirm Booking</p>
          <p className="text-slate-400 text-xs mt-1">
            Instant confirmation. Your booking will be locked in immediately.
          </p>
        </div>

        <button
          type="button"
          onClick={handlePay}
          disabled={processing}
          className="btn-primary w-full text-base py-3.5 flex items-center justify-center gap-2"
        >
          {processing ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Processing Payment...</span>
            </>
          ) : (
            <>
              <span>Pay LKR {booking.total_price.toLocaleString()} Now</span>
              <span>🔒</span>
            </>
          )}
        </button>

        <p className="text-xs text-slate-400">
          Encrypted 256-bit secure checkout
        </p>
      </div>
    </div>
  );
}
