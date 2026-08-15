import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { Vehicle } from '../../lib/types';

export default function MyListingsPage() {
  const { user } = useAuth();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchVehicles = async () => {
    if (!user) return;
    setLoading(true);
    setError('');

    const { data, error: err } = await supabase
      .from('vehicles')
      .select('*, vehicle_images(id, image_url, display_order)')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    if (err) { setError('Failed to load listings.'); setLoading(false); return; }

    const results = (data ?? []) as Vehicle[];
    setVehicles(results.map((v) => ({
      ...v,
      vehicle_images: v.vehicle_images?.sort((a, b) => a.display_order - b.display_order),
    })));
    setLoading(false);
  };

  useEffect(() => { fetchVehicles(); }, [user]);

  const handleDelete = async (vehicleId: string) => {
    if (!confirm('Delete this listing? This cannot be undone.')) return;
    setDeletingId(vehicleId);

    const { error: err } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', vehicleId)
      .eq('owner_id', user!.id);

    if (err) {
      alert('Failed to delete: ' + err.message);
    } else {
      setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
    }
    setDeletingId(null);
  };

  const toggleAvailability = async (vehicle: Vehicle) => {
    const { error: err } = await supabase
      .from('vehicles')
      .update({ is_available: !vehicle.is_available })
      .eq('id', vehicle.id)
      .eq('owner_id', user!.id);

    if (!err) {
      setVehicles((prev) =>
        prev.map((v) => v.id === vehicle.id ? { ...v, is_available: !v.is_available } : v)
      );
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <h1 className="page-title">My Listings</h1>
          <p className="page-subtitle">Manage your vehicles for rent</p>
        </div>
        <Link to="/add-vehicle" className="btn-primary">+ Add Vehicle</Link>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-0 overflow-hidden animate-pulse">
              <div className="h-44 bg-slate-200 rounded-t-2xl" />
              <div className="p-4 space-y-3">
                <div className="h-5 bg-slate-200 rounded w-3/4" />
                <div className="h-4 bg-slate-100 rounded w-1/2" />
                <div className="flex gap-2 pt-2">
                  <div className="h-8 bg-slate-100 rounded-lg flex-1" />
                  <div className="h-8 bg-red-50 rounded-lg w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : vehicles.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🚗</div>
          <h2 className="text-lg font-semibold text-slate-700 mb-2">No vehicles listed yet</h2>
          <p className="text-slate-400 text-sm mb-6">Add your first vehicle to start receiving bookings.</p>
          <Link to="/add-vehicle" className="btn-primary">+ Add Your First Vehicle</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle) => {
            const thumb = vehicle.vehicle_images?.[0]?.image_url ?? null;
            const isDeleting = deletingId === vehicle.id;

            return (
              <div key={vehicle.id} className="card p-0 overflow-hidden">
                {/* Thumbnail */}
                <div className="h-44 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center rounded-t-2xl overflow-hidden relative">
                  {thumb ? (
                    <img src={thumb} alt={`${vehicle.make} ${vehicle.model}`} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl font-bold text-slate-300">{vehicle.make[0]}{vehicle.model[0]}</span>
                  )}
                  {/* Availability toggle */}
                  <button
                    onClick={() => toggleAvailability(vehicle)}
                    className={`absolute top-3 right-3 badge cursor-pointer transition-colors ${vehicle.is_available ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
                  >
                    {vehicle.is_available ? '● Available' : '● Unavailable'}
                  </button>
                </div>

                <div className="p-4">
                  <p className="font-bold text-slate-900 truncate">{vehicle.make} {vehicle.model}</p>
                  <p className="text-slate-400 text-xs mt-0.5">📍 {vehicle.location}</p>
                  <p className="text-primary-600 font-semibold text-sm mt-1">
                    LKR {vehicle.price_per_day.toLocaleString()} / day
                  </p>

                  <div className="flex gap-2 mt-4">
                    <Link
                      to={`/edit-vehicle/${vehicle.id}`}
                      className="btn-outline text-sm py-1.5 px-3 flex-1 text-center"
                    >
                      ✏️ Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(vehicle.id)}
                      disabled={isDeleting}
                      className="btn-ghost text-sm py-1.5 px-3 text-red-500 hover:bg-red-50 hover:text-red-600"
                    >
                      {isDeleting ? '...' : '🗑️'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
