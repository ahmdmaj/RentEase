import { supabase } from '../../../services/supabase';
import {
    Conversation,
    ConversationItem,
    Message,
    SendMessagePayload,
} from '../types/message';

/**
 * ============================================================
 * MESSAGING SERVICE LAYER
 * Handles all Supabase database interactions for conversations
 * and messages. No UI code, no React hooks.
 * ============================================================
 */
export class MessageService {
    /**
     * 1. createConversation()
     * Creates a new conversation between renter and owner for a specific listing/vehicle.
     */
    async createConversation(
        vehicleId: string,
        renterId: string,
        ownerId: string
    ): Promise<{ id: string | null; data: Conversation | null; error: any }> {
        try {
            const { data, error } = await supabase
                .from('conversations')
                .insert({
                    vehicle_id: vehicleId,
                    renter_id: renterId,
                    owner_id: ownerId,
                })
                .select('*')
                .single();

            if (error) {
                return { id: null, data: null, error };
            }
            return { id: data.id, data: data as Conversation, error: null };
        } catch (err) {
            console.error('Error creating conversation:', err);
            return { id: null, data: null, error: err };
        }
    }

    /**
     * 2. getConversations()
     * Fetch all conversations for a specific user enriched with profiles,
     * last message, and unread counts.
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
                    updated_at,
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

            const convIds = convData.map((c: any) => c.id);
            const otherPartyIds = Array.from(
                new Set(
                    convData.map((c: any) =>
                        userId === c.owner_id ? c.renter_id : c.owner_id
                    )
                )
            );

            // Batch fetch all participant profiles
            const { data: profilesList } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url')
                .in('id', otherPartyIds);

            const profileMap = new Map(
                (profilesList || []).map((p: any) => [p.id, p])
            );

            // Batch fetch messages across all conversations for last messages and unread counts
            const { data: messagesList } = await supabase
                .from('messages')
                .select('id, conversation_id, message, created_at, sender_id, receiver_id, is_read')
                .in('conversation_id', convIds)
                .order('created_at', { ascending: false });

            const lastMessageMap = new Map();
            const unreadCountMap = new Map<string, number>();

            (messagesList || []).forEach((msg: any) => {
                if (!lastMessageMap.has(msg.conversation_id)) {
                    lastMessageMap.set(msg.conversation_id, {
                        message: msg.message,
                        created_at: msg.created_at,
                        sender_id: msg.sender_id,
                    });
                }
                if (msg.receiver_id === userId && msg.is_read === false) {
                    const current = unreadCountMap.get(msg.conversation_id) || 0;
                    unreadCountMap.set(msg.conversation_id, current + 1);
                }
            });

            const enriched: ConversationItem[] = convData.map((conv: any) => {
                const isOwner = userId === conv.owner_id;
                const otherPartyId = isOwner ? conv.renter_id : conv.owner_id;
                const profileData = profileMap.get(otherPartyId) || null;
                const lastMsgData = lastMessageMap.get(conv.id) || null;
                const unreadCount = unreadCountMap.get(conv.id) || 0;

                const normalizedVehicles = Array.isArray(conv.vehicles)
                    ? conv.vehicles[0] || null
                    : conv.vehicles || null;

                return {
                    ...conv,
                    vehicles: normalizedVehicles,
                    otherPartyProfile: profileData,
                    lastMessage: lastMsgData,
                    unreadCount,
                };
            });

            // Sort by most recent message/conversation timestamp
            enriched.sort((a, b) => {
                const aTime = a.lastMessage?.created_at || a.updated_at || a.created_at;
                const bTime = b.lastMessage?.created_at || b.updated_at || b.created_at;
                return new Date(bTime).getTime() - new Date(aTime).getTime();
            });

            return { data: enriched, error: null };
        } catch (err) {
            console.error('Error fetching conversations:', err);
            return { data: [], error: err };
        }
    }

    /**
     * 3. getConversationById()
     * Fetches a single conversation by ID and enriches it with participant/vehicle details.
     */
    async getConversationById(
        conversationId: string,
        currentUserId?: string
    ): Promise<{ data: ConversationItem | null; error: any }> {
        try {
            const { data: conv, error: convError } = await supabase
                .from('conversations')
                .select(`
                    id,
                    vehicle_id,
                    renter_id,
                    owner_id,
                    created_at,
                    updated_at,
                    vehicles ( make, model, location )
                `)
                .eq('id', conversationId)
                .maybeSingle();

            if (convError || !conv) {
                return { data: null, error: convError || new Error('Conversation not found') };
            }

            let otherPartyProfile = null;
            let unreadCount = 0;

            if (currentUserId) {
                const isOwner = currentUserId === conv.owner_id;
                const otherPartyId = isOwner ? conv.renter_id : conv.owner_id;

                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('full_name, avatar_url')
                    .eq('id', otherPartyId)
                    .maybeSingle();
                otherPartyProfile = profileData || null;

                const { count } = await supabase
                    .from('messages')
                    .select('id', { count: 'exact', head: true })
                    .eq('conversation_id', conv.id)
                    .eq('receiver_id', currentUserId)
                    .eq('is_read', false);
                unreadCount = count || 0;
            }

            const { data: lastMsgData } = await supabase
                .from('messages')
                .select('message, created_at, sender_id')
                .eq('conversation_id', conv.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            const normalizedVehicles = Array.isArray(conv.vehicles)
                ? conv.vehicles[0] || null
                : conv.vehicles || null;

            const enriched: ConversationItem = {
                ...conv,
                vehicles: normalizedVehicles,
                otherPartyProfile,
                lastMessage: lastMsgData || null,
                unreadCount,
            };

            return { data: enriched, error: null };
        } catch (err) {
            console.error('Error fetching conversation by ID:', err);
            return { data: null, error: err };
        }
    }

    /**
     * 4. getMessages()
     * Fetch all messages inside a specific conversation ordered chronologically.
     */
    async getMessages(conversationId: string): Promise<{ data: Message[]; error: any }> {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });

