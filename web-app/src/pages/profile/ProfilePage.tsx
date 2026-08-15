import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">Manage your account details</p>
      </div>

      {/* Avatar + Name */}
      <div className="card mb-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-2xl flex-shrink-0">
          {profile?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
        </div>
        <div>
          <p className="text-xl font-bold text-slate-900">{profile?.full_name ?? '—'}</p>
          <p className="text-slate-500 text-sm">{profile?.email ?? '—'}</p>
          <span className="badge bg-primary-100 text-primary-700 mt-1 capitalize">
            {profile?.role ?? 'renter'}
          </span>
        </div>
      </div>

      {/* Edit Form */}
      <div className="card space-y-4 mb-6">
        <h2 className="font-semibold text-slate-900">Edit Details</h2>
        <div>
          <label className="label" htmlFor="fullName">Full Name</label>
          <input id="fullName" type="text" className="input" defaultValue={profile?.full_name ?? ''} />
        </div>
        <div>
          <label className="label" htmlFor="phone">Phone Number</label>
          <input id="phone" type="tel" className="input" placeholder="+91 98765 43210" defaultValue={profile?.phone ?? ''} />
        </div>
        <div>
          <label className="label">Email</label>
          <input type="email" className="input bg-slate-50 cursor-not-allowed" value={profile?.email ?? ''} disabled />
          <p className="text-xs text-slate-400 mt-1">Email cannot be changed here.</p>
        </div>
        <button className="btn-primary">Save Changes</button>
      </div>

      {/* Danger Zone */}
      <div className="card border-red-100">
        <h2 className="font-semibold text-red-600 mb-3">Sign Out</h2>
        <p className="text-sm text-slate-500 mb-4">You'll need to sign in again to access your account.</p>
        <button onClick={handleSignOut} className="btn-outline border-red-300 text-red-600 hover:bg-red-50">
          Sign Out
        </button>
      </div>
    </div>
  );
}
