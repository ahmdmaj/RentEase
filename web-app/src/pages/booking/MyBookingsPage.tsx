const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const MOCK_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];

export default function MyBookingsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="page-title">My Bookings</h1>
        <p className="page-subtitle">Track all your vehicle rental bookings</p>
      </div>

      <div className="space-y-4">
        {MOCK_STATUSES.map((status, i) => (
          <div key={i} className="card flex gap-4 items-center">
            <div className="w-20 h-16 bg-slate-200 rounded-xl animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-slate-200 rounded w-1/2 animate-pulse" />
              <div className="h-4 bg-slate-100 rounded w-1/3 animate-pulse" />
            </div>
            <span className={`badge ${STATUS_COLORS[status]} capitalize`}>{status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
