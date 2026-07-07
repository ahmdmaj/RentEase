import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import './AdminTable.css';

type Booking = {
    id: string;
    vehicle_id: string;
    renter_id: string;
    start_date: string;
    end_date: string;
    total_price: number;
    status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
    created_at: string;
    vehicles: { make: string; model: string; location: string; price_per_day: number } | null;
    profiles: { full_name: string; phone: string } | null;
};

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';

const STATUS_TABS: { key: FilterStatus; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: '⏳ Pending' },
    { key: 'approved', label: '✅ Approved' },
    { key: 'rejected', label: '❌ Rejected' },
    { key: 'completed', label: '🏁 Completed' },
    { key: 'cancelled', label: '🚫 Cancelled' },
];

export default function Bookings() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterStatus>('all');
    const [search, setSearch] = useState('');

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('bookings')
                .select(`
                    *,
                    vehicles ( make, model, location, price_per_day ),
                    profiles ( full_name, phone )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setBookings((data as any) || []);
        } catch (err: any) {
            alert('Error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const filtered = bookings.filter((b) => {
        const matchesFilter = filter === 'all' || b.status === filter;
        const q = search.toLowerCase();
        const matchesSearch =
            !q ||
            b.profiles?.full_name?.toLowerCase().includes(q) ||
            b.profiles?.phone?.toLowerCase().includes(q) ||
            b.vehicles?.make?.toLowerCase().includes(q) ||
            b.vehicles?.model?.toLowerCase().includes(q) ||
            b.id.toLowerCase().includes(q);
        return matchesFilter && matchesSearch;
    });

    const getCount = (status: FilterStatus) =>
        status === 'all' ? bookings.length : bookings.filter((b) => b.status === status).length;

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

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const getDays = (start: string, end: string) => {
        const diff = new Date(end).getTime() - new Date(start).getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    return (
        <div className="admin-page">
            {/* Header */}
            <div className="admin-page-header">
                <div>
                    <h1>📅 Bookings (Read-Only)</h1>
                    <p className="page-subtitle">{bookings.length} total bookings. Approvals & rejections are managed directly by vehicle owners.</p>
                </div>
                <button className="refresh-btn" onClick={fetchBookings}>🔄 Refresh</button>
            </div>

            {/* Status Tabs */}
            <div className="status-tabs">
                {STATUS_TABS.map((tab) => (
                    <button
                        key={tab.key}
                        className={`tab-btn ${filter === tab.key ? 'active' : ''}`}
                        onClick={() => setFilter(tab.key)}
                    >
                        {tab.label}
                        <span className="tab-count">{getCount(tab.key)}</span>
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="search-bar">
                <span className="search-icon">🔍</span>
                <input
                    type="text"
                    placeholder="Search by renter name, phone, or vehicle..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="search-input"
                />
                {search && (
                    <button className="clear-search" onClick={() => setSearch('')}>✕</button>
                )}
            </div>

            {/* Table */}
            {loading ? (
                <div className="table-loading"><div className="spinner" /> Loading bookings...</div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <p>📭 No bookings found.</p>
                    <p className="empty-sub">Try adjusting your filter or search.</p>
                </div>
            ) : (
                <div className="table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Renter</th>
                                <th>Vehicle</th>
                                <th>Duration</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th>Booked</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((b) => (
                                <tr key={b.id}>
                                    <td>
                                        <div className="cell-stack">
                                            <span className="cell-primary">{b.profiles?.full_name || 'Unknown'}</span>
                                            <span className="cell-secondary">{b.profiles?.phone ? `📞 ${b.profiles.phone}` : 'No phone'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="cell-stack">
                                            <span className="cell-primary">{b.vehicles ? `${b.vehicles.make} ${b.vehicles.model}` : 'N/A'}</span>
                                            {b.vehicles?.location && (
                                                <span className="cell-secondary">📍 {b.vehicles.location}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="cell-stack">
                                            <span className="cell-primary">{formatDate(b.start_date)} → {formatDate(b.end_date)}</span>
                                            <span className="cell-secondary">{getDays(b.start_date, b.end_date)} day(s)</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="amount-text">LKR {b.total_price.toLocaleString()}</span>
                                    </td>
                                    <td>
                                        <span className={`status-pill ${getStatusClass(b.status)}`}>
                                            {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="cell-secondary">{formatDate(b.created_at)}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}