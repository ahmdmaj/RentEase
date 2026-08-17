import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { Vehicle } from '../../lib/types';

const VEHICLE_TYPES = ['All', 'Car', 'Bike', 'Scooter', 'SUV'];

function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const thumb = vehicle.vehicle_images?.[0]?.image_url ?? null;
  const initials = `${vehicle.make[0]}${vehicle.model[0]}`.toUpperCase();

  return (
    <Link
      to={`/vehicle/${vehicle.id}`}
      className="card p-0 overflow-hidden group hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
    >
      {/* Thumbnail */}
      <div className="h-44 bg-gradient-to-br from-slate-100 to-slate-200 relative overflow-hidden rounded-t-2xl">
        {thumb ? (
          <img
            src={thumb}
            alt={`${vehicle.make} ${vehicle.model}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl font-bold text-slate-300">{initials}</span>
          </div>
        )}
        {/* Availability badge */}
        <span className={`absolute top-3 right-3 badge ${vehicle.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
          {vehicle.is_available ? 'Available' : 'Unavailable'}
        </span>
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="font-bold text-slate-900 truncate">
          {vehicle.make} {vehicle.model}
          {vehicle.year ? ` ${vehicle.year}` : ''}
        </p>
        <p className="text-slate-400 text-xs mt-0.5 flex items-center gap-1">
          <span>📍</span> {vehicle.location}
        </p>

        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {vehicle.fuel_type && (
            <span className="badge bg-slate-100 text-slate-600 text-xs">{vehicle.fuel_type}</span>
          )}
          {vehicle.transmission && (
            <span className="badge bg-slate-100 text-slate-600 text-xs">{vehicle.transmission}</span>
          )}
          {vehicle.seating_capacity && (
            <span className="badge bg-slate-100 text-slate-600 text-xs">💺 {vehicle.seating_capacity}</span>
          )}
        </div>

        <div className="mt-3 flex items-baseline gap-1">
          <span className="text-lg font-bold text-primary-600">
            LKR {vehicle.price_per_day.toLocaleString()}
          </span>
          <span className="text-slate-400 text-xs">/ day</span>
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="card p-0 overflow-hidden animate-pulse">
      <div className="h-44 bg-slate-200 rounded-t-2xl" />
      <div className="p-4 space-y-2">
        <div className="h-5 bg-slate-200 rounded w-3/4" />
        <div className="h-3 bg-slate-100 rounded w-1/2" />
        <div className="h-3 bg-slate-100 rounded w-1/3 mt-3" />
        <div className="h-5 bg-slate-200 rounded w-2/5 mt-2" />
      </div>
    </div>
  );
}

export default function HomePage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [error, setError] = useState('');

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    setError('');

    let query = supabase
      .from('vehicles')
      .select('*, vehicle_images(id, image_url, display_order)')
      .eq('is_available', true)
      .order('created_at', { ascending: false });

    if (search.trim()) {
      query = query.or(`make.ilike.%${search.trim()}%,model.ilike.%${search.trim()}%,location.ilike.%${search.trim()}%`);
    }

    const { data, error: err } = await query;

    if (err) {
      setError('Failed to load vehicles. Please try again.');
      setLoading(false);
      return;
    }

    let results = (data ?? []) as Vehicle[];

    // Client-side type filter (vehicles table has no "type" column — we filter by make/model pattern if needed)
    // For now, type filter is a placeholder for future vehicle_type column
    if (typeFilter !== 'All') {
      // Future: filter by vehicle_type column once added
    }

    // Sort images by display_order
    results = results.map((v) => ({
      ...v,
      vehicle_images: v.vehicle_images?.sort((a, b) => a.display_order - b.display_order),
    }));

    setVehicles(results);
    setLoading(false);
  }, [search, typeFilter]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVehicles();
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="page-title">Browse Vehicles</h1>
        <p className="page-subtitle">Find the perfect vehicle for your next trip</p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-8 relative flex items-center w-full bg-white shadow-sm hover:shadow-md transition-all duration-300 border border-slate-200 rounded-full p-1.5 focus-within:border-primary-400 focus-within:ring-4 focus-within:ring-primary-50">
        <div className="pl-4 pr-2 text-slate-400 flex items-center pointer-events-none">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search by make, model or city..."
          className="flex-1 bg-transparent border-none text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 text-base sm:text-lg h-12 px-2"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit" className="bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-semibold h-12 px-8 rounded-full transition-colors flex-shrink-0 ml-2 shadow-sm">
          Search
        </button>
      </form>

      {/* Type Filter Pills */}
      <div className="flex gap-2 flex-wrap mb-6">
        {VEHICLE_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setTypeFilter(type)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150 ${
              typeFilter === type
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-center gap-2">
          <span>⚠️</span> {error}
          <button onClick={fetchVehicles} className="ml-auto text-red-500 underline text-xs">Retry</button>
        </div>
      )}

      {/* Vehicle Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : vehicles.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🚗</div>
          <h2 className="text-lg font-semibold text-slate-700 mb-2">No vehicles found</h2>
          <p className="text-slate-400 text-sm">
            {search ? `No results for "${search}". Try a different search.` : 'No available vehicles at the moment. Check back soon!'}
          </p>
          {search && (
            <button onClick={() => setSearch('')} className="btn-outline mt-4 text-sm">
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-400 mb-4">{vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} available</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {vehicles.map((v) => <VehicleCard key={v.id} vehicle={v} />)}
          </div>
        </>
      )}
    </div>
  );
}
