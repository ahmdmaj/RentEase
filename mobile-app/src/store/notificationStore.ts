import { create } from 'zustand';
import { supabase } from '../services/supabase';

interface NotificationState {
    unreadCount: number;
    channel: ReturnType<typeof supabase.channel> | null;
    initNotifications: (userId: string) => Promise<void>;
    fetchUnreadCount: (userId: string) => Promise<void>;
    markAllAsReadStore: (userId: string) => Promise<void>;
    decrementUnread: () => void;
    cleanUp: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
    unreadCount: 0,
    channel: null,

    initNotifications: async (userId: string) => {
        // 1. Fetch initial unread count from Supabase
        await get().fetchUnreadCount(userId);

        // 2. Clean up any existing realtime channel first
        const existingChannel = get().channel;
        if (existingChannel) {
            supabase.removeChannel(existingChannel);
            set({ channel: null });
        }

        // 3. Subscribe to new notifications via Supabase Realtime
        const channel = supabase
            .channel(`notifications_${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`,
                },
                (_payload) => {
                    // Increment unread badge when a new notification arrives
                    set((state) => ({ unreadCount: state.unreadCount + 1 }));
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`,
                },
                async (_payload) => {
                    // Re-fetch count whenever any notification is updated (e.g. marked as read)
                    await get().fetchUnreadCount(userId);
                }
            )
            .subscribe();

        set({ channel });
    },

    fetchUnreadCount: async (userId: string) => {
        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_read', false);

        if (!error && count !== null) {
            set({ unreadCount: count });
        }
    },

    markAllAsReadStore: async (userId: string) => {
        // Optimistically reset the badge immediately
        set({ unreadCount: 0 });
        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId)
            .eq('is_read', false);
    },

    decrementUnread: () => {
        set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) }));
    },

    cleanUp: () => {
        const channel = get().channel;
        if (channel) {
            supabase.removeChannel(channel);
        }
        set({ channel: null, unreadCount: 0 });
    },
}));
