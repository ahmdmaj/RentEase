import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { messageService } from '../services/message.service';
import { ConversationItem } from '../types/message';

export const useMessages = () => {
    const { user } = useAuthStore();
    const [conversations, setConversations] = useState<ConversationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchConversations = useCallback(async () => {
        if (!user) return;
        const { data, error } = await messageService.getConversations(user.id);
        if (!error) {
            setConversations(data);
        }
        setLoading(false);
        setRefreshing(false);
    }, [user]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchConversations();
    }, [fetchConversations]);

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    // Live subscription for new messages sent to the current user
    useEffect(() => {
        if (!user) return;

        const sub = messageService.subscribeToUserMessages(user.id, () => {
            fetchConversations();
        });

        return () => {
            sub.unsubscribe();
        };
    }, [user, fetchConversations]);

    return {
        conversations,
        loading,
        refreshing,
        fetchConversations,
        onRefresh,
        user,
    };
};
