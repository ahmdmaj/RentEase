const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function OwnerBookingsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="page-title">Booking Requests</h1>
        <p className="page-subtitle">Review and manage rental requests for your vehicles</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {['All', 'Pending', 'Confirmed', 'Completed'].map((tab) => (
          <button
            key={tab}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              tab === 'All'
                ? 'bg-primary-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {['pending', 'pending', 'confirmed'].map((status, i) => (
          <div key={i} className="card">
            <div className="flex gap-4 items-start">
              <div className="w-16 h-16 bg-slate-200 rounded-xl animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="h-5 bg-slate-200 rounded w-1/3 animate-pulse" />
                  <span className={`badge ${STATUS_COLORS[status]} capitalize`}>{status}</span>
                </div>
                <div className="h-4 bg-slate-100 rounded w-2/3 animate-pulse" />
                <div className="h-4 bg-slate-100 rounded w-1/4 animate-pulse" />
              </div>
            </div>
            {status === 'pending' && (
              <div className="flex gap-3 mt-4 pt-4 border-t border-slate-100">
                <button className="btn-primary text-sm py-2 px-4">✓ Accept</button>
                <button className="btn-ghost text-sm text-red-500 hover:bg-red-50">✕ Decline</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
