import { useParams } from 'react-router-dom';

export default function BookingPage() {
  const { id } = useParams();

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="page-title">Confirm Booking</h1>
        <p className="page-subtitle">Review your booking details before paying</p>
      </div>

      {/* Vehicle Summary */}
      <div className="card mb-6 flex gap-4 items-center">
        <div className="w-20 h-16 bg-slate-200 rounded-xl animate-pulse flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-slate-200 rounded w-3/4 animate-pulse" />
          <div className="h-4 bg-slate-100 rounded w-1/2 animate-pulse" />
        </div>
      </div>

      {/* Booking Form */}
      <div className="card space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="startDate">Pick-up Date</label>
            <input id="startDate" type="date" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="endDate">Return Date</label>
            <input id="endDate" type="date" className="input" />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="notes">Notes for Owner (optional)</label>
          <textarea id="notes" className="input resize-none" rows={3} placeholder="Any special requests?" />
        </div>

        {/* Price Breakdown */}
        <div className="bg-slate-50 rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm text-slate-500">
            <span>Days</span><span>—</span>
          </div>
          <div className="flex justify-between text-sm text-slate-500">
            <span>Price per day</span><span>—</span>
          </div>
          <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-900">
            <span>Total</span><span>—</span>
          </div>
        </div>

        <button className="btn-primary w-full text-base py-3">
          Proceed to Payment →
        </button>
      </div>

      <p className="text-xs text-slate-400 mt-4">Vehicle ID: {id}</p>
    </div>
  );
}
