import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { Vehicle, VehicleImage } from '../../lib/types';

const FUEL_TYPES = ['Petrol', 'Diesel', 'Hybrid', 'Electric'];
const TRANSMISSIONS = ['Automatic', 'Manual'];

export default function EditVehiclePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    make: '', model: '', year: '', transmission: '',
    fuel_type: '', seating_capacity: '', location: '',
    price_per_day: '', description: '', is_available: true,
  });
  const [existingImages, setExistingImages] = useState<VehicleImage[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  useEffect(() => {
    if (!id || !user) return;
    const fetch = async () => {
      const { data, error: err } = await supabase
        .from('vehicles')
        .select('*, vehicle_images(id, image_url, display_order)')
        .eq('id', id)
        .eq('owner_id', user.id)
        .single();

      if (err || !data) { setError('Vehicle not found or access denied.'); setLoading(false); return; }

      const v = data as Vehicle;
      setVehicle(v);
      setForm({
        make: v.make, model: v.model, year: v.year ? String(v.year) : '',
        transmission: v.transmission ?? '', fuel_type: v.fuel_type ?? '',
        seating_capacity: v.seating_capacity ? String(v.seating_capacity) : '',
        location: v.location, price_per_day: String(v.price_per_day),
        description: v.description ?? '', is_available: v.is_available,
      });
      setExistingImages(
        (v.vehicle_images ?? []).sort((a, b) => a.display_order - b.display_order)
      );
      setLoading(false);
    };
    fetch();
  }, [id, user]);

  const removeExistingImage = async (img: VehicleImage) => {
    await supabase.from('vehicle_images').delete().eq('id', img.id);
    setExistingImages((prev) => prev.filter((i) => i.id !== img.id));
  };

  const handleNewImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const remaining = 5 - existingImages.length - newImages.length;
    const toAdd = files.slice(0, remaining);
    setNewImages((prev) => [...prev, ...toAdd]);
    setNewPreviews((prev) => [...prev, ...toAdd.map((f) => URL.createObjectURL(f))]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user) return;
    setError('');
    setSubmitting(true);

    const { error: updateErr } = await supabase
      .from('vehicles')
      .update({
        make: form.make.trim(), model: form.model.trim(),
        year: form.year ? parseInt(form.year) : null,
        transmission: form.transmission || null,
        fuel_type: form.fuel_type || null,
        seating_capacity: form.seating_capacity ? parseInt(form.seating_capacity) : null,
        location: form.location.trim(),
        price_per_day: parseFloat(form.price_per_day),
        description: form.description.trim() || null,
        is_available: form.is_available,
      })
      .eq('id', id)
      .eq('owner_id', user.id);

    if (updateErr) { setError(updateErr.message); setSubmitting(false); return; }

    // Upload new images
    for (let i = 0; i < newImages.length; i++) {
      const file = newImages[i];
      const ext = file.name.split('.').pop();
      const path = `${id}/${Date.now()}_new_${i}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('vehicle-images').upload(path, file, { upsert: true });
      if (uploadErr) continue;
      const { data: urlData } = supabase.storage.from('vehicle-images').getPublicUrl(path);
      await supabase.from('vehicle_images').insert({
        vehicle_id: id,
        image_url: urlData.publicUrl,
        display_order: existingImages.length + i,
      });
    }

    navigate('/my-listings');
  };

  if (loading) return (
    <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
      <div className="h-7 bg-slate-200 rounded w-48" />
      <div className="card h-64" />
    </div>
  );

  if (error && !vehicle) return (
    <div className="max-w-2xl mx-auto text-center py-20">
      <p className="text-slate-500">{error}</p>
      <Link to="/my-listings" className="btn-primary mt-4 inline-block">Back to Listings</Link>
    </div>
  );

  const totalImages = existingImages.length + newImages.length;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Link to="/my-listings" className="text-sm text-slate-500 hover:text-primary-600 mb-2 inline-block">← Back to listings</Link>
        <h1 className="page-title">Edit Vehicle</h1>
        <p className="page-subtitle">Update your listing for {vehicle?.make} {vehicle?.model}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">⚠️ {error}</div>
        )}

        {/* Vehicle Details */}
        <div className="card space-y-5">
          <h2 className="font-semibold text-slate-900">Vehicle Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="make">Make</label>
              <input id="make" type="text" className="input" value={form.make} onChange={set('make')} required />
            </div>
            <div>
              <label className="label" htmlFor="model">Model</label>
              <input id="model" type="text" className="input" value={form.model} onChange={set('model')} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="year">Year</label>
              <input id="year" type="number" className="input" value={form.year} onChange={set('year')} />
            </div>
            <div>
              <label className="label" htmlFor="seats">Seats</label>
              <input id="seats" type="number" className="input" value={form.seating_capacity} onChange={set('seating_capacity')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="transmission">Transmission</label>
              <select id="transmission" className="input" value={form.transmission} onChange={set('transmission')}>
                <option value="">Select...</option>
                {TRANSMISSIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="fuel">Fuel Type</label>
              <select id="fuel" className="input" value={form.fuel_type} onChange={set('fuel_type')}>
                <option value="">Select...</option>
                {FUEL_TYPES.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Pricing & Location */}
        <div className="card space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Pricing & Location</h2>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <span className="text-sm text-slate-600">Available</span>
              <div
                onClick={() => setForm((p) => ({ ...p, is_available: !p.is_available }))}
                className={`w-10 h-6 rounded-full transition-colors ${form.is_available ? 'bg-primary-600' : 'bg-slate-300'} relative`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_available ? 'translate-x-5' : 'translate-x-1'}`} />
              </div>
            </label>
          </div>
          <div>
            <label className="label" htmlFor="price">Price Per Day (LKR)</label>
            <input id="price" type="number" className="input" value={form.price_per_day} onChange={set('price_per_day')} required />
          </div>
          <div>
            <label className="label" htmlFor="location">Location</label>
            <input id="location" type="text" className="input" value={form.location} onChange={set('location')} required />
          </div>
          <div>
            <label className="label" htmlFor="description">Description</label>
            <textarea id="description" className="input resize-none" rows={4} value={form.description} onChange={set('description')} />
          </div>
        </div>

        {/* Images */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-slate-900">Photos <span className="text-slate-400 font-normal">({totalImages}/5)</span></h2>

          {/* Existing */}
          {existingImages.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {existingImages.map((img, i) => (
                <div key={img.id} className="relative h-24 rounded-xl overflow-hidden">
                  <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(img)}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full text-xs flex items-center justify-center hover:bg-black/80"
                  >✕</button>
                  {i === 0 && <span className="absolute bottom-1 left-1 text-xs bg-primary-600 text-white px-1.5 py-0.5 rounded-md">Cover</span>}
                </div>
              ))}
            </div>
          )}

          {/* New previews */}
          {newPreviews.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {newPreviews.map((src, i) => (
                <div key={i} className="relative h-24 rounded-xl overflow-hidden">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => { setNewImages((p) => p.filter((_, j) => j !== i)); setNewPreviews((p) => p.filter((_, j) => j !== i)); }}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full text-xs flex items-center justify-center"
                  >✕</button>
                  <span className="absolute bottom-1 left-1 text-xs bg-yellow-500 text-white px-1.5 py-0.5 rounded-md">New</span>
                </div>
              ))}
            </div>
          )}

          {totalImages < 5 && (
            <>
              <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center text-slate-400 hover:border-primary-300 hover:text-primary-400 transition-colors cursor-pointer">
                <div className="text-2xl mb-1">📷</div>
                <p className="text-sm font-medium">Click to add photos</p>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleNewImages} />
            </>
          )}
        </div>

        <div className="flex gap-3">
          <button type="submit" className="btn-primary flex-1 py-3 text-base" disabled={submitting}>
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </span>
            ) : 'Save Changes'}
          </button>
          <Link to="/my-listings" className="btn-ghost px-5">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
