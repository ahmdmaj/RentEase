import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import './AdminTable.css';

type UserProfile = {
    id: string;
    full_name: string;
    address: string;
    phone: string;
    role: 'renter' | 'owner' | 'admin';
    created_at: string;
};

type FilterRole = 'all' | 'renter' | 'owner' | 'admin';

const ROLE_TABS: { key: FilterRole; label: string }[] = [
    { key: 'all', label: 'All Users' },
    { key: 'renter', label: '🔑 Renters' },
    { key: 'owner', label: '🚗 Owners' },
    { key: 'admin', label: '🛡️ Admins' },
];

export default function Users() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterRole>('all');
    const [search, setSearch] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (err: any) {
            alert('Error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleRoleChange = async (userId: string, newRole: string) => {
        if (!window.confirm(`Change this user's role to "${newRole}"?`)) return;
        setActionLoading(userId);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', userId);
            if (error) throw error;
            await fetchUsers();
        } catch (err: any) {
            alert('Error: ' + err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const filtered = users.filter((u) => {
        const matchesFilter = filter === 'all' || u.role === filter;
        const q = search.toLowerCase();
        const matchesSearch =
            !q ||
            u.full_name?.toLowerCase().includes(q) ||
            u.address?.toLowerCase().includes(q) ||
            u.phone?.toLowerCase().includes(q);
        return matchesFilter && matchesSearch;
    });

    const getCount = (role: FilterRole) =>
        role === 'all' ? users.length : users.filter((u) => u.role === role).length;

    const getRoleClass = (role: string) => {
        switch (role) {
            case 'admin': return 'role-admin';
            case 'owner': return 'role-owner';
            case 'renter': return 'role-renter';
            default: return '';
        }
    };

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const getInitials = (name: string) => {
        if (!name) return '?';
        return name
            .split(' ')
            .map((n) => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
    };

    return (
        <div className="admin-page">
            {/* Header */}
            <div className="admin-page-header">
                <div>
                    <h1>👤 Users</h1>
                    <p className="page-subtitle">{users.length} registered users on the platform</p>
                </div>
                <button className="refresh-btn" onClick={fetchUsers}>🔄 Refresh</button>
            </div>

            {/* Role Tabs */}
            <div className="status-tabs">
                {ROLE_TABS.map((tab) => (
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
                    placeholder="Search by name, email, or phone..."
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
                <div className="table-loading"><div className="spinner" /> Loading users...</div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <p>👥 No users found.</p>
                    <p className="empty-sub">Try adjusting your filter or search.</p>
                </div>
            ) : (
                <div className="table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Phone</th>
                                <th>Role</th>
                                <th>Joined</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((u) => (
                                <tr key={u.id}>
                                    <td>
                                        <div className="user-cell">
                                            <div className="user-avatar">{getInitials(u.full_name)}</div>
                                            <div className="cell-stack">
                                                <span className="cell-primary">{u.full_name || 'No name'}</span>
                                                <span className="cell-secondary">{u.address || 'No address'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="cell-secondary">{u.phone || '—'}</span>
                                    </td>
                                    <td>
                                        <span className={`role-pill ${getRoleClass(u.role)}`}>
                                            {u.role?.charAt(0).toUpperCase() + u.role?.slice(1) || 'N/A'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="cell-secondary">{formatDate(u.created_at)}</span>
                                    </td>
                                    <td>
                                        {u.role !== 'admin' && (
                                            <div className="action-btns">
                                                {u.role === 'renter' && (
                                                    <button
                                                        className="action-btn approve"
                                                        disabled={actionLoading === u.id}
                                                        onClick={() => handleRoleChange(u.id, 'owner')}
                                                    >
                                                        Make Owner
                                                    </button>
                                                )}
                                                {u.role === 'owner' && (
                                                    <button
                                                        className="action-btn neutral"
                                                        disabled={actionLoading === u.id}
                                                        onClick={() => handleRoleChange(u.id, 'renter')}
                                                    >
                                                        Revoke Owner
                                                    </button>
                                                )}
                                                {actionLoading === u.id && (
                                                    <span className="action-loading">Updating...</span>
                                                )}
                                            </div>
                                        )}
                                        {u.role === 'admin' && <span className="no-action">—</span>}
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