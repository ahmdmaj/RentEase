import { supabase } from '../../../services/supabase';
import {
    ConversationItem,
    Message,
    SendMessagePayload,
} from '../types/message';

class MessageService {
    /**
     * Fetch all conversations for a specific user and enrich them with profiles,
     * last messages, and unread counts.
     */
    async getConversations(userId: string): Promise<{ data: ConversationItem[]; error: any }> {
        try {
            const { data: convData, error: convError } = await supabase
                .from('conversations')
                .select(`
                    id,
                    vehicle_id,
                    renter_id,
                    owner_id,
                    created_at,
                    vehicles ( make, model, location )
                `)
                .or(`renter_id.eq.${userId},owner_id.eq.${userId}`)
                .order('created_at', { ascending: false });

            if (convError) {
                return { data: [], error: convError };
            }

            if (!convData || convData.length === 0) {
                return { data: [], error: null };
            }

            const enriched: ConversationItem[] = await Promise.all(
                convData.map(async (conv: any) => {
                    const isOwner = userId === conv.owner_id;
                    const otherPartyId = isOwner ? conv.renter_id : conv.owner_id;

                    // Fetch other party profile
                    const { data: profileData } = await supabase
                        .from('profiles')
                        .select('full_name')
                        .eq('id', otherPartyId)
                        .maybeSingle();

                    // Fetch last message
                    const { data: lastMsgData } = await supabase
                        .from('messages')
                        .select('message, created_at, sender_id')
                        .eq('conversation_id', conv.id)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    // Count unread messages received by me
                    const { count: unreadCount } = await supabase
                        .from('messages')
                        .select('id', { count: 'exact', head: true })
                        .eq('conversation_id', conv.id)
                        .eq('receiver_id', userId)
                        .eq('is_read', false);

                    return {
                        ...conv,
                        otherPartyProfile: profileData || null,
                        lastMessage: lastMsgData || null,
                        unreadCount: unreadCount || 0,
                    };
                })
            );

            // Sort by most recent message/conversation timestamp
            enriched.sort((a, b) => {
                const aTime = a.lastMessage?.created_at || a.created_at;
                const bTime = b.lastMessage?.created_at || b.created_at;
                return new Date(bTime).getTime() - new Date(aTime).getTime();
            });

            return { data: enriched, error: null };
        } catch (err) {
            console.error('Error in getConversations service:', err);
            return { data: [], error: err };
        }
    }

    /**
     * Get existing conversation id between renter and owner for a specific vehicle.
     */
    async getConversationByParticipants(
        vehicleId: string,
        renterId: string,
        ownerId: string
    ): Promise<{ id: string | null; error: any }> {
        const { data, error } = await supabase
            .from('conversations')
            .select('id')
            .eq('vehicle_id', vehicleId)
            .eq('renter_id', renterId)
            .eq('owner_id', ownerId)
            .maybeSingle();

        if (error) {
            return { id: null, error };
        }
        return { id: data ? data.id : null, error: null };
    }

    /**
     * Create a new conversation between renter and owner for a specific vehicle.
     */
    async createConversation(
        vehicleId: string,
        renterId: string,
        ownerId: string
    ): Promise<{ id: string | null; error: any }> {
        const { data, error } = await supabase
            .from('conversations')
            .insert({
                vehicle_id: vehicleId,
                renter_id: renterId,
                owner_id: ownerId,
            })
            .select('id')
            .single();

        if (error) {
            return { id: null, error };
        }
        return { id: data.id, error: null };
    }

    /**
     * Fetch all messages in a specific conversation ordered chronologically.
     */
    async getMessages(conversationId: string): Promise<{ data: Message[]; error: any }> {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

        if (error) {
            return { data: [], error };
        }
        return { data: data || [], error: null };
    }

    /**
     * Send a new message inside a conversation.
     */
    async sendMessage(payload: SendMessagePayload): Promise<{ error: any }> {
        const { error } = await supabase.from('messages').insert({
            conversation_id: payload.conversationId,
            sender_id: payload.senderId,
            receiver_id: payload.receiverId,
            message: payload.message,
        });

        return { error };
    }

    /**
     * Subscribe to new messages inside a specific conversation via Supabase Realtime.
     */
    subscribeToConversation(
        conversationId: string,
        onReceive: (message: Message) => void
    ): { unsubscribe: () => void } {
        const channel = supabase
            .channel(`messages_channel:${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`,
                },
                (payload) => {
                    const newMessage = payload.new as Message;
                    onReceive(newMessage);
                }
            )
            .subscribe();

        return {
            unsubscribe: () => {
                supabase.removeChannel(channel);
            },
        };
    }

    /**
     * Subscribe to new messages received by a specific user across all conversations.
     */
    subscribeToUserMessages(
        userId: string,
        onUpdate: () => void
    ): { unsubscribe: () => void } {
        const channel = supabase
            .channel(`user_messages_live:${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${userId}`,
                },
                () => {
                    onUpdate();
                }
            )
            .subscribe();

        return {
            unsubscribe: () => {
                supabase.removeChannel(channel);
            },
        };
    }
}

export const messageService = new MessageService();