            if (error) {
                return { data: [], error };
            }
            return { data: (data as Message[]) || [], error: null };
        } catch (err) {
            console.error('Error fetching messages:', err);
            return { data: [], error: err };
        }
    }

    /**
     * 5. sendMessage()
     * Sends/inserts a new message inside a conversation.
     */
    async sendMessage(payload: SendMessagePayload): Promise<{ data: Message | null; error: any }> {
        try {
            const { data, error } = await supabase
                .from('messages')
                .insert({
                    conversation_id: payload.conversationId,
                    sender_id: payload.senderId,
                    receiver_id: payload.receiverId,
                    message: payload.message,
                })
                .select('*')
                .single();

            if (error) {
                return { data: null, error };
            }
            return { data: data as Message, error: null };
        } catch (err) {
            console.error('Error sending message:', err);
            return { data: null, error: err };
        }
    }

    /**
     * 6. markAsRead()
     * Marks all unread messages received by `userId` in `conversationId` as read.
     */
    async markAsRead(conversationId: string, userId: string): Promise<{ error: any }> {
        try {
            const { error } = await supabase
                .from('messages')
                .update({ is_read: true })
                .eq('conversation_id', conversationId)
                .eq('receiver_id', userId)
                .eq('is_read', false);

            return { error };
        } catch (err) {
            console.error('Error marking messages as read:', err);
            return { error: err };
        }
    }

    /**
     * ============================================================
     * HELPER METHODS (Used by hooks)
     * Realtime subscriptions are managed by realtime.service.ts
     * ============================================================
     */

    /**
     * Get existing conversation id between renter and owner for a specific vehicle.
     */
    async getConversationByParticipants(
        vehicleId: string,
        renterId: string,
        ownerId: string
    ): Promise<{ id: string | null; error: any }> {
        try {
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
        } catch (err) {
            console.error('Error checking existing conversation:', err);
            return { id: null, error: err };
        }
    }

}

export const messageService = new MessageService();
