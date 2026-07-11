import { create } from 'zustand';
import { supabase } from '../services/supabase';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

interface NotificationState {
    unreadCount: number;
    channel: any | null;
    lastNotifiedId: string | null;
    initNotifications: (userId: string) => Promise<void>;
    fetchUnreadCount: (userId: string) => Promise<void>;
    markAllAsReadStore: (userId: string) => Promise<void>;
    decrementUnread: () => void;
    cleanUp: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
    unreadCount: 0,
    channel: null,
    lastNotifiedId: null,

    initNotifications: async (userId: string) => {
        // 1. Request notification permissions and setup channel for Android
        try {
            const existingPermissions = await Notifications.getPermissionsAsync();
            if ((existingPermissions as any).granted !== true && (existingPermissions as any).status !== 'granted') {
                await Notifications.requestPermissionsAsync();
            }
            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('default', {
                    name: 'default',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#2563eb',
                });
            }
        } catch (err) {
            console.error('Notification permissions error:', err);
        }

        // 2. Fetch initial unread count
        await get().fetchUnreadCount(userId);

        // Check if there is a very recent unread notification (created within last 30 seconds, e.g., welcome on signup)
        try {
            const { data: latestUnread } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', userId)
                .eq('is_read', false)
                .order('created_at', { ascending: false })
                .limit(1);

            if (latestUnread && latestUnread.length > 0) {
                const notif = latestUnread[0];
                const notifAgeMs = Date.now() - new Date(notif.created_at).getTime();
                // If created in the last 20 seconds and we haven't notified for it yet
                if (notifAgeMs < 20000 && get().lastNotifiedId !== notif.id) {
                    set({ lastNotifiedId: notif.id });
                    await Notifications.scheduleNotificationAsync({
                        content: {
                            title: notif.title || 'New Notification',
                            body: notif.body || '',
                            sound: true,
                            data: notif.data || {},
                        },
                        trigger: null,
                    });
                }
            }
        } catch (e) {
            console.error('Error checking latest unread:', e);
        }

        // 3. Setup Supabase Realtime Subscription for instantaneous alerts & badge count
        const existingChannel = get().channel;
        if (existingChannel) {
            supabase.removeChannel(existingChannel);
        }

        const channel = supabase
            .channel(`public:notifications:user_id=eq.${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`,
                },
                async (payload) => {
                    const newNotif = payload.new;
                    set((state) => ({ unreadCount: state.unreadCount + 1 }));

                    // Trigger system notification in the mobile notification bar
                    if (get().lastNotifiedId !== newNotif.id) {
                        set({ lastNotifiedId: newNotif.id });
                        try {
                            await Notifications.scheduleNotificationAsync({
                                content: {
                                    title: newNotif.title || 'New Notification',
                                    body: newNotif.body || '',
                                    sound: true,
                                    data: newNotif.data || {},
                                },
                                trigger: null,
                            });
                        } catch (err) {
                            console.error('Error scheduling mobile notification bar alert:', err);
                        }
                    }
                }
            )
            .subscribe();

        set({ channel });
    },

    fetchUnreadCount: async (userId: string) => {
        try {
            const { count, error } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('is_read', false);

            if (!error && count !== null) {
                set({ unreadCount: count });
            }
        } catch (err) {
            console.error('Error fetching unread count:', err);
        }
    },

    markAllAsReadStore: async (userId: string) => {
        set({ unreadCount: 0 });
        try {
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', userId)
                .eq('is_read', false);
        } catch (err) {
            console.error('Error updating unread status:', err);
        }
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
