import { Link } from 'react-router-dom';

export default function PaymentSuccessPage() {
  return (
    <div className="max-w-md mx-auto text-center py-16">
      {/* Success Icon */}
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <span className="text-4xl">✅</span>
      </div>

      <h1 className="text-3xl font-bold text-slate-900 mb-2">Payment Successful!</h1>
      <p className="text-slate-500 mb-8">
        Your booking has been confirmed. The owner has been notified and will contact you shortly.
      </p>

      {/* Booking Reference */}
      <div className="card mb-8 text-left space-y-3">
        <h2 className="font-semibold text-slate-900">Booking Details</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-slate-500">
            <span>Reference ID</span>
            <span className="font-mono font-medium text-slate-700">#—</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Vehicle</span><span className="h-4 bg-slate-200 rounded w-24 animate-pulse inline-block" />
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Duration</span><span>—</span>
          </div>
          <div className="flex justify-between font-semibold text-slate-900">
            <span>Amount Paid</span><span>₹—</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Link to="/my-bookings" className="btn-primary w-full">View My Bookings</Link>
        <Link to="/" className="btn-ghost w-full">Back to Browse</Link>
      </div>
    </div>
  );
}
