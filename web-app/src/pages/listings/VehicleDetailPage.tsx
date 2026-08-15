import { useParams } from 'react-router-dom';

export default function VehicleDetailPage() {
  const { id } = useParams();

  return (
    <div>
      {/* Back button */}
      <button onClick={() => history.back()} className="btn-ghost mb-6">
        ← Back to listings
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Images + Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image */}
          <div className="w-full h-72 bg-slate-200 rounded-2xl animate-pulse" />

          {/* Info Card */}
          <div className="card space-y-4">
            <div className="h-7 bg-slate-200 rounded w-2/3 animate-pulse" />
            <div className="h-4 bg-slate-100 rounded w-1/3 animate-pulse" />
            <div className="h-4 bg-slate-100 rounded w-full animate-pulse" />
            <div className="h-4 bg-slate-100 rounded w-3/4 animate-pulse" />
          </div>
        </div>

        {/* Right: Booking Card */}
        <div className="card h-fit space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Book this vehicle</h2>
          <div className="h-4 bg-slate-200 rounded w-1/2 animate-pulse" />
          <div className="space-y-3">
            <div>
              <label className="label">Pick-up Date</label>
              <input type="date" className="input" />
            </div>
            <div>
              <label className="label">Return Date</label>
              <input type="date" className="input" />
            </div>
          </div>
          <div className="border-t border-slate-100 pt-4">
            <div className="flex justify-between text-sm text-slate-500 mb-1">
              <span>Price per day</span>
              <span className="h-4 bg-slate-200 rounded w-16 animate-pulse inline-block" />
            </div>
            <div className="flex justify-between font-bold text-slate-900">
              <span>Total</span>
              <span>—</span>
            </div>
          </div>
          <button className="btn-primary w-full">Book Now</button>
          <button className="btn-outline w-full">💬 Chat with Owner</button>
        </div>
      </div>

      <p className="text-xs text-slate-400 mt-2">Vehicle ID: {id}</p>
    </div>
  );
}
