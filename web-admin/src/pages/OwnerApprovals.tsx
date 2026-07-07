import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import './AdminTable.css';

type Application = {
    id: string;
    profile_id: string;
    business_name: string;
    nic_number: string;
    status: 'pending' | 'approved' | 'rejected';
    submitted_at: string;
    profiles: {
        full_name: string;
        phone: string;
    } | null;
};

type FilterStatus = 'pending' | 'approved' | 'rejected' | 'all';

const STATUS_TABS: { key: FilterStatus; label: string }[] = [
    { key: 'pending', label: '⏳ Pending' },
    { key: 'approved', label: '✅ Approved' },
    { key: 'rejected', label: '❌ Rejected' },
    { key: 'all', label: 'All' },
];

export default function OwnerApprovals() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [filter, setFilter] = useState<FilterStatus>('pending');
    const [search, setSearch] = useState('');

    const fetchApplications = async () => {
        setLoading(true);
        try {
            const query = supabase
                .from('owner_applications')
                .select('*, profiles ( full_name, phone )')
                .order('submitted_at', { ascending: true });

            const { data, error } = await query;
            if (error) throw error;
            setApplications((data as any) || []);
        } catch (error: any) {
            alert('Error fetching applications: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApplications();
    }, []);

    const handleApproval = async (applicationId: string, profileId: string, approve: boolean) => {
        if (!window.confirm(`Are you sure you want to ${approve ? 'approve' : 'reject'} this owner application?`)) {
            return;
        }

        setActionLoading(applicationId);

        try {
            const { data: appData, error: appError } = await supabase
                .from('owner_applications')
                .update({ status: approve ? 'approved' : 'rejected' })
                .eq('id', applicationId)
                .select();

            if (appError) throw appError;
            if (!appData || appData.length === 0) {
                throw new Error('Update blocked by Supabase RLS! Please run migration 002_admin_rls_policies.sql in your Supabase SQL Editor.');
            }

            if (approve) {
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .update({ role: 'owner' })
                    .eq('id', profileId)
                    .select();

                if (profileError) throw profileError;
                if (!profileData || profileData.length === 0) {
                    throw new Error('Profile role update blocked by Supabase RLS! Please run migration 002_admin_rls_policies.sql in your Supabase SQL Editor.');
                }
            }

            alert(`Application ${approve ? 'approved' : 'rejected'} successfully!`);
            fetchApplications();
        } catch (error: any) {
            alert('Error: ' + error.message);
        } finally {
            setActionLoading(null);
        }
    };

    const filtered = applications.filter((app) => {
        const matchesFilter = filter === 'all' || app.status === filter;
        const q = search.toLowerCase();
        const matchesSearch =
            !q ||
            app.profiles?.full_name?.toLowerCase().includes(q) ||
            app.profiles?.phone?.toLowerCase().includes(q) ||
            app.business_name?.toLowerCase().includes(q) ||
            app.nic_number?.toLowerCase().includes(q);
        return matchesFilter && matchesSearch;
    });

    const getCount = (status: FilterStatus) =>
        status === 'all' ? applications.length : applications.filter((a) => a.status === status).length;

    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const getInitials = (name: string) => {
        if (!name) return '?';
        return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
    };

    return (
        <div className="admin-page">
            {/* Header */}
            <div className="admin-page-header">
                <div>
                    <h1>✅ Owner Approvals</h1>
                    <p className="page-subtitle">
                        {getCount('pending')} pending application{getCount('pending') !== 1 ? 's' : ''} waiting for review
                    </p>
                </div>
                <button className="refresh-btn" onClick={fetchApplications}>🔄 Refresh</button>
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
                    placeholder="Search by name, phone, business name, or NIC..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="search-input"
                />
                {search && (
                    <button className="clear-search" onClick={() => setSearch('')}>✕</button>
                )}
            </div>

            {/* Applications Grid */}
            {loading ? (
                <div className="table-loading"><div className="spinner" /> Loading applications...</div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <p>{filter === 'pending' ? '🎉 No pending applications!' : '📭 No applications found.'}</p>
                    <p className="empty-sub">
                        {filter === 'pending' ? 'All owners have been verified.' : 'Try adjusting your filter or search.'}
                    </p>
                </div>
            ) : (
                <div className="approvals-grid-page">
                    {filtered.map((app) => (
                        <div key={app.id} className="approval-card-page">
                            {/* Card Header */}
                            <div className="acp-header">
                                <div className="acp-avatar">{getInitials(app.profiles?.full_name || '')}</div>
                                <div className="acp-identity">
                                    <span className="acp-name">{app.profiles?.full_name || 'Unknown User'}</span>
                                    <span className="acp-email">{app.profiles?.phone ? `📞 ${app.profiles.phone}` : 'No phone'}</span>
                                </div>
                                <span className={`status-pill status-${app.status}`}>
                                    {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                                </span>
                            </div>

                            {/* Info Fields */}
                            <div className="acp-details">
                                <div className="acp-field">
                                    <span className="acp-field-label">Phone</span>
                                    <span className="acp-field-value">{app.profiles?.phone || 'N/A'}</span>
                                </div>
                                <div className="acp-field">
                                    <span className="acp-field-label">Business</span>
                                    <span className="acp-field-value">{app.business_name || 'N/A'}</span>
                                </div>
                                <div className="acp-field">
                                    <span className="acp-field-label">NIC Number</span>
                                    <span className="acp-field-value">{app.nic_number}</span>
                                </div>
                                <div className="acp-field">
                                    <span className="acp-field-label">Submitted</span>
                                    <span className="acp-field-value">{formatDate(app.submitted_at)}</span>
                                </div>
                            </div>

                            {/* Actions — only for pending */}
                            {app.status === 'pending' && (
                                <div className="acp-actions">
                                    <button
                                        className="action-btn approve"
                                        onClick={() => handleApproval(app.id, app.profile_id, true)}
                                        disabled={actionLoading === app.id}
                                    >
                                        {actionLoading === app.id ? 'Processing...' : '✅ Approve'}
                                    </button>
                                    <button
                                        className="action-btn reject"
                                        onClick={() => handleApproval(app.id, app.profile_id, false)}
                                        disabled={actionLoading === app.id}
                                    >
                                        {actionLoading === app.id ? 'Processing...' : '❌ Reject'}
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}