import { Link } from 'react-router-dom';

export default function MyListingsPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title">My Listings</h1>
          <p className="page-subtitle">Manage your vehicles for rent</p>
        </div>
        <Link to="/add-vehicle" className="btn-primary">+ Add Vehicle</Link>
      </div>

      {/* Placeholder listings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card p-0 overflow-hidden">
            <div className="h-44 bg-slate-200 animate-pulse rounded-t-2xl" />
            <div className="p-4 space-y-3">
              <div className="h-5 bg-slate-200 rounded w-3/4 animate-pulse" />
              <div className="h-4 bg-slate-100 rounded w-1/2 animate-pulse" />
              <div className="flex gap-2 pt-2">
                <div className="h-8 bg-slate-100 rounded-lg w-20 animate-pulse" />
                <div className="h-8 bg-red-50 rounded-lg w-20 animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
