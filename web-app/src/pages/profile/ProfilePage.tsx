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
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">Manage your account details and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        
        {/* --- Left Column (Sidebar) --- */}
        <div className="lg:col-span-4 space-y-6">
          {/* Avatar + Name Card */}
          <div className="card text-center flex flex-col items-center pt-8 pb-6">
            <div className="w-24 h-24 mb-4 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-4xl shadow-md"
                 style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
              {initial}
            </div>
            <p className="text-xl font-bold text-slate-900">{profile?.full_name ?? '—'}</p>
            <p className="text-slate-500 text-sm mt-1">{profile?.email ?? '—'}</p>
            <span className="badge bg-primary-50 text-primary-700 border border-primary-200 mt-3 capitalize font-semibold px-3 py-1 text-sm rounded-full">
              {profile?.role ?? 'renter'}
            </span>
          </div>

          {/* Sign Out Card */}
          <div className="card border-red-100 bg-red-50/30">
            <h2 className="font-semibold text-red-600 mb-1 text-base">Sign Out</h2>
            <p className="text-xs text-slate-500 mb-4">You'll need to sign in again to access your account.</p>
            <button onClick={handleSignOut} className="w-full btn-outline border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 text-sm py-2">
              Sign Out
            </button>
          </div>
        </div>

        {/* --- Right Column (Main Content) --- */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Become an Owner Card for Renters */}
          {isRenter && (
            <div className="card p-6 border-emerald-200 bg-gradient-to-br from-emerald-50/60 to-white flex items-center justify-between gap-5 flex-col sm:flex-row">
              <div className="space-y-1.5 text-center sm:text-left">
                <div className="flex items-center gap-2.5 justify-center sm:justify-start">
                  <span className="text-2xl drop-shadow-sm">💼</span>
                  <h3 className="font-bold text-slate-900 text-lg">Earn as a Vehicle Owner</h3>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed max-w-md">
                  List your cars, bikes, or SUVs and earn money on your own schedule with verified renters.
                </p>
              </div>
              <Link
                to="/become-owner"
                className="btn-primary text-sm py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 flex-shrink-0 shadow-sm"
              >
                Apply Now →
              </Link>
            </div>
          )}

          {/* Owner Quick Dashboard for Owners */}
          {isOwner && (
            <div className="card p-6 border-blue-200 bg-gradient-to-br from-blue-50/60 to-white flex items-center justify-between gap-5 flex-col sm:flex-row">
              <div className="space-y-1.5 text-center sm:text-left">
                <div className="flex items-center gap-2.5 justify-center sm:justify-start">
                  <span className="text-2xl drop-shadow-sm">🚗</span>
                  <h3 className="font-bold text-slate-900 text-lg">Owner Dashboard</h3>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Manage your fleet, view incoming rental requests, and adjust availability.
                </p>
              </div>
              <div className="flex gap-3 flex-shrink-0">
                <Link to="/my-listings" className="btn-primary text-sm py-2.5 px-5 shadow-sm">
                  My Listings
                </Link>
                <Link to="/add-vehicle" className="btn-outline bg-white hover:bg-slate-50 text-sm py-2.5 px-5">
                  + Add Vehicle
                </Link>
              </div>
            </div>
          )}

          {/* Edit Form */}
          <form onSubmit={handleSave} className="card p-6 sm:p-8">
            <div>
              <h2 className="font-bold text-slate-900 text-xl">Personal Details</h2>
              <p className="text-sm text-slate-500 mt-1.5">Update your personal information and contact details.</p>
            </div>

            <div className="h-px bg-slate-100 w-full my-6"></div>

            {saveMsg && (
              <div className="px-4 py-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm flex items-center gap-2 mb-6">
                ✅ {saveMsg}
              </div>
            )}
            {saveError && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm flex items-center gap-2 mb-6">
                ⚠️ {saveError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label text-sm font-semibold text-slate-700" htmlFor="fullName">Full Name</label>
                <input
                  id="fullName"
                  type="text"
                  className="input mt-2"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="label text-sm font-semibold text-slate-700" htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  type="tel"
                  className="input mt-2"
                  placeholder="+94 71 234 5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <label className="label text-sm font-semibold text-slate-700">Email Address</label>
                <input
                  type="email"
                  className="input mt-2 bg-slate-50 text-slate-500 cursor-not-allowed border-slate-200"
                  value={profile?.email ?? ''}
                  disabled
                />
                <p className="text-xs text-slate-400 mt-2 font-medium">Email cannot be changed from this page.</p>
              </div>
            </div>

            <div className="flex justify-end pt-8 mt-4 border-t border-slate-100">
              <button type="submit" className="btn-primary text-sm px-6 py-2.5 font-semibold" disabled={saving}>
                {saving ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : 'Save Changes'}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
