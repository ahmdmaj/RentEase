import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { OwnerApplication } from '../../lib/types';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ApplyOwnerPage() {
  const { user, profile, refreshProfile } = useAuth();

  const [application, setApplication] = useState<OwnerApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [reapplyMode, setReapplyMode] = useState(false);

  const [form, setForm] = useState({
    businessName: '',
    nicNumber: '',
    phone: profile?.phone ?? '',
    fullName: profile?.full_name ?? '',
    agreeTerms: false,
  });

  const fetchApplication = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');

    const { data, error: err } = await supabase
      .from('owner_applications')
      .select('*')
      .eq('profile_id', user.id)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!err && data) {
      setApplication(data as OwnerApplication);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchApplication();
  }, [fetchApplication]);

  useEffect(() => {
    if (profile) {
      setForm((prev) => ({
        ...prev,
        fullName: prev.fullName || profile.full_name || '',
        phone: prev.phone || profile.phone || '',
      }));
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');

    if (!form.nicNumber.trim()) {
      setError('National Identity Card (NIC) / ID number is required.');
      return;
    }
    if (!form.agreeTerms) {
      setError('You must agree to the owner terms and vehicle ownership verification.');
      return;
    }

    setSubmitting(true);

    try {
      // 1. Update phone/name in profile if changed
      if (form.phone.trim() !== (profile?.phone ?? '') || form.fullName.trim() !== (profile?.full_name ?? '')) {
        await supabase
          .from('profiles')
          .update({
            full_name: form.fullName.trim(),
            phone: form.phone.trim() || null,
          })
          .eq('id', user.id);
        await refreshProfile();
      }

      // 2. Insert owner application
      const { data, error: insertErr } = await supabase
        .from('owner_applications')
        .insert({
          profile_id: user.id,
          business_name: form.businessName.trim() || null,
          nic_number: form.nicNumber.trim(),
          status: 'pending',
        })
        .select()
        .single();

      if (insertErr) throw insertErr;

      setApplication(data as OwnerApplication);
      setReapplyMode(false);
    } catch (err: any) {
      setError(err.message || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/2" />
        <div className="card h-64" />
      </div>
    );
  }

  // If user is already owner
  if (profile?.role === 'owner') {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="card space-y-5 p-8 shadow-card border-green-100 bg-gradient-to-b from-white to-green-50/30">
          <div className="w-16 h-16 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto text-3xl">
            🎉
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">You are an Approved Vehicle Owner!</h1>
            <p className="text-slate-500 text-sm mt-1.5 max-w-md mx-auto">
              Your account is fully verified. You can list vehicles, manage booking requests, and earn rental income.
            </p>
          </div>
          <div className="flex gap-3 justify-center pt-2">
            <Link to="/add-vehicle" className="btn-primary text-sm py-2.5 px-5">
              + Add New Vehicle
            </Link>
            <Link to="/my-listings" className="btn-outline text-sm py-2.5 px-5">
              Manage My Listings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If pending application exists
  if (application && application.status === 'pending' && !reapplyMode) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="page-title">Owner Application</h1>
          <p className="page-subtitle">Track your verification status</p>
        </div>

        <div className="card space-y-6 p-8 border-yellow-100 bg-gradient-to-b from-white to-yellow-50/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-yellow-100 text-yellow-700 flex items-center justify-center text-2xl flex-shrink-0">
              ⏳
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-slate-900">Application Under Review</h2>
                <span className="badge bg-yellow-100 text-yellow-800">Pending Review</span>
              </div>
              <p className="text-slate-500 text-sm mt-1 leading-relaxed">
                Thank you for applying to become a vehicle owner on RentEase! Our verification team is reviewing your details.
              </p>
            </div>
          </div>

          {/* Submission Details */}
          <div className="bg-slate-50 rounded-2xl p-5 space-y-3 text-sm border border-slate-100">
            <div className="flex justify-between text-slate-600">
              <span>Submitted On</span>
              <span className="font-medium text-slate-800">{formatDate(application.submitted_at)}</span>
            </div>
            {application.business_name && (
              <div className="flex justify-between text-slate-600">
                <span>Business Name</span>
                <span className="font-medium text-slate-800">{application.business_name}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>NIC / ID Number</span>
              <span className="font-mono font-medium text-slate-800">{application.nic_number}</span>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-blue-800 text-xs leading-relaxed flex items-start gap-2.5">
            <span className="text-base">ℹ️</span>
            <span>
              Approvals typically take less than 24 hours. Once approved, your account will automatically upgrade to Owner mode and you will receive an in-app notification.
            </span>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              onClick={fetchApplication}
              className="btn-ghost text-xs text-primary-600"
            >
              🔄 Refresh Status
            </button>
            <Link to="/" className="btn-primary text-xs py-2 px-4">
              Back to Browse
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If rejected application
  if (application && application.status === 'rejected' && !reapplyMode) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="card space-y-6 p-8 border-red-100 bg-gradient-to-b from-white to-red-50/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center text-2xl flex-shrink-0">
              ❌
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Application Declined</h2>
                <span className="badge bg-red-100 text-red-700">Declined</span>
              </div>
              <p className="text-slate-500 text-sm mt-1 leading-relaxed">
                Your previous application could not be approved at this time. Please make sure your NIC number and contact details are accurate before re-applying.
              </p>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Link to="/" className="btn-ghost text-xs">
              Back to Browse
            </Link>
            <button
              onClick={() => setReapplyMode(true)}
              className="btn-primary text-xs py-2 px-4"
            >
              Re-apply as Owner
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Application Form
  return (
    <div className="max-w-3xl mx-auto py-4">
      {/* Header Banner */}
      <div className="mb-8">
        <span className="badge bg-primary-100 text-primary-700 mb-2">Partner Program</span>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Become a Vehicle Owner</h1>
        <p className="text-slate-500 text-base mt-1.5">
          List your cars, bikes, or SUVs on RentEase and earn passive income with verified renters.
        </p>
      </div>

      {/* Value Prop Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="card p-5 bg-white shadow-xs border border-slate-100 space-y-2">
          <span className="text-3xl">💰</span>
          <h3 className="font-bold text-slate-900 text-sm">Daily Rental Income</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Set your daily rates and get paid directly when customers book your vehicles.
          </p>
        </div>

        <div className="card p-5 bg-white shadow-xs border border-slate-100 space-y-2">
          <span className="text-3xl">🛡️</span>
          <h3 className="font-bold text-slate-900 text-sm">Verified Renters</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Accept or decline incoming requests with full visibility into rental schedules.
          </p>
        </div>

        <div className="card p-5 bg-white shadow-xs border border-slate-100 space-y-2">
          <span className="text-3xl">⚙️</span>
          <h3 className="font-bold text-slate-900 text-sm">Conflict-Free Engine</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Automatic double-booking prevention ensures your calendar stays perfectly organized.
          </p>
        </div>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="card space-y-5 p-7 shadow-card">
        <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
          Owner Verification Details
        </h2>

        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="fullName">
              Full Legal Name <span className="text-red-500">*</span>
            </label>
            <input
              id="fullName"
              type="text"
              className="input"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="e.g. Kamal Perera"
              required
            />
          </div>

          <div>
            <label className="label" htmlFor="phone">
              Contact Phone <span className="text-red-500">*</span>
            </label>
            <input
              id="phone"
              type="tel"
              className="input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+94 77 123 4567"
              required
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="nicNumber">
            National Identity Card (NIC) / Passport Number <span className="text-red-500">*</span>
          </label>
          <input
            id="nicNumber"
            type="text"
            className="input"
            value={form.nicNumber}
            onChange={(e) => setForm({ ...form, nicNumber: e.target.value })}
            placeholder="e.g. 199512345678 or 951234567V"
            required
          />
          <p className="text-xs text-slate-400 mt-1">Used solely for owner verification & safety compliance.</p>
        </div>

        <div>
          <label className="label" htmlFor="businessName">
            Business / Rental Agency Name <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            id="businessName"
            type="text"
            className="input"
            value={form.businessName}
            onChange={(e) => setForm({ ...form, businessName: e.target.value })}
            placeholder="e.g. Colombo Car Rentals / Individual Owner"
          />
        </div>

        {/* Terms Agreement */}
        <div className="pt-2">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              className="mt-1 w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-slate-300"
              checked={form.agreeTerms}
              onChange={(e) => setForm({ ...form, agreeTerms: e.target.checked })}
              required
            />
            <span className="text-xs text-slate-600 leading-relaxed">
              I certify that all information provided is accurate and that I am the legal owner or authorized representative of any vehicles listed on RentEase. I agree to the{' '}
              <span className="text-primary-600 font-medium hover:underline">Owner Terms & Conditions</span>.
            </span>
          </label>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-3">
          <button
            type="submit"
            className="btn-primary flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Submitting Application...</span>
              </>
            ) : (
              <>
                <span>Submit Owner Application</span>
                <span>🚀</span>
              </>
            )}
          </button>
          <Link to="/" className="btn-ghost px-5 text-sm">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
