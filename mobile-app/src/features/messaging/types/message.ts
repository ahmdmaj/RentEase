export interface Message {
    id: string;
    conversation_id?: string;
    sender_id: string;
    receiver_id: string;
    message: string;
    created_at: string;
    is_read?: boolean;
}

export interface ConversationVehicle {
    make: string;
    model: string;
    location?: string;
}

export interface OtherPartyProfile {
    full_name: string;
}

export interface LastMessage {
    message: string;
    created_at: string;
    sender_id: string;
}

export interface ConversationItem {
    id: string;
    vehicle_id: string;
    renter_id: string;
    owner_id: string;
    created_at: string;
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
