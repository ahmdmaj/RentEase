import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
    const { user, profile, loading } = useAuth();

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <p>Loading...</p>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Only allow admins
    if (profile?.role !== 'admin') {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '16px' }}>
                <h1>🚫 Unauthorized</h1>
                <p>You do not have admin access.</p>
                <button onClick={() => window.location.href = '/login'}>Go to Login</button>
            </div>
        );
    }

    return <Outlet />;
}