import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { Conversation, Message } from '../../lib/types';

function formatChatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ChatListPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');

    // Fetch conversations where user is renter or owner
    const { data: convData, error: convErr } = await supabase
      .from('conversations')
      .select(`
        id,
        vehicle_id,
        renter_id,
        owner_id,
        created_at,
        vehicles (id, make, model, location, vehicle_images (image_url, display_order)),
        renter:profiles!conversations_renter_id_fkey (id, full_name, avatar_url),
        owner:profiles!conversations_owner_id_fkey (id, full_name, avatar_url)
      `)
      .or(`renter_id.eq.${user.id},owner_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (convErr) {
      setError('Failed to load conversations.');
      setLoading(false);
      return;
    }

    const convList = (convData ?? []) as any[];

    // Fetch latest message and unread count for each conversation
    const enrichedList: Conversation[] = await Promise.all(
      convList.map(async (c) => {
        const { data: lastMsgData } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', c.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', c.id)
          .eq('receiver_id', user.id)
          .eq('is_read', false);

        return {
          ...c,
          last_message: (lastMsgData as Message) ?? null,
          unread_count: unreadCount ?? 0,
        };
      })
    );

    // Sort by latest message date or conversation creation date
    enrichedList.sort((a, b) => {
      const timeA = new Date(a.last_message?.created_at || a.created_at).getTime();
      const timeB = new Date(b.last_message?.created_at || b.created_at).getTime();
      return timeB - timeA;
    });

    setConversations(enrichedList);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchConversations();

    if (!user) return;

    // Listen to new messages to update conversation previews & badges
    const channel = supabase
      .channel(`user-messages-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchConversations]);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="page-title">Messages</h1>
        <p className="page-subtitle">Your conversations with owners and renters</p>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-center gap-2">
          <span>⚠️</span> {error}
          <button onClick={fetchConversations} className="ml-auto underline text-xs">
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="card p-0 overflow-hidden divide-y divide-slate-100 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              <div className="w-12 h-12 rounded-full bg-slate-200 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-1/3" />
                <div className="h-3 bg-slate-100 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-20 card">
          <div className="text-5xl mb-3">💬</div>
          <h2 className="text-lg font-semibold text-slate-800 mb-1">No messages yet</h2>
          <p className="text-slate-400 text-sm mb-5">
            When you contact a vehicle owner or receive inquiries about your vehicles, chats will appear here.
          </p>
          <Link to="/" className="btn-primary inline-block text-sm">
            Browse Vehicles
          </Link>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden divide-y divide-slate-100 shadow-sm">
          {conversations.map((chat) => {
            const isUserRenter = user?.id === chat.renter_id;
            const partner = isUserRenter ? chat.owner : chat.renter;
            const partnerName = partner?.full_name ?? (isUserRenter ? 'Vehicle Owner' : 'Renter');
            const partnerInitial = partnerName.charAt(0).toUpperCase();

            const vehicle = chat.vehicles;
            const vehicleText = vehicle ? `${vehicle.make} ${vehicle.model}` : 'Vehicle';
            const lastMsg = chat.last_message;
            const timeText = lastMsg
              ? formatChatTime(lastMsg.created_at)
              : formatChatTime(chat.created_at);

            return (
              <Link
                key={chat.id}
                to={`/chat/${chat.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors"
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-base flex-shrink-0 shadow-sm">
                  {partnerInitial}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-900 text-sm truncate">
                      {partnerName}
                    </span>
                    <span className="text-xs text-slate-400 flex-shrink-0">{timeText}</span>
                  </div>

                  <p className="text-xs text-primary-600 font-medium truncate mt-0.5">
                    🚗 {vehicleText}
                  </p>

                  <p className={`text-sm truncate mt-0.5 ${chat.unread_count && chat.unread_count > 0 ? 'font-semibold text-slate-900' : 'text-slate-500'}`}>
                    {lastMsg ? (
                      <>
                        {lastMsg.sender_id === user?.id && <span className="text-slate-400">You: </span>}
                        {lastMsg.message}
                      </>
                    ) : (
                      <span className="italic text-slate-400">No messages yet</span>
                    )}
                  </p>
                </div>

                {/* Unread badge */}
                {chat.unread_count !== undefined && chat.unread_count > 0 && (
                  <span className="min-w-[20px] h-5 px-1.5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    {chat.unread_count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
