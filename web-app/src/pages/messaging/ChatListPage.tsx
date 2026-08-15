import { Link } from 'react-router-dom';

const MOCK_CHATS = [
  { name: 'Rahul K.', preview: 'Is the car available for...', time: '2m ago', unread: 2 },
  { name: 'Priya M.', preview: 'Thanks! I will be there at...', time: '1h ago', unread: 0 },
  { name: 'Amit S.', preview: 'Can you deliver the bike?', time: 'Yesterday', unread: 1 },
];

export default function ChatListPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="page-title">Messages</h1>
        <p className="page-subtitle">Your conversations with owners and renters</p>
      </div>

      <div className="card p-0 overflow-hidden divide-y divide-slate-100">
        {MOCK_CHATS.map((chat, i) => (
          <Link
            key={i}
            to={`/chat/${i + 1}`}
            className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors"
          >
            {/* Avatar */}
            <div className="w-11 h-11 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold flex-shrink-0">
              {chat.name.charAt(0)}
            </div>
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 text-sm">{chat.name}</span>
                <span className="text-xs text-slate-400">{chat.time}</span>
              </div>
              <p className="text-sm text-slate-500 truncate mt-0.5">{chat.preview}</p>
            </div>
            {/* Unread badge */}
            {chat.unread > 0 && (
              <span className="w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center font-semibold flex-shrink-0">
                {chat.unread}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
