import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { Vehicle } from '../../lib/types';

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImg, setActiveImg] = useState(0);
  const [startingChat, setStartingChat] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchVehicle = async () => {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('vehicles')
        .select('*, profiles(full_name, phone), vehicle_images(id, image_url, display_order)')
        .eq('id', id)
        .single();

      if (err || !data) {
        setError('Vehicle not found.');
        setLoading(false);
        return;
      }

      const v = data as Vehicle;
      v.vehicle_images = v.vehicle_images?.sort((a, b) => a.display_order - b.display_order);
      setVehicle(v);
      setLoading(false);
    };

    fetchVehicle();
  }, [id]);

  const handleStartChat = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!vehicle) return;

    if (user.id === vehicle.owner_id) {
      alert('You are the owner of this vehicle listing.');
      return;
    }

    setStartingChat(true);

    try {
      // 1. Check if conversation already exists
      const { data: existing, error: findErr } = await supabase
        .from('conversations')
        .select('id')
        .eq('vehicle_id', vehicle.id)
        .eq('renter_id', user.id)
        .eq('owner_id', vehicle.owner_id)
        .maybeSingle();

      if (!findErr && existing?.id) {
        navigate(`/chat/${existing.id}`);
        return;
      }

      // 2. Create new conversation
      const { data: newConv, error: createErr } = await supabase
        .from('conversations')
        .insert({
          vehicle_id: vehicle.id,
          renter_id: user.id,
          owner_id: vehicle.owner_id,
        })
        .select('id')
        .single();

      if (createErr) throw createErr;
      navigate(`/chat/${newConv.id}`);
    } catch (err: any) {
      alert('Failed to start chat: ' + err.message);
    } finally {
      setStartingChat(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="h-5 bg-slate-200 rounded w-32 mb-6 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-4">
            <div className="h-72 bg-slate-200 rounded-2xl animate-pulse" />
            <div className="card space-y-3">
              {[3, 2, 4, 3].map((w, i) => (
                <div key={i} className={`h-4 bg-slate-200 rounded animate-pulse`} style={{ width: `${w * 25}%` }} />
              ))}
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="card space-y-4 animate-pulse">
              {[2, 3, 4, 2, 2].map((w, i) => (
                <div key={i} className={`h-5 bg-slate-200 rounded`} style={{ width: `${w * 25}%` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="max-w-5xl mx-auto text-center py-20">
        <div className="text-5xl mb-4">😕</div>
        <h2 className="text-lg font-semibold text-slate-700 mb-2">{error || 'Vehicle not found'}</h2>
        <Link to="/" className="btn-primary mt-4">Back to Browse</Link>
      </div>
    );
  }

  const images = vehicle.vehicle_images ?? [];
  const currentImg = images[activeImg]?.image_url ?? null;

  const specs = [
    { label: 'Fuel', value: vehicle.fuel_type, icon: '⛽' },
    { label: 'Transmission', value: vehicle.transmission, icon: '⚙️' },
    { label: 'Seats', value: vehicle.seating_capacity ? `${vehicle.seating_capacity}` : null, icon: '💺' },
    { label: 'Year', value: vehicle.year ? `${vehicle.year}` : null, icon: '📅' },
    { label: 'Location', value: vehicle.location, icon: '📍' },
  ].filter((s) => s.value);

  const isOwner = user?.id === vehicle.owner_id;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600 mb-6 transition-colors">
        ← Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left — Images + Details */}
        <div className="lg:col-span-3 space-y-6">
          {/* Main Image */}
          <div className="card p-0 overflow-hidden">
            <div className="h-72 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center rounded-t-2xl overflow-hidden">
              {currentImg ? (
                <img src={currentImg} alt={`${vehicle.make} ${vehicle.model}`} className="w-full h-full object-cover" />
              ) : (
                <span className="text-6xl font-bold text-slate-300">
                  {vehicle.make[0]}{vehicle.model[0]}
                </span>
              )}
            </div>
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 p-4">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImg(i)}
                    className={`h-14 w-20 rounded-lg overflow-hidden border-2 transition-all ${i === activeImg ? 'border-primary-500' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          {vehicle.description && (
            <div className="card space-y-3">
              <h2 className="text-lg font-semibold text-slate-900">About this vehicle</h2>
              <p className="text-slate-500 text-sm leading-relaxed">{vehicle.description}</p>
            </div>
          )}

          {/* Specs */}
          {specs.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Specifications</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {specs.map((spec) => (
                  <div key={spec.label} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <span className="text-xl">{spec.icon}</span>
                    <div>
                      <p className="text-xs text-slate-400 font-medium">{spec.label}</p>
                      <p className="text-sm font-semibold text-slate-800">{spec.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right — Booking Card */}
        <div className="lg:col-span-2">
          <div className="card sticky top-24 space-y-4">
            <div>
              <span className={`badge mb-2 ${vehicle.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                {vehicle.is_available ? '● Available' : '● Unavailable'}
              </span>
              <h1 className="text-xl font-bold text-slate-900 mt-1">
                {vehicle.make} {vehicle.model}
              </h1>
              <p className="text-slate-400 text-sm mt-0.5">
                Listed by <span className="font-medium text-slate-600">{vehicle.profiles?.full_name ?? 'Owner'}</span>
              </p>
            </div>

            <div className="flex items-baseline gap-1 py-2 border-y border-slate-100">
              <span className="text-3xl font-bold text-primary-600">
                LKR {vehicle.price_per_day.toLocaleString()}
              </span>
              <span className="text-slate-400 text-sm">/ day</span>
            </div>

            {isOwner ? (
              <div className="space-y-2 pt-2">
                <Link
                  to={`/edit-vehicle/${vehicle.id}`}
                  className="btn-primary w-full text-center block"
                >
                  ✏️ Edit My Listing
                </Link>
                <Link
                  to="/my-listings"
                  className="btn-outline w-full text-center block"
                >
                  View All Listings
                </Link>
              </div>
            ) : vehicle.is_available ? (
              <div className="space-y-3 pt-2">
                <Link
                  to={`/book/${vehicle.id}`}
                  className="btn-primary w-full text-center block text-base py-3"
                >
                  Book Now
                </Link>

                <button
                  type="button"
                  onClick={handleStartChat}
                  disabled={startingChat}
                  className="btn-outline w-full text-center flex items-center justify-center gap-2"
                >
                  {startingChat ? (
                    <span className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>💬</span>
                  )}
                  <span>Chat with Owner</span>
                </button>

                <p className="text-center text-xs text-slate-400">
                  You won't be charged until the owner approves.
                </p>
              </div>
            ) : (
              <div className="text-center py-3 px-4 bg-red-50 rounded-xl text-sm text-red-600 font-medium">
                This vehicle is currently unavailable
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
