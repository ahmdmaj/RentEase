export default function PaymentPage() {
  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-8">
        <h1 className="page-title">Payment</h1>
        <p className="page-subtitle">Complete your booking payment securely</p>
      </div>

      {/* Order Summary */}
      <div className="card mb-6">
        <h2 className="font-semibold text-slate-900 mb-4">Order Summary</h2>
        <div className="flex gap-4 items-center mb-4">
          <div className="w-16 h-14 bg-slate-200 rounded-xl animate-pulse flex-shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-slate-200 rounded w-2/3 animate-pulse" />
            <div className="h-3 bg-slate-100 rounded w-1/2 animate-pulse" />
          </div>
        </div>
        <div className="space-y-2 text-sm border-t border-slate-100 pt-4">
          <div className="flex justify-between text-slate-500"><span>Duration</span><span>— days</span></div>
          <div className="flex justify-between text-slate-500"><span>Rate</span><span>₹— /day</span></div>
          <div className="flex justify-between font-bold text-slate-900 border-t border-slate-100 pt-2 mt-2">
            <span>Total Amount</span><span>₹—</span>
          </div>
        </div>
      </div>

      {/* Pay Button */}
      <div className="card text-center space-y-4">
        <div className="text-4xl">💳</div>
        <p className="text-slate-500 text-sm">
          You'll be redirected to Razorpay's secure payment gateway.
        </p>
        <button className="btn-primary w-full text-base py-3">
          Pay with Razorpay →
        </button>
        <button className="btn-ghost w-full text-sm" onClick={() => history.back()}>
          ← Go Back
        </button>
      </div>
    </div>
  );
}
