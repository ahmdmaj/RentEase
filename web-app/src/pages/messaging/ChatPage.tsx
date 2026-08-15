import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { Message } from '../../lib/types';

function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatPage() {
  const { id: conversationId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [conversation, setConversation] = useState<any | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const markAsRead = useCallback(async (convId: string, currentUserId: string) => {
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', convId)
      .eq('receiver_id', currentUserId)
      .eq('is_read', false);
  }, []);

  const fetchChatData = useCallback(async () => {
    if (!conversationId || !user) return;
    setLoading(true);
    setError('');

    // Fetch conversation details
    const { data: convData, error: convErr } = await supabase
      .from('conversations')
      .select(`
        id,
        vehicle_id,
        renter_id,
        owner_id,
        created_at,
        vehicles (id, make, model, location, price_per_day, vehicle_images (image_url, display_order)),
        renter:profiles!conversations_renter_id_fkey (id, full_name, avatar_url),
        owner:profiles!conversations_owner_id_fkey (id, full_name, avatar_url)
      `)
      .eq('id', conversationId)
      .single();

    if (convErr || !convData) {
      setError('Conversation not found.');
      setLoading(false);
      return;
    }

    // Verify user is in conversation
    if (convData.renter_id !== user.id && convData.owner_id !== user.id) {
      setError('You are not authorized to view this chat.');
      setLoading(false);
      return;
    }

    setConversation(convData);

    // Fetch messages
    const { data: msgData, error: msgErr } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (msgErr) {
      setError('Failed to load messages.');
      setLoading(false);
      return;
    }

    setMessages((msgData ?? []) as Message[]);
    setLoading(false);

    // Mark messages as read
    markAsRead(conversationId, user.id);
  }, [conversationId, user, markAsRead]);

  useEffect(() => {
    fetchChatData();

    if (!conversationId || !user) return;

    // Subscribe to realtime messages for this conversation
    const channel = supabase
      .channel(`chat-conversation-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            // Avoid duplicate if optimistic update was added
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          // If incoming message was sent to me, mark read
          if (newMsg.receiver_id === user.id) {
            markAsRead(conversationId, user.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user, fetchChatData, markAsRead]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !user || !conversation || sending) return;

    const receiverId =
      user.id === conversation.renter_id ? conversation.owner_id : conversation.renter_id;

    const trimmedText = messageText.trim();
    setMessageText('');
    setSending(true);

    const { error: sendErr } = await supabase.from('messages').insert({
      conversation_id: conversation.id,
      sender_id: user.id,
      receiver_id: receiverId,
      message: trimmedText,
      is_read: false,
    });

    if (sendErr) {
      setError('Failed to send message: ' + sendErr.message);
    }
    setSending(false);
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-10rem)] card animate-pulse">
        <div className="flex items-center gap-3 p-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-full bg-slate-200" />
          <div className="space-y-1.5 flex-1">
            <div className="h-4 bg-slate-200 rounded w-1/4" />
            <div className="h-3 bg-slate-100 rounded w-1/6" />
          </div>
        </div>
        <div className="flex-1 p-4 space-y-4">
          <div className="h-10 bg-slate-200 rounded-2xl w-1/2" />
          <div className="h-10 bg-slate-200 rounded-2xl w-1/2 ml-auto" />
          <div className="h-10 bg-slate-200 rounded-2xl w-2/3" />
        </div>
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 card">
        <div className="text-5xl mb-3">💬</div>
        <h2 className="text-lg font-semibold text-slate-800 mb-2">{error || 'Conversation not found'}</h2>
        <button onClick={() => navigate('/messages')} className="btn-primary mt-2">
          Back to Messages
        </button>
      </div>
    );
  }

  const isUserRenter = user?.id === conversation.renter_id;
  const partner = isUserRenter ? conversation.owner : conversation.renter;
  const partnerName = partner?.full_name ?? (isUserRenter ? 'Vehicle Owner' : 'Renter');
  const partnerRole = isUserRenter ? 'Owner' : 'Renter';
  const partnerInitial = partnerName.charAt(0).toUpperCase();

  const vehicle = conversation.vehicles;
  const thumb = vehicle?.vehicle_images?.[0]?.image_url ?? null;

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-9.5rem)] card p-0 overflow-hidden shadow-card">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-white z-10">
        <div className="flex items-center gap-3">
          <Link
            to="/messages"
            className="p-1.5 -ml-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            ←
          </Link>
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm shadow-sm flex-shrink-0">
            {partnerInitial}
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm leading-none">{partnerName}</p>
            <p className="text-xs text-slate-400 mt-1">{partnerRole}</p>
          </div>
        </div>

        {/* Vehicle Quick Link */}
        {vehicle && (
          <Link
            to={`/vehicle/${vehicle.id}`}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100 text-xs"
          >
            {thumb && (
              <img src={thumb} alt="" className="w-6 h-6 rounded-md object-cover flex-shrink-0" />
            )}
            <span className="font-semibold text-slate-700 truncate max-w-[140px] sm:max-w-[200px]">
              {vehicle.make} {vehicle.model}
            </span>
          </Link>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-50/50">
        {messages.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">
            <div className="text-4xl mb-2">👋</div>
            <p className="font-medium text-slate-600">Start the conversation</p>
            <p className="text-xs mt-1">Send a message to discuss availability, rental terms or questions.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_id === user?.id;

            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-md px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    isMine
                      ? 'bg-primary-600 text-white rounded-br-xs'
                      : 'bg-white border border-slate-100 text-slate-800 rounded-bl-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                  <div
                    className={`flex items-center gap-1 justify-end text-[10px] mt-1 ${
                      isMine ? 'text-primary-100' : 'text-slate-400'
                    }`}
                  >
                    <span>{formatMessageTime(msg.created_at)}</span>
                    {isMine && <span>{msg.is_read ? '✓✓' : '✓'}</span>}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Footer */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 bg-white border-t border-slate-100 flex items-center gap-2"
      >
        <input
          type="text"
          className="input flex-1 py-2.5 text-sm"
          placeholder="Type a message..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          disabled={sending}
          autoFocus
        />
        <button
          type="submit"
          className="btn-primary px-5 py-2.5 text-sm font-semibold flex items-center gap-1.5"
          disabled={!messageText.trim() || sending}
        >
          {sending ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span>Send</span>
              <span>➤</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
