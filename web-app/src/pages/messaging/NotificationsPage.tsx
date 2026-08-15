const MOCK_NOTIFICATIONS = [
  { icon: '✅', title: 'Booking Confirmed', body: 'Your booking for Honda City has been confirmed by the owner.', time: '2 min ago', read: false },
  { icon: '💬', title: 'New Message', body: 'Rahul sent you a message about your booking.', time: '1 hour ago', read: false },
  { icon: '📅', title: 'Booking Request', body: 'A new renter has requested your Activa for this weekend.', time: '3 hours ago', read: true },
  { icon: '💰', title: 'Payment Received', body: 'Payment of ₹3,000 received for booking #1042.', time: 'Yesterday', read: true },
];

export default function NotificationsPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">Stay updated on your bookings and messages</p>
        </div>
        <button className="btn-ghost text-sm text-primary-600">Mark all as read</button>
      </div>

      <div className="card p-0 overflow-hidden divide-y divide-slate-100">
        {MOCK_NOTIFICATIONS.map((n, i) => (
          <div
            key={i}
            className={`flex gap-4 px-5 py-4 transition-colors ${n.read ? 'bg-white' : 'bg-primary-50'}`}
          >
            <div className="text-2xl flex-shrink-0 mt-0.5">{n.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className={`text-sm font-semibold ${n.read ? 'text-slate-700' : 'text-slate-900'}`}>{n.title}</p>
                <span className="text-xs text-slate-400 flex-shrink-0">{n.time}</span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">{n.body}</p>
            </div>
            {!n.read && (
              <div className="w-2 h-2 bg-primary-600 rounded-full flex-shrink-0 mt-2" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
