import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../context/../lib/supabase';
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

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">Manage your account details</p>
      </div>

      {/* Avatar + Name */}
      <div className="card mb-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-2xl flex-shrink-0">
          {initial}
        </div>
        <div>
          <p className="text-xl font-bold text-slate-900">{profile?.full_name ?? '—'}</p>
          <p className="text-slate-500 text-sm">{profile?.email ?? '—'}</p>
          <span className="badge bg-primary-100 text-primary-700 mt-1.5 capitalize">
            {profile?.role ?? 'renter'}
          </span>
        </div>
      </div>

      {/* Edit Form */}
      <form onSubmit={handleSave} className="card space-y-4 mb-6">
        <h2 className="font-semibold text-slate-900">Edit Details</h2>

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

        <button type="submit" className="btn-primary" disabled={saving}>
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
        <h2 className="font-semibold text-red-600 mb-2">Sign Out</h2>
        <p className="text-sm text-slate-500 mb-4">You'll need to sign in again to access your account.</p>
        <button onClick={handleSignOut} className="btn-outline border-red-300 text-red-600 hover:bg-red-50">
          Sign Out
        </button>
      </div>
    </div>
  );
}
