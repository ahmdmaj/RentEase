import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { Notification } from '../../lib/types';

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getNotificationIcon(type: string): string {
  switch (type) {
    case 'system_welcome':
      return '🎉';
    case 'owner_booking_request':
      return '📩';
    case 'renter_booking_approved':
      return '✅';
    case 'renter_booking_rejected':
      return '❌';
    case 'owner_booking_cancelled':
      return '🗑️';
    case 'owner_booking_completed':
      return '🏁';
    case 'renter_leave_review':
      return '⭐';
    case 'owner_vehicle_approved':
      return '🚗';
    case 'renter_rental_starts':
      return '🔑';
    case 'payment_received':
      return '💰';
    default:
      return '🔔';
  }
}

function getNotificationLink(notification: Notification): string | null {
  const { type, data } = notification;
  if (type === 'owner_booking_request' || type === 'owner_booking_cancelled' || type === 'owner_booking_completed') {
    return '/owner-bookings';
  }
  if (type === 'renter_booking_approved' || type === 'renter_booking_rejected' || type === 'renter_rental_starts') {
    return data?.booking_id ? `/my-bookings` : '/my-bookings';
  }
  if (type === 'owner_vehicle_approved') {
    return '/my-listings';
  }
  if (data?.vehicle_id) {
    return `/vehicle/${data.vehicle_id}`;
  }
  return null;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');

    const { data, error: err } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (err) {
      setError('Failed to load notifications.');
      setLoading(false);
      return;
    }

    setNotifications((data ?? []) as Notification[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchNotifications();

    if (!user) return;

    // Realtime subscription for incoming notifications
    const channel = supabase
      .channel(`user-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) =>
            prev.map((n) => (n.id === payload.new.id ? (payload.new as Notification) : n))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications]);

  const markAsRead = async (id: string, isAlreadyRead: boolean) => {
    if (isAlreadyRead) return;
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  };

  const markAllAsRead = async () => {
    if (!user || notifications.length === 0) return;
    const hasUnread = notifications.some((n) => !n.is_read);
    if (!hasUnread) return;

    setMarkingAll(true);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    setMarkingAll(false);
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">Stay updated on your bookings, requests and messages</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            disabled={markingAll}
            className="btn-ghost text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50"
          >
            {markingAll ? 'Marking...' : 'Mark all as read'}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-center gap-2">
          <span>⚠️</span> {error}
          <button onClick={fetchNotifications} className="ml-auto underline text-xs">
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="card p-0 overflow-hidden divide-y divide-slate-100 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-4 px-5 py-4">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-1/3" />
                <div className="h-3 bg-slate-100 rounded w-4/5" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20 card">
          <div className="text-5xl mb-3">🔔</div>
          <h2 className="text-lg font-semibold text-slate-800 mb-1">No notifications yet</h2>
          <p className="text-slate-400 text-sm">
            We'll notify you when you have updates on bookings, vehicles, or messages.
          </p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden divide-y divide-slate-100 shadow-sm">
          {notifications.map((n) => {
            const link = getNotificationLink(n);
            const icon = getNotificationIcon(n.type);

            const content = (
              <div
                onClick={() => markAsRead(n.id, n.is_read)}
                className={`flex gap-4 px-5 py-4 transition-colors cursor-pointer ${
                  n.is_read ? 'bg-white hover:bg-slate-50' : 'bg-primary-50/50 hover:bg-primary-50'
                }`}
              >
                <div className="text-2xl flex-shrink-0 mt-0.5">{icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm font-semibold ${n.is_read ? 'text-slate-700' : 'text-slate-900'}`}>
                      {n.title}
                    </p>
                    <span className="text-xs text-slate-400 flex-shrink-0">
                      {formatRelativeTime(n.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">{n.body}</p>
                </div>
                {!n.is_read && (
                  <div className="w-2.5 h-2.5 bg-primary-600 rounded-full flex-shrink-0 mt-2 self-start" />
                )}
              </div>
            );

            return link ? (
              <Link key={n.id} to={link} className="block">
                {content}
              </Link>
            ) : (
              <div key={n.id}>{content}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
