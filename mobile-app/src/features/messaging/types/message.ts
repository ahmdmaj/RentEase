/**
 * ============================================================
 * MESSAGING TYPES & INTERFACES
 * Based on Supabase database schema (`conversations` & `messages`)
 * ============================================================
 */

/**
 * Message read status
 */
export type MessageStatus = 'sent' | 'delivered' | 'read' | 'unread';

/**
 * Represents a user participating in a conversation (either renter or owner)
 */
export interface ConversationParticipant {
    id: string;
    role: 'renter' | 'owner';
    full_name: string;
    avatar_url?: string;
    email?: string;
}

/**
 * 1. CONVERSATION INTERFACE
 * Matches the `conversations` table in Supabase
 */
export interface Conversation {
    id: string;
    vehicle_id: string;
    renter_id: string;
    owner_id: string;
    created_at: string;
    updated_at?: string;
    participants?: ConversationParticipant[];
}

/**
 * 2. MESSAGE INTERFACE
 * Matches the `messages` table in Supabase
 */
export interface Message {
    id: string;
    conversation_id?: string;
    sender_id: string;
    receiver_id: string;
    message: string;
    created_at: string;
    is_read?: boolean;
    status?: MessageStatus;
}

/**
 * ============================================================
 * SUPPORTING TYPES FOR SERVICES & UI (Rich / Joined Queries)
 * ============================================================
 */

export interface ConversationVehicle {
    make: string;
    model: string;
    location?: string;
}

export interface OtherPartyProfile {
    full_name: string;
    avatar_url?: string;
}

export interface LastMessage {
    message: string;
    created_at: string;
    sender_id: string;
}

/**
 * Enriched conversation item returned by message.service.ts
 */
export interface ConversationItem extends Conversation {
    vehicles: ConversationVehicle | null;
    otherPartyProfile: OtherPartyProfile | null;
    lastMessage: LastMessage | null;
    unreadCount: number;
}

export interface SendMessagePayload {
    conversationId: string;
    senderId: string;
    receiverId: string;
    message: string;
}
