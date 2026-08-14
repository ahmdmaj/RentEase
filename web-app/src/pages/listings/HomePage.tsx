export default function HomePage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="page-title">Browse Vehicles</h1>
        <p className="page-subtitle">Find the perfect vehicle for your next trip</p>
      </div>

      {/* Search & Filter Bar */}
      <div className="card mb-8 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="🔍  Search by city, vehicle name..."
          className="input flex-1"
        />
        <select className="input sm:w-44">
          <option value="">All Types</option>
          <option value="car">Car</option>
          <option value="bike">Bike</option>
          <option value="scooter">Scooter</option>
          <option value="suv">SUV</option>
        </select>
        <button className="btn-primary">Search</button>
      </div>

      {/* Vehicle Grid Placeholder */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="card p-0 overflow-hidden animate-pulse">
            <div className="h-44 bg-slate-200 rounded-t-2xl" />
            <div className="p-4 space-y-2">
              <div className="h-4 bg-slate-200 rounded w-3/4" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
              <div className="h-5 bg-slate-200 rounded w-1/3 mt-3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
