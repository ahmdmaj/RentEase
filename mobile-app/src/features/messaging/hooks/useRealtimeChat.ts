import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useAuthStore } from '../../../store/authStore';
import { messageService } from '../services/message.service';
import { Message } from '../types/message';

interface UseRealtimeChatOptions {
    vehicleId: string;
    ownerId: string;
    renterId?: string;
}

export const useRealtimeChat = ({
    vehicleId,
    ownerId,
    renterId,
}: UseRealtimeChatOptions) => {
    const { user } = useAuthStore();
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    // Determine the exact renterId (either passed via route or defaulted to current user if not owner)
    const resolvedRenterId = renterId || (user && user.id !== ownerId ? user.id : undefined);

    const fetchMessages = useCallback(async (convId: string) => {
        const { data } = await messageService.getMessages(convId);
        setMessages(data);
        setLoading(false);
    }, []);

    // 1. Get or Create Conversation
    useEffect(() => {
        const setupConversation = async () => {
            if (!user || !ownerId || !resolvedRenterId) {
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
    }, [user, vehicleId, ownerId, resolvedRenterId, fetchMessages]);

    // 2. Realtime Subscription
    useEffect(() => {
        if (!conversationId) return;

        const sub = messageService.subscribeToConversation(conversationId, (newMessage) => {
            // Don't duplicate if it's my own message (already added optimistically)
            if (newMessage.sender_id !== user?.id) {
                setMessages((prev) => [...prev, newMessage]);
            }
        });

        return () => {
            sub.unsubscribe();
        };
    }, [conversationId, user?.id]);

    // 3. Send Message
    const handleSendMessage = async () => {
        if (!inputText.trim() || !conversationId || !user || !resolvedRenterId) return;

        const messageContent = inputText.trim();
        setInputText('');
        setSending(true);

        const receiverId = user.id === ownerId ? resolvedRenterId : ownerId;

        // Optimistic UI update
        const tempMessage: Message = {
            id: 'temp-' + Date.now(),
            sender_id: user.id,
            receiver_id: receiverId,
            message: messageContent,
            created_at: new Date().toISOString(),
            is_read: false,
        };
        setMessages((prev) => [...prev, tempMessage]);

        const { error } = await messageService.sendMessage({
            conversationId,
            senderId: user.id,
            receiverId,
            message: messageContent,
        });

        if (error) {
            Alert.alert('Error', 'Failed to send message.');
            setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
            console.error(error);
        }

        setSending(false);
    };

    return {
        user,
        conversationId,
        messages,
        loading,
        sending,
        inputText,
        setInputText,
        handleSendMessage,
    };
};
