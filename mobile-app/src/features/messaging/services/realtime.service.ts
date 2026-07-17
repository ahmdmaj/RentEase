import { supabase } from '../../../services/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Conversation, Message } from '../types/message';

export interface MessageRealtimeCallbacks {
    onInsert?: (message: Message) => void;
    onUpdate?: (message: Message) => void;
    onDelete?: (oldPayload: { id: string }) => void;
}

export interface ConversationRealtimeCallbacks {
    onInsert?: (conversation: Conversation) => void;
    onUpdate?: (conversation: Conversation) => void;
    onDelete?: (oldPayload: { id: string }) => void;
}

/**
 * ============================================================
 * REALTIME MESSAGING SERVICE
 * Manages all Supabase Realtime subscriptions for messages
 * and conversations. No UI components, no React hooks.
 * ============================================================
 */
export class RealtimeService {
    private activeChannels: Map<string, RealtimeChannel> = new Map();
    private subIdCounter = 0;

    /**
     * Subscribe to new or updated messages in a specific conversation.
     * Generates a unique channel ID per subscription to prevent clobbering
     * across concurrent hooks or components.
     */
    subscribeToMessages(
        conversationId: string,
        callbacks: MessageRealtimeCallbacks
    ): { channel: RealtimeChannel; unsubscribe: () => void } {
        const channelName = `messages:conv:${conversationId}:${++this.subIdCounter}`;

        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`,
                },
                (payload) => {
                    if (callbacks.onInsert && payload.new) {
                        callbacks.onInsert(payload.new as Message);
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`,
                },
                (payload) => {
                    if (callbacks.onUpdate && payload.new) {
                        callbacks.onUpdate(payload.new as Message);
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`,
                },
                (payload) => {
                    if (callbacks.onDelete && payload.old) {
                        callbacks.onDelete(payload.old as { id: string });
                    }
                }
            )
            .subscribe();

        this.activeChannels.set(channelName, channel);

        return {
            channel,
            unsubscribe: () => this.cleanupChannel(channelName),
        };
    }

    /**
     * Subscribe to any new messages directed to a specific user across all conversations.
     */
    subscribeToUserMessages(
        userId: string,
        callbacks: MessageRealtimeCallbacks
    ): { channel: RealtimeChannel; unsubscribe: () => void } {
        const channelName = `messages:user:${userId}:${++this.subIdCounter}`;

        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${userId}`,
                },
                (payload) => {
                    if (callbacks.onInsert && payload.new) {
                        callbacks.onInsert(payload.new as Message);
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${userId}`,
                },
                (payload) => {
                    if (callbacks.onUpdate && payload.new) {
                        callbacks.onUpdate(payload.new as Message);
                    }
                }
            )
            .subscribe();

        this.activeChannels.set(channelName, channel);

        return {
            channel,
            unsubscribe: () => this.cleanupChannel(channelName),
        };
    }

    /**
     * Subscribe to conversation updates or new conversations for a specific user.
     */
    subscribeToConversations(
        userId: string,
        callbacks: ConversationRealtimeCallbacks
    ): { channel: RealtimeChannel; unsubscribe: () => void } {
        const channelName = `conversations:user:${userId}:${++this.subIdCounter}`;

        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'conversations',
                    filter: `renter_id=eq.${userId}`,
                },
                (payload) => {
                    if (callbacks.onInsert && payload.new) {
                        callbacks.onInsert(payload.new as Conversation);
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'conversations',
                    filter: `owner_id=eq.${userId}`,
                },
                (payload) => {
                    if (callbacks.onInsert && payload.new) {
                        callbacks.onInsert(payload.new as Conversation);
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'conversations',
                    filter: `renter_id=eq.${userId}`,
                },
                (payload) => {
                    if (callbacks.onUpdate && payload.new) {
                        callbacks.onUpdate(payload.new as Conversation);
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'conversations',
                    filter: `owner_id=eq.${userId}`,
                },
                (payload) => {
                    if (callbacks.onUpdate && payload.new) {
                        callbacks.onUpdate(payload.new as Conversation);
                    }
                }
            )
            .subscribe();

        this.activeChannels.set(channelName, channel);

        return {
            channel,
            unsubscribe: () => this.cleanupChannel(channelName),
        };
    }

    /**
     * Clean up a specific tracked channel by name or instance.
     */
    cleanupChannel(channelOrName: string | RealtimeChannel | null | undefined): void {
        if (!channelOrName) return;

        if (typeof channelOrName === 'string') {
            const existing = this.activeChannels.get(channelOrName);
            if (existing) {
                supabase.removeChannel(existing);
                this.activeChannels.delete(channelOrName);
            }
        } else {
            for (const [key, ch] of this.activeChannels.entries()) {
                if (ch === channelOrName) {
                    supabase.removeChannel(ch);
                    this.activeChannels.delete(key);
                    return;
                }
            }
            supabase.removeChannel(channelOrName);
        }
    }

    /**
     * Unsubscribe from and remove all active realtime channels tracked by this service.
     */
    cleanupAll(): void {
        for (const [key, channel] of this.activeChannels.entries()) {
            supabase.removeChannel(channel);
            this.activeChannels.delete(key);
        }
    }
}

export const realtimeService = new RealtimeService();
