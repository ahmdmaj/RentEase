import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import logoUrl from '../../assets/LOGO-removebg-preview.jpg';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Soft blobs */}
      <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(147,197,253,0.45) 0%, transparent 70%)' }} />
      <div className="pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(253,164,175,0.40) 0%, transparent 70%)' }} />

      <div className="w-full max-w-md animate-fade-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg overflow-hidden bg-white">
            <img src={logoUrl} alt="RentEase Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 font-heading">Forgot password?</h1>
          <p className="text-slate-500 mt-1 font-sans">We'll send a reset link to your email</p>
        </div>

        <div className="card">
          {sent ? (
            <div className="text-center py-6">
              <div className="text-5xl mb-4">📧</div>
              <h2 className="text-xl font-bold text-slate-900 mb-2 font-heading">Check your inbox</h2>
              <p className="text-slate-500 text-sm font-sans">
                We sent a password reset link to{' '}
                <span className="font-semibold text-slate-700">{email}</span>
              </p>
              <Link to="/login" className="btn-primary mt-6 inline-flex">
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium flex items-center gap-2">
                  <span>⚠️</span> {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="label" htmlFor="forgot-email">Email Address</label>
                  <input
                    id="forgot-email"
                    type="email"
                    className="input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <button
                  id="forgot-submit"
                  type="submit"
                  className="btn-primary w-full py-3 text-base"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending…
                    </span>
                  ) : 'Send Reset Link'}
                </button>
              </form>
              <p className="text-center text-sm text-slate-500 mt-6 font-sans">
                Remember your password?{' '}
                <Link to="/login" className="text-primary-600 font-bold hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
