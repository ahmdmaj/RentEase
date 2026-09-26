import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { BarChart3, RefreshCw, Users, Car, CalendarDays, CheckCircle, CircleDollarSign, Key, ClipboardList, Hourglass } from 'lucide-react';
import './Dashboard.css';

type Stats = {
    totalUsers: number;
    totalVehicles: number;
    totalBookings: number;
    pendingApprovals: number;
    totalRevenue: number;
    activeBookings: number;
};

type RecentBooking = {
    id: string;
    status: string;
    total_price: number;
    start_date: string;
    end_date: string;
    created_at: string;
    vehicles: { make: string; model: string } | null;
    profiles: { full_name: string; phone: string } | null;
};

type PendingApproval = {
    id: string;
    business_name: string;
    submitted_at: string;
    profiles: { full_name: string; phone: string } | null;
};

export default function Dashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState<Stats>({
        totalUsers: 0,
        totalVehicles: 0,
        totalBookings: 0,
        pendingApprovals: 0,
        totalRevenue: 0,
        activeBookings: 0,
    });
    const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
    const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const [usersRes, vehiclesRes, bookingsRes, approvalsRes, recentRes, pendingRes, revenueRes] =
                await Promise.all([
                    supabase.from('profiles').select('id', { count: 'exact', head: true }),
                    supabase.from('vehicles').select('id', { count: 'exact', head: true }),
                    supabase.from('bookings').select('id,total_price,status', { count: 'exact' }),
                    supabase.from('owner_applications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
                    supabase
                        .from('bookings')
                        .select('id, status, total_price, start_date, end_date, created_at, vehicles(make,model), profiles(full_name,phone)')
                        .order('created_at', { ascending: false })
                        .limit(5),
                    supabase
                        .from('owner_applications')
                        .select('id, business_name, submitted_at, profiles(full_name,phone)')
                        .eq('status', 'pending')
                        .order('submitted_at', { ascending: true })
                        .limit(4),
                    // Fetch actual paid revenue from payments table
                    supabase
                        .from('payments')
                        .select('amount')
                        .eq('status', 'success'),
                ]);

            const bookings = bookingsRes.data || [];
            // Revenue comes from actual successful payments, not estimated from bookings
            const revenue = (revenueRes.data || []).reduce(
                (sum: number, p: any) => sum + (p.amount || 0), 0
            );
            const active = bookings.filter(
                (b) => b.status === 'approved' || b.status === 'confirmed'
            ).length;

            setStats({
                totalUsers: usersRes.count || 0,
                totalVehicles: vehiclesRes.count || 0,
                totalBookings: bookingsRes.count || 0,
                pendingApprovals: approvalsRes.count || 0,
                totalRevenue: revenue,
                activeBookings: active,
            });

            setRecentBookings((recentRes.data as any) || []);
            setPendingApprovals((pendingRes.data as any) || []);
        } catch (e: any) {
            console.error('Dashboard fetch error', e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'pending': return 'status-pending';
            case 'approved': return 'status-approved';
            case 'rejected': return 'status-rejected';
            case 'completed': return 'status-completed';
            case 'cancelled': return 'status-cancelled';
            default: return '';
        }
    };

    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const formatCurrency = (amount: number) =>
        `LKR ${amount.toLocaleString()}`;

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="spinner" />
                <p>Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div className="dashboard">
            {/* Page Header */}
            <div className="dashboard-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <BarChart3 size={32} color="#0f172a" />
                    <div>
                        <h1>Dashboard</h1>
                        <p className="dashboard-subtitle">Welcome back! Here's what's happening with RentEase.</p>
                    </div>
                </div>
                <button className="refresh-btn" onClick={fetchDashboardData}>
                    <RefreshCw size={16} /> Refresh
                </button>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card stat-blue" onClick={() => navigate('/users')}>
                    <div className="stat-icon"><Users size={28} strokeWidth={2.5} /></div>
                    <div className="stat-content">
                        <div className="stat-number">{stats.totalUsers}</div>
                        <div className="stat-label">Total Users</div>
                    </div>
                    <div className="stat-arrow">→</div>
                </div>
                <div className="stat-card stat-green" onClick={() => navigate('/vehicles')}>
                    <div className="stat-icon"><Car size={28} strokeWidth={2.5} /></div>
                    <div className="stat-content">
                        <div className="stat-number">{stats.totalVehicles}</div>
                        <div className="stat-label">Total Vehicles</div>
                    </div>
                    <div className="stat-arrow">→</div>
                </div>
                <div className="stat-card stat-purple" onClick={() => navigate('/bookings')}>
                    <div className="stat-icon"><CalendarDays size={28} strokeWidth={2.5} /></div>
                    <div className="stat-content">
                        <div className="stat-number">{stats.totalBookings}</div>
                        <div className="stat-label">Total Bookings</div>
                    </div>
                    <div className="stat-arrow">→</div>
                </div>
                <div className="stat-card stat-orange" onClick={() => navigate('/approvals')}>
                    <div className="stat-icon"><CheckCircle size={28} strokeWidth={2.5} /></div>
                    <div className="stat-content">
                        <div className="stat-number">{stats.pendingApprovals}</div>
                        <div className="stat-label">Pending Approvals</div>
                    </div>
                    <div className="stat-arrow">→</div>
                </div>
                <div className="stat-card stat-emerald">
                    <div className="stat-icon"><CircleDollarSign size={28} strokeWidth={2.5} /></div>
                    <div className="stat-content">
                        <div className="stat-number stat-small">{formatCurrency(stats.totalRevenue)}</div>
                        <div className="stat-label">Total Revenue</div>
                    </div>
                </div>
                <div className="stat-card stat-cyan">
                    <div className="stat-icon"><Key size={28} strokeWidth={2.5} /></div>
                    <div className="stat-content">
                        <div className="stat-number">{stats.activeBookings}</div>
                        <div className="stat-label">Active Rentals</div>
                    </div>
                </div>
            </div>

            {/* Bottom Section */}
            <div className="dashboard-bottom">
                {/* Recent Bookings */}
                <div className="dashboard-card">
                    <div className="card-header-row">
                        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <ClipboardList size={22} className="text-slate-500" /> Recent Bookings
                        </h2>
                        <button className="view-all-btn" onClick={() => navigate('/bookings')}>View All</button>
                    </div>
                    {recentBookings.length === 0 ? (
                        <div className="empty-widget">No bookings yet.</div>
                    ) : (
                        <div className="table-wrapper">
                            <table className="mini-table">
                                <thead>
                                    <tr>
                                        <th>Renter</th>
                                        <th>Vehicle</th>
                                        <th>Dates</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentBookings.map((b) => (
                                        <tr key={b.id}>
                                            <td>
                                                <div className="renter-cell">
                                                    <span className="renter-name">{b.profiles?.full_name || 'Unknown'}</span>
                                                    <span className="renter-email">{b.profiles?.phone || ''}</span>
                                                </div>
                                            </td>
                                            <td>{b.vehicles ? `${b.vehicles.make} ${b.vehicles.model}` : 'N/A'}</td>
                                            <td className="dates-cell">
                                                {formatDate(b.start_date)} → {formatDate(b.end_date)}
                                            </td>
                                            <td className="amount-cell">{formatCurrency(b.total_price)}</td>
                                            <td>
                                                <span className={`status-pill ${getStatusClass(b.status)}`}>
                                                    {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Pending Owner Approvals */}
                <div className="dashboard-card">
                    <div className="card-header-row">
                        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Hourglass size={22} className="text-slate-500" /> Pending Approvals
                        </h2>
                        <button className="view-all-btn" onClick={() => navigate('/approvals')}>View All</button>
                    </div>
                    {pendingApprovals.length === 0 ? (
                        <div className="empty-widget">All owners verified!</div>
                    ) : (
                        <div className="approvals-list">
                            {pendingApprovals.map((app) => (
                                <div key={app.id} className="approval-row">
                                    <div className="approval-avatar">
                                        {(app.profiles?.full_name || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <div className="approval-info">
                                        <span className="approval-name">{app.profiles?.full_name || 'Unknown'}</span>
                                        <span className="approval-business">{app.business_name || 'No business name'}</span>
                                        <span className="approval-date">Submitted {formatDate(app.submitted_at)}</span>
                                    </div>
                                    <button
                                        className="review-btn"
                                        onClick={() => navigate('/approvals')}
                                    >
                                        Review
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}