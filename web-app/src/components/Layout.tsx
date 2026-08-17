import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Soft blobs global theme */}
      <div className="pointer-events-none fixed -top-32 -left-32 w-96 h-96 rounded-full blur-3xl z-0"
        style={{ background: 'radial-gradient(circle, rgba(147,197,253,0.45) 0%, transparent 70%)' }} />
      <div className="pointer-events-none fixed -bottom-32 -right-32 w-96 h-96 rounded-full blur-3xl z-0"
        style={{ background: 'radial-gradient(circle, rgba(253,164,175,0.40) 0%, transparent 70%)' }} />

      <div className="relative z-10">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
