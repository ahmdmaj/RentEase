import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import './OwnerApprovals.css';

type Application = {
    id: string;
    profile_id: string;
    business_name: string;
    nic_number: string;
    status: 'pending' | 'approved' | 'rejected';
    submitted_at: string;
    profiles: {
        full_name: string;
        email: string;
        phone: string;
    };
};

export default function OwnerApprovals() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchApplications = async () => {
        try {
            const { data, error } = await supabase
                .from('owner_applications')
                .select(`
          *,
          profiles ( full_name, email, phone )
        `)
                .eq('status', 'pending')
                .order('submitted_at', { ascending: true });

            if (error) throw error;
            setApplications(data || []);
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
            // 1. Update the application status
            const { error: appError } = await supabase
                .from('owner_applications')
                .update({ status: approve ? 'approved' : 'rejected' })
                .eq('id', applicationId);

            if (appError) throw appError;

            if (approve) {
                // 2. Update the user's role to 'owner'
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({ role: 'owner' })
                    .eq('id', profileId);

                if (profileError) throw profileError;
            }

            alert(`Application ${approve ? 'approved' : 'rejected'} successfully!`);
            fetchApplications(); // Refresh the list
        } catch (error: any) {
            alert('Error: ' + error.message);
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return <div className="loading">Loading applications...</div>;
    }

    return (
        <div className="approvals-container">
            <div className="approvals-header">
                <h1>✅ Owner Approvals</h1>
                <span className="badge">{applications.length} pending</span>
            </div>

            {applications.length === 0 ? (
                <div className="empty-state">
                    <p>🎉 No pending owner applications.</p>
                    <p className="empty-subtext">All owners have been verified.</p>
                </div>
            ) : (
                <div className="approvals-grid">
                    {applications.map((app) => (
                        <div key={app.id} className="approval-card">
                            <div className="card-header">
                                <h3>{app.profiles?.full_name || 'Unknown User'}</h3>
                                <span className="status-badge pending">Pending</span>
                            </div>

                            <div className="card-body">
                                <p><strong>Email:</strong> {app.profiles?.email || 'N/A'}</p>
                                <p><strong>Phone:</strong> {app.profiles?.phone || 'N/A'}</p>
                                <p><strong>Business:</strong> {app.business_name || 'N/A'}</p>
                                <p><strong>NIC:</strong> {app.nic_number}</p>
                                <p className="submitted-at">
                                    <strong>Submitted:</strong> {new Date(app.submitted_at).toLocaleString()}
                                </p>
                            </div>

                            <div className="card-actions">
                                <button
                                    className="btn-approve"
                                    onClick={() => handleApproval(app.id, app.profile_id, true)}
                                    disabled={actionLoading === app.id}
                                >
                                    {actionLoading === app.id ? 'Processing...' : '✅ Approve'}
                                </button>
                                <button
                                    className="btn-reject"
                                    onClick={() => handleApproval(app.id, app.profile_id, false)}
                                    disabled={actionLoading === app.id}
                                >
                                    {actionLoading === app.id ? 'Processing...' : '❌ Reject'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}