import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { messageService } from '../services/message.service';
import { realtimeService } from '../services/realtime.service';
import { ConversationItem, Message, SendMessagePayload } from '../types/message';

/**
 * ============================================================
 * USE MESSAGES HOOK
 * Handles loading messages, sending messages, loading state,
 * error state, and refreshing messages via messageService & realtimeService.
 * Also supports conversation list management without breaking UI components.
 * ============================================================
 */
export const useMessages = (conversationId?: string) => {
    const { user } = useAuthStore();

    // Messages state (for active conversation)
    const [messages, setMessages] = useState<Message[]>([]);
    const [sending, setSending] = useState(false);

    // Conversations state (for conversation list screen)
    const [conversations, setConversations] = useState<ConversationItem[]>([]);

    // Shared state
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * 1. Load messages for a specific conversation
     */
    const loadMessages = useCallback(async (convId?: string) => {
        const targetConvId = convId || conversationId;
        if (!targetConvId) return;

        setError(null);
        const { data, error: fetchErr } = await messageService.getMessages(targetConvId);
        if (fetchErr) {
            setError(typeof fetchErr === 'string' ? fetchErr : fetchErr.message || 'Failed to load messages');
        } else {
            setMessages(data);
        }
        setLoading(false);
        setRefreshing(false);
    }, [conversationId]);

    /**
     * 2. Send a message inside a conversation with optimistic UI updates
     */
    const sendMessage = useCallback(async (
        messageContent: string,
        receiverId: string,
        customConvId?: string
    ): Promise<{ data: Message | null; error: any }> => {
        const targetConvId = customConvId || conversationId;
        if (!targetConvId || !user || !messageContent.trim()) {
            const errText = 'Missing conversation, user, or empty message';
            setError(errText);
            return { data: null, error: new Error(errText) };
        }

        setSending(true);
        setError(null);

        const payload: SendMessagePayload = {
            conversationId: targetConvId,
            senderId: user.id,
            receiverId,
            message: messageContent.trim(),
        };

        // Optimistic UI update
        const tempId = `temp-${Date.now()}`;
        const tempMessage: Message = {
            id: tempId,
            conversation_id: targetConvId,
            sender_id: user.id,
            receiver_id: receiverId,
            message: messageContent.trim(),
            created_at: new Date().toISOString(),
            is_read: false,
            status: 'sent',
        };
        setMessages((prev) => [...prev, tempMessage]);

        const { data, error: sendErr } = await messageService.sendMessage(payload);

        if (sendErr) {
            setError(typeof sendErr === 'string' ? sendErr : sendErr.message || 'Failed to send message');
            // Revert optimistic message on error
            setMessages((prev) => prev.filter((m) => m.id !== tempId));
        } else if (data) {
            // Replace temp message with real DB message
            setMessages((prev) => prev.map((m) => (m.id === tempId ? data : m)));
        }

        setSending(false);
        return { data, error: sendErr };
    }, [conversationId, user]);

    /**
     * 3. Refresh messages explicitly
     */
    const refreshMessages = useCallback(async () => {
        setRefreshing(true);
        await loadMessages();
    }, [loadMessages]);

    /**
     * 4. Load all conversations for the logged-in user (for ChatListScreen)
     */
    const fetchConversations = useCallback(async () => {
        if (!user) {
            setLoading(false);
            setRefreshing(false);
            return;
        }

        setError(null);
        const { data, error: convErr } = await messageService.getConversations(user.id);
        if (convErr) {
            setError(typeof convErr === 'string' ? convErr : convErr.message || 'Failed to load conversations');
        } else {
            setConversations(data);
        }
        setLoading(false);
        setRefreshing(false);
    }, [user]);

    /**
     * 5. Shared Refresh handler
     */
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        if (conversationId) {
            loadMessages();
        } else {
            fetchConversations();
        }
    }, [conversationId, loadMessages, fetchConversations]);

    /**
     * 6. Mark messages as read inside a conversation
     */
    const markAsRead = useCallback(async (convId?: string) => {
        const targetConvId = convId || conversationId;
        if (!targetConvId || !user) return;
        await messageService.markAsRead(targetConvId, user.id);
    }, [conversationId, user]);

    // Initial load: either messages (if conversationId provided) or conversations
    useEffect(() => {
        if (conversationId) {
            loadMessages(conversationId);
        } else {
            fetchConversations();
        }
    }, [conversationId, loadMessages, fetchConversations]);

    // Realtime subscriptions
    useEffect(() => {
        if (!user) return;

        if (conversationId) {
            // Subscribe to live messages in this specific conversation
            const { unsubscribe } = realtimeService.subscribeToMessages(conversationId, {
                onInsert: (newMessage) => {
                    if (newMessage.sender_id !== user.id) {
                        setMessages((prev) => {
                            if (prev.some((m) => m.id === newMessage.id)) return prev;
                            return [...prev, newMessage];
                        });
                    }
                },
                onUpdate: (updatedMessage) => {
                    setMessages((prev) =>
                        prev.map((m) => (m.id === updatedMessage.id ? updatedMessage : m))
                    );
                },
            });
            return () => unsubscribe();
        } else {
            // Subscribe to user messages & conversation updates across all chats
            const { unsubscribe: unsubMsg } = realtimeService.subscribeToUserMessages(user.id, {
                onInsert: () => fetchConversations(),
                onUpdate: () => fetchConversations(),
            });
            const { unsubscribe: unsubConv } = realtimeService.subscribeToConversations(user.id, {
                onInsert: () => fetchConversations(),
                onUpdate: () => fetchConversations(),
            });
            return () => {
                unsubMsg();
                unsubConv();
            };
        }
    }, [conversationId, user, fetchConversations]);

    return {
        // Messages APIs
        messages,
        loadMessages,
        sendMessage,
        refreshMessages,
        markAsRead,
        sending,

        // Shared / Conversations APIs
        conversations,
        fetchConversations,
        loading,
        error,
        refreshing,
        onRefresh,
        user,
    };
};
