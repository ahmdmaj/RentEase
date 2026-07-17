import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useAuthStore } from '../../../store/authStore';
import { messageService } from '../services/message.service';
import { realtimeService } from '../services/realtime.service';
import { Message, SendMessagePayload } from '../types/message';

interface UseRealtimeChatOptions {
    vehicleId?: string;
    ownerId?: string;
    renterId?: string;
    conversationId?: string;
}

/**
 * ============================================================
 * USE REALTIME CHAT HOOK
 * Handles live messaging: subscribes to new messages via realtimeService,
 * updates local state, and cleans up subscriptions on unmount.
 * ============================================================
 */
export const useRealtimeChat = ({
    vehicleId,
    ownerId,
    renterId,
    conversationId: initialConversationId,
}: UseRealtimeChatOptions) => {
    const { user } = useAuthStore();
    const [conversationId, setConversationId] = useState<string | null>(
        initialConversationId || null
    );
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Determine the exact renterId (either passed via route or defaulted to current user if not owner)
    const resolvedRenterId = renterId || (user && ownerId && user.id !== ownerId ? user.id : undefined);

    const fetchMessages = useCallback(async (convId: string) => {
        const { data, error: fetchErr } = await messageService.getMessages(convId);
        if (fetchErr) {
            setError(typeof fetchErr === 'string' ? fetchErr : fetchErr.message || 'Failed to load messages');
        } else {
            setMessages(data);
        }
        setLoading(false);
    }, []);

    // 1. Get or Create Conversation
    useEffect(() => {
        const setupConversation = async () => {
            if (initialConversationId) {
                setConversationId(initialConversationId);
                fetchMessages(initialConversationId);
                return;
            }

            if (!user || !vehicleId || !ownerId || !resolvedRenterId) {
                setLoading(false);
                return;
            }

            // Check existing conversation
            const { id: existingId, error: findError } =
                await messageService.getConversationByParticipants(
                    vehicleId,
                    resolvedRenterId,
                    ownerId
                );

            if (findError) {
                console.error('Error checking existing conversation:', findError);
                setError('Failed to load conversation');
                setLoading(false);
                return;
            }

            if (existingId) {
                setConversationId(existingId);
                fetchMessages(existingId);
                return;
            }

            // Only the renter can create a new conversation
            if (user.id !== ownerId) {
                const { id: newId, error: createError } =
                    await messageService.createConversation(
                        vehicleId,
                        resolvedRenterId,
                        ownerId
                    );

                if (createError || !newId) {
                    Alert.alert('Error', 'Could not start chat.');
                    console.error(createError);
                    setError('Could not start chat');
                    setLoading(false);
                    return;
                }

                setConversationId(newId);
                fetchMessages(newId);
            } else {
                setLoading(false);
            }
        };

        setupConversation();
    }, [user, vehicleId, ownerId, resolvedRenterId, initialConversationId, fetchMessages]);

    // 2. Realtime Subscription via realtimeService
    useEffect(() => {
        if (!conversationId) return;

        // Subscribe to live messages (inserts, updates, deletes)
        const { unsubscribe } = realtimeService.subscribeToMessages(conversationId, {
            onInsert: (newMessage) => {
                setMessages((prev) => {
                    // Avoid duplicating messages already added or tracked by ID
                    if (prev.some((m) => m.id === newMessage.id)) {
                        return prev.map((m) => (m.id === newMessage.id ? newMessage : m));
                    }
                    // Check if there is a temporary optimistic message with matching content sent by us
                    if (newMessage.sender_id === user?.id) {
                        const tempIndex = prev.findIndex(
                            (m) => m.id.startsWith('temp-') && m.message === newMessage.message
                        );
                        if (tempIndex !== -1) {
                            const updated = [...prev];
                            updated[tempIndex] = newMessage;
                            return updated;
                        }
                    }
                    return [...prev, newMessage];
                });
            },
            onUpdate: (updatedMessage) => {
                setMessages((prev) =>
                    prev.map((m) => (m.id === updatedMessage.id ? updatedMessage : m))
                );
            },
            onDelete: ({ id }) => {
                setMessages((prev) => prev.filter((m) => m.id !== id));
            },
        });

        // Cleanup subscriptions on unmount
        return () => {
            unsubscribe();
        };
    }, [conversationId, user?.id]);

    // 3. Send Message handler
    const handleSendMessage = async () => {
        if (!inputText.trim() || !conversationId || !user) return;

        const messageContent = inputText.trim();
        setInputText('');
        setSending(true);
        setError(null);

        const receiverId =
            ownerId && user.id === ownerId
                ? resolvedRenterId || ''
                : ownerId || '';

        // Optimistic UI update
        const tempId = `temp-${Date.now()}`;
        const tempMessage: Message = {
            id: tempId,
            conversation_id: conversationId,
            sender_id: user.id,
            receiver_id: receiverId,
            message: messageContent,
            created_at: new Date().toISOString(),
            is_read: false,
            status: 'sent',
        };
        setMessages((prev) => [...prev, tempMessage]);

        const payload: SendMessagePayload = {
            conversationId,
            senderId: user.id,
            receiverId,
            message: messageContent,
        };

        const { data, error: sendErr } = await messageService.sendMessage(payload);

        if (sendErr) {
            Alert.alert('Error', 'Failed to send message.');
            setMessages((prev) => prev.filter((m) => m.id !== tempId));
            setError(typeof sendErr === 'string' ? sendErr : sendErr.message || 'Send failed');
            console.error(sendErr);
        } else if (data) {
            // Replace optimistic temp message with actual DB record
            setMessages((prev) => prev.map((m) => (m.id === tempId ? data : m)));
        }

        setSending(false);
    };

    return {
        user,
        conversationId,
        messages,
        setMessages,
        loading,
        sending,
        error,
        inputText,
        setInputText,
        handleSendMessage,
    };
};
