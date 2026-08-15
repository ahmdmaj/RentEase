import { Link, useLocation } from 'react-router-dom';

function formatDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function PaymentSuccessPage() {
  const location = useLocation();
  const state = location.state as {
    bookingId?: string;
    transactionId?: string;
    vehicleName?: string;
    amount?: number;
    startDate?: string;
    endDate?: string;
  } | null;

  return (
    <div className="max-w-md mx-auto text-center py-8">
      {/* Success Icon */}
      <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm text-3xl">
        ✅
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Payment Confirmed!</h1>
      <p className="text-slate-500 text-sm mb-8 leading-relaxed">
        Your payment was processed successfully and your vehicle booking is now officially confirmed.
      </p>

      {/* Booking Reference Card */}
      <div className="card mb-8 text-left space-y-4 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <span className="font-bold text-slate-900 text-sm">Receipt Summary</span>
          <span className="badge bg-green-100 text-green-700">Paid</span>
        </div>

        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between text-slate-500">
            <span>Transaction ID</span>
            <span className="font-mono text-xs font-semibold text-slate-700">
              {state?.transactionId ?? `TXN_${Date.now().toString().slice(-6)}`}
            </span>
          </div>

          <div className="flex justify-between text-slate-500">
            <span>Vehicle</span>
            <span className="font-medium text-slate-800">{state?.vehicleName ?? 'Vehicle Rental'}</span>
          </div>

          {state?.startDate && state?.endDate && (
            <div className="flex justify-between text-slate-500">
              <span>Dates</span>
              <span className="text-slate-700">
                {formatDate(state.startDate)} → {formatDate(state.endDate)}
              </span>
            </div>
          )}

          <div className="flex justify-between font-bold text-slate-900 border-t border-slate-100 pt-2.5 mt-2.5">
            <span>Amount Paid</span>
            <span className="text-primary-600">
              LKR {state?.amount?.toLocaleString() ?? '—'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Link to="/my-bookings" className="btn-primary w-full py-3">
          View My Bookings
        </Link>
        <Link to="/" className="btn-ghost w-full">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
