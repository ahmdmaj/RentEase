import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export default function ProfilePage() {
  const { profile, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [saveError, setSaveError] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg('');
    setSaveError('');

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim(), phone: phone.trim() || null })
      .eq('id', profile!.id);

    if (error) {
      setSaveError(error.message);
    } else {
      await refreshProfile();
      setSaveMsg('Profile updated successfully!');
    }
    setSaving(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const initial = profile?.full_name?.charAt(0)?.toUpperCase() ?? '?';
  const isRenter = profile?.role === 'renter';
  const isOwner = profile?.role === 'owner';

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">Manage your account details and preferences</p>
      </div>

      {/* Avatar + Name Card */}
      <div className="card flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-2xl flex-shrink-0 shadow-sm">
          {initial}
        </div>
        <div>
          <p className="text-xl font-bold text-slate-900">{profile?.full_name ?? '—'}</p>
          <p className="text-slate-500 text-sm">{profile?.email ?? '—'}</p>
          <span className="badge bg-primary-100 text-primary-700 mt-1.5 capitalize font-semibold">
            {profile?.role ?? 'renter'}
          </span>
        </div>
      </div>

      {/* Become an Owner Card for Renters */}
      {isRenter && (
        <div className="card p-6 border-emerald-200 bg-gradient-to-br from-emerald-50/60 to-white flex items-center justify-between gap-4 flex-col sm:flex-row">
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <span className="text-xl">💼</span>
              <h3 className="font-bold text-slate-900 text-base">Earn as a Vehicle Owner</h3>
            </div>
            <p className="text-slate-600 text-xs leading-relaxed max-w-sm">
              List your cars, bikes, or SUVs and earn money on your own schedule with verified renters.
            </p>
          </div>
          <Link
            to="/become-owner"
            className="btn-primary text-xs py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 flex-shrink-0"
          >
            Apply Now →
          </Link>
        </div>
      )}

      {/* Owner Quick Dashboard for Owners */}
      {isOwner && (
        <div className="card p-6 border-blue-200 bg-gradient-to-br from-blue-50/60 to-white flex items-center justify-between gap-4 flex-col sm:flex-row">
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <span className="text-xl">🚗</span>
              <h3 className="font-bold text-slate-900 text-base">Owner Dashboard</h3>
            </div>
            <p className="text-slate-600 text-xs leading-relaxed">
              Manage your fleet, view incoming rental requests, and adjust availability.
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Link to="/my-listings" className="btn-primary text-xs py-2 px-3">
              My Listings
            </Link>
            <Link to="/add-vehicle" className="btn-outline text-xs py-2 px-3">
              + Add Vehicle
            </Link>
          </div>
        </div>
      )}

      {/* Edit Form */}
      <form onSubmit={handleSave} className="card space-y-4">
        <h2 className="font-semibold text-slate-900 text-base">Edit Details</h2>

        {saveMsg && (
          <div className="px-4 py-2.5 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
            ✅ {saveMsg}
          </div>
        )}
        {saveError && (
          <div className="px-4 py-2.5 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
            ⚠️ {saveError}
          </div>
        )}

        <div>
          <label className="label" htmlFor="fullName">Full Name</label>
          <input
            id="fullName"
            type="text"
            className="input"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="phone">Phone Number</label>
          <input
            id="phone"
            type="tel"
            className="input"
            placeholder="+94 71 234 5678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div>
          <label className="label">Email</label>
          <input
            type="email"
            className="input bg-slate-50 text-slate-400 cursor-not-allowed"
            value={profile?.email ?? ''}
            disabled
          />
          <p className="text-xs text-slate-400 mt-1">Email cannot be changed here.</p>
        </div>

        <button type="submit" className="btn-primary text-sm" disabled={saving}>
          {saving ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </span>
          ) : 'Save Changes'}
        </button>
      </form>

      {/* Sign Out */}
      <div className="card border-red-100">
        <h2 className="font-semibold text-red-600 mb-1 text-base">Sign Out</h2>
        <p className="text-xs text-slate-500 mb-4">You'll need to sign in again to access your account.</p>
        <button onClick={handleSignOut} className="btn-outline border-red-300 text-red-600 hover:bg-red-50 text-sm">
          Sign Out
        </button>
      </div>
    </div>
  );
}
