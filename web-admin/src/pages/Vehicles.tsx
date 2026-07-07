import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import './AdminTable.css';

type Vehicle = {
    id: string;
    make: string;
    model: string;
    year: number;
    transmission: string;
    fuel_type: string;
    seating_capacity: number;
    location: string;
    price_per_day: number;
    description: string;
    is_available: boolean;
    created_at: string;
    owner_id: string;
    profiles: { full_name: string; phone: string } | null;
};

type FilterAvailability = 'all' | 'available' | 'unavailable';

const AVAIL_TABS: { key: FilterAvailability; label: string }[] = [
    { key: 'all', label: 'All Vehicles' },
    { key: 'available', label: '✅ Granted & Listed' },
    { key: 'unavailable', label: '⏳ Pending Approval' },
];

export default function Vehicles() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterAvailability>('all');
    const [search, setSearch] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchVehicles = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('vehicles')
                .select('*, profiles ( full_name, phone )')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setVehicles((data as any) || []);
        } catch (err: any) {
            alert('Error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVehicles();
    }, []);

    const toggleAvailability = async (vehicleId: string, current: boolean) => {
        const action = current ? 'unlist and revoke approval for' : 'grant approval and list';
        if (!window.confirm(`Are you sure you want to ${action} this vehicle on the platform?`)) return;
        setActionLoading(vehicleId);
        try {
            const { data, error } = await supabase
                .from('vehicles')
                .update({ is_available: !current })
                .eq('id', vehicleId)
                .select();
            if (error) throw error;
            if (!data || data.length === 0) {
                throw new Error('Update blocked by Supabase RLS! Please run migration 002_admin_rls_policies.sql in your Supabase SQL Editor.');
            }
            await fetchVehicles();
        } catch (err: any) {
            alert('Error: ' + err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (vehicleId: string, make: string, model: string) => {
        if (!window.confirm(`Are you sure you want to delete "${make} ${model}"? This cannot be undone.`)) return;
        setActionLoading(vehicleId);
        try {
            const { data, error } = await supabase
                .from('vehicles')
                .delete()
                .eq('id', vehicleId)
                .select();
            if (error) throw error;
            if (!data || data.length === 0) {
                throw new Error('Delete blocked by Supabase RLS! Please run migration 002_admin_rls_policies.sql in your Supabase SQL Editor.');
            }
            setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
        } catch (err: any) {
            alert('Error: ' + err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const filtered = vehicles.filter((v) => {
        const matchesFilter =
            filter === 'all' ||
            (filter === 'available' && v.is_available) ||
            (filter === 'unavailable' && !v.is_available);
        const q = search.toLowerCase();
        const matchesSearch =
            !q ||
            v.make?.toLowerCase().includes(q) ||
            v.model?.toLowerCase().includes(q) ||
            v.location?.toLowerCase().includes(q) ||
            v.profiles?.full_name?.toLowerCase().includes(q);
        return matchesFilter && matchesSearch;
    });

    const getCount = (avail: FilterAvailability) => {
        if (avail === 'all') return vehicles.length;
        if (avail === 'available') return vehicles.filter((v) => v.is_available).length;
        return vehicles.filter((v) => !v.is_available).length;
    };

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return (
        <div className="admin-page">
            {/* Header */}
            <div className="admin-page-header">
                <div>
                    <h1>🚗 Vehicles</h1>
                    <p className="page-subtitle">{vehicles.length} vehicles listed on the platform</p>
                </div>
                <button className="refresh-btn" onClick={fetchVehicles}>🔄 Refresh</button>
            </div>

            {/* Availability Tabs */}
            <div className="status-tabs">
                {AVAIL_TABS.map((tab) => (
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
                    placeholder="Search by make, model, location, or owner..."
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
                <div className="table-loading"><div className="spinner" /> Loading vehicles...</div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <p>🚗 No vehicles found.</p>
                    <p className="empty-sub">Try adjusting your filter or search.</p>
                </div>
            ) : (
                <div className="table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Vehicle</th>
                                <th>Details</th>
                                <th>Owner</th>
                                <th>Location</th>
                                <th>Price / Day</th>
                                <th>Status</th>
                                <th>Listed</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((v) => (
                                <tr key={v.id}>
                                    <td>
                                        <div className="cell-stack">
                                            <span className="cell-primary">{v.make} {v.model}</span>
                                            <span className="cell-secondary">{v.year || 'N/A'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="cell-stack">
                                            <span className="cell-secondary">{v.transmission || '—'} · {v.fuel_type || '—'}</span>
                                            {v.seating_capacity && (
                                                <span className="cell-secondary">💺 {v.seating_capacity} seats</span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="cell-stack">
                                            <span className="cell-primary">{v.profiles?.full_name || 'Unknown'}</span>
                                            <span className="cell-secondary">{v.profiles?.phone || 'No phone'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="cell-secondary">📍 {v.location || '—'}</span>
                                    </td>
                                    <td>
                                        <span className="amount-text">LKR {v.price_per_day?.toLocaleString()}</span>
                                    </td>
                                    <td>
                                        <span className={`status-pill ${v.is_available ? 'status-approved' : 'status-pending'}`}>
                                            {v.is_available ? 'Granted & Listed' : 'Pending Approval'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="cell-secondary">{formatDate(v.created_at)}</span>
                                    </td>
                                    <td>
                                        <div className="action-btns">
                                            <button
                                                className={`action-btn ${v.is_available ? 'neutral' : 'approve'}`}
                                                disabled={actionLoading === v.id}
                                                onClick={() => toggleAvailability(v.id, v.is_available)}
                                            >
                                                {v.is_available ? 'Revoke / Unlist' : 'Grant Approval'}
                                            </button>
                                            <button
                                                className="action-btn reject"
                                                disabled={actionLoading === v.id}
                                                onClick={() => handleDelete(v.id, v.make, v.model)}
                                            >
                                                Delete
                                            </button>
                                            {actionLoading === v.id && (
                                                <span className="action-loading">...</span>
                                            )}
                                        </div>
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