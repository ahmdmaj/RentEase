import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const FUEL_TYPES = ['Petrol', 'Diesel', 'Hybrid', 'Electric'];
const TRANSMISSIONS = ['Automatic', 'Manual'];

export default function AddVehiclePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    make: '',
    model: '',
    year: '',
    transmission: '',
    fuel_type: '',
    seating_capacity: '',
    location: '',
    price_per_day: '',
    description: '',
  });
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setImages((prev) => [...prev, ...files].slice(0, 5));
    const newPreviews = files.map((f) => URL.createObjectURL(f));
    setImagePreviews((prev) => [...prev, ...newPreviews].slice(0, 5));
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');
    setSubmitting(true);

    // 1. Insert vehicle
    const { data: vehicleData, error: vehicleErr } = await supabase
      .from('vehicles')
      .insert({
        owner_id: user.id,
        make: form.make.trim(),
        model: form.model.trim(),
        year: form.year ? parseInt(form.year) : null,
        transmission: form.transmission || null,
        fuel_type: form.fuel_type || null,
        seating_capacity: form.seating_capacity ? parseInt(form.seating_capacity) : null,
        location: form.location.trim(),
        price_per_day: parseFloat(form.price_per_day),
        description: form.description.trim() || null,
        is_available: true,
      })
      .select()
      .single();

    if (vehicleErr || !vehicleData) {
      setError(vehicleErr?.message ?? 'Failed to create vehicle listing.');
      setSubmitting(false);
      return;
    }

    const vehicleId = vehicleData.id as string;

    // 2. Upload images to Supabase Storage and insert records
    if (images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        const file = images[i];
        const ext = file.name.split('.').pop();
        const path = `${vehicleId}/${Date.now()}_${i}.${ext}`;

        const { error: uploadErr } = await supabase.storage
          .from('vehicle-images')
          .upload(path, file, { upsert: true });

        if (uploadErr) continue; // skip failed uploads

        const { data: urlData } = supabase.storage
          .from('vehicle-images')
          .getPublicUrl(path);

        await supabase.from('vehicle_images').insert({
          vehicle_id: vehicleId,
          image_url: urlData.publicUrl,
          display_order: i,
        });
      }
    }

    navigate('/my-listings');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Link to="/my-listings" className="text-sm text-slate-500 hover:text-primary-600 mb-2 inline-block">← Back to listings</Link>
        <h1 className="page-title">Add a Vehicle</h1>
        <p className="page-subtitle">List your vehicle for rent on RentEase</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Basic Info */}
        <div className="card space-y-5">
          <h2 className="font-semibold text-slate-900">Vehicle Details</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="make">Make <span className="text-red-500">*</span></label>
              <input id="make" type="text" className="input" placeholder="e.g. Toyota" value={form.make} onChange={set('make')} required />
            </div>
            <div>
              <label className="label" htmlFor="model">Model <span className="text-red-500">*</span></label>
              <input id="model" type="text" className="input" placeholder="e.g. Axio" value={form.model} onChange={set('model')} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="year">Year</label>
              <input id="year" type="number" className="input" placeholder="e.g. 2021" min="1990" max={new Date().getFullYear()} value={form.year} onChange={set('year')} />
            </div>
            <div>
              <label className="label" htmlFor="seating_capacity">Seats</label>
              <input id="seating_capacity" type="number" className="input" placeholder="e.g. 5" min="1" max="50" value={form.seating_capacity} onChange={set('seating_capacity')} />
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
              <label className="label" htmlFor="fuel_type">Fuel Type</label>
              <select id="fuel_type" className="input" value={form.fuel_type} onChange={set('fuel_type')}>
                <option value="">Select...</option>
                {FUEL_TYPES.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Pricing & Location */}
        <div className="card space-y-5">
          <h2 className="font-semibold text-slate-900">Pricing & Location</h2>

          <div>
            <label className="label" htmlFor="price_per_day">Price Per Day (LKR) <span className="text-red-500">*</span></label>
            <input id="price_per_day" type="number" className="input" placeholder="e.g. 4500" min="1" step="0.01" value={form.price_per_day} onChange={set('price_per_day')} required />
          </div>

          <div>
            <label className="label" htmlFor="location">Location / City <span className="text-red-500">*</span></label>
            <input id="location" type="text" className="input" placeholder="e.g. Colombo 03" value={form.location} onChange={set('location')} required />
          </div>

          <div>
            <label className="label" htmlFor="description">Description</label>
            <textarea
              id="description"
              className="input resize-none"
              rows={4}
              placeholder="Describe your vehicle — condition, features, rental terms, etc."
              value={form.description}
              onChange={set('description')}
            />
          </div>
        </div>

        {/* Image Upload */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-slate-900">Photos <span className="text-slate-400 font-normal">(up to 5)</span></h2>

          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {imagePreviews.map((src, i) => (
                <div key={i} className="relative h-24 rounded-xl overflow-hidden">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full text-xs flex items-center justify-center hover:bg-black/80"
                  >
                    ✕
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-1 left-1 text-xs bg-primary-600 text-white px-1.5 py-0.5 rounded-md">Cover</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {imagePreviews.length < 5 && (
            <>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400 hover:border-primary-300 hover:text-primary-400 transition-colors cursor-pointer"
              >
                <div className="text-3xl mb-2">📷</div>
                <p className="text-sm font-medium">Click to upload photos</p>
                <p className="text-xs mt-1">PNG, JPG, WEBP · up to 5 photos</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageChange}
              />
            </>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button type="submit" className="btn-primary flex-1 py-3 text-base" disabled={submitting}>
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Publishing...
              </span>
            ) : '🚗 Publish Listing'}
          </button>
          <Link to="/my-listings" className="btn-ghost px-5">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
