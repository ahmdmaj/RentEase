import { useState } from 'react';
import { useParams } from 'react-router-dom';

const MOCK_MESSAGES = [
  { text: 'Hi! Is the car available for this weekend?', mine: false, time: '10:30 AM' },
  { text: 'Yes, it is available! Which dates do you need?', mine: true, time: '10:32 AM' },
  { text: 'Sat 16th to Mon 18th. How much would that be?', mine: false, time: '10:35 AM' },
  { text: 'That would be ₹4,500 for 3 days. Shall I confirm?', mine: true, time: '10:37 AM' },
];

export default function ChatPage() {
  const { id } = useParams();
  const [message, setMessage] = useState('');

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-10rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => history.back()} className="btn-ghost p-2">←</button>
        <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
          R
        </div>
        <div>
          <p className="font-semibold text-slate-900 text-sm">Chat #{id}</p>
          <p className="text-xs text-green-500 font-medium">Online</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 py-4 px-1">
        {MOCK_MESSAGES.map((msg, i) => (
          <div key={i} className={`flex ${msg.mine ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${
                msg.mine
                  ? 'bg-primary-600 text-white rounded-br-none'
                  : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
              }`}
            >
              <p>{msg.text}</p>
              <p className={`text-xs mt-1 ${msg.mine ? 'text-primary-200' : 'text-slate-400'}`}>{msg.time}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-3 pt-4 border-t border-slate-100">
        <input
          type="text"
          className="input flex-1"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && setMessage('')}
        />
        <button
          className="btn-primary px-4"
          onClick={() => setMessage('')}
          disabled={!message.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}
