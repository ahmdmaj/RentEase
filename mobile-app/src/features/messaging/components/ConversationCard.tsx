import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ConversationItem } from '../types/message';
import { formatRelativeTime } from '../utils/formatTime';

interface ConversationCardProps {
    item: ConversationItem;
    currentUserId?: string;
    onPress: () => void;
}

export const ConversationCard: React.FC<ConversationCardProps> = ({
    item,
    currentUserId,
    onPress,
}) => {
    const isOwner = currentUserId === item.owner_id;
    const otherName = item.otherPartyProfile?.full_name || (isOwner ? 'Renter' : 'Owner');
    const vehicleName = item.vehicles
        ? `${item.vehicles.make} ${item.vehicles.model}`
        : 'Vehicle';
    const lastMsg = item.lastMessage;
    const hasUnread = item.unreadCount > 0;
    const lastTime = lastMsg?.created_at || item.created_at;

    return (
        <TouchableOpacity
            style={[styles.card, hasUnread && styles.cardUnread]}
            onPress={onPress}
            activeOpacity={0.85}
        >
            {/* Avatar */}
            <View style={[styles.avatar, hasUnread && styles.avatarUnread]}>
                <Text style={[styles.avatarText, hasUnread && styles.avatarTextUnread]}>
                    {otherName.charAt(0).toUpperCase()}
                </Text>
            </View>

            {/* Content */}
            <View style={styles.cardContent}>
                <View style={styles.cardTopRow}>
                    <View style={styles.cardTitleGroup}>
                        <Text style={styles.otherName} numberOfLines={1}>
                            {otherName}
                        </Text>
                        <View style={styles.rolePill}>
                            <Text style={styles.rolePillText}>
                                {isOwner ? '🚗 Your Listing' : '📅 Your Booking'}
                            </Text>
                        </View>
                    </View>
                    <Text style={[styles.timeText, hasUnread && styles.timeTextUnread]}>
                        {formatRelativeTime(lastTime)}
                    </Text>
                </View>

                <Text style={styles.vehicleName} numberOfLines={1}>
                    🚘 {vehicleName}
                </Text>

                <View style={styles.messageRow}>
                    <Text
                        style={[styles.lastMessage, hasUnread && styles.lastMessageUnread]}
                        numberOfLines={1}
                    >
                        {lastMsg
                            ? (lastMsg.sender_id === currentUserId ? '✓ You: ' : '') + lastMsg.message
                            : 'No messages yet. Start the conversation!'}
                    </Text>
                    {hasUnread && (
                        <View style={styles.unreadBadge}>
                            <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
                        </View>
                    )}
                </View>
            </View>

            <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 12,
    },
    cardUnread: {
        backgroundColor: '#faf5ff',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#ddd6fe',
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
    },
    avatarUnread: {
        backgroundColor: '#8b5cf6',
    },
    avatarText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#6d28d9',
    },
    avatarTextUnread: {
        color: '#fff',
    },
    cardContent: {
        flex: 1,
        gap: 3,
    },
    cardTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    cardTitleGroup: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flexWrap: 'wrap',
        marginRight: 8,
    },
    otherName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1e293b',
    },
    rolePill: {
        backgroundColor: '#f1f5f9',
        borderRadius: 8,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    rolePillText: {
        fontSize: 10,
        color: '#64748b',
        fontWeight: '500',
    },
    timeText: {
        fontSize: 11,
        color: '#94a3b8',
        flexShrink: 0,
    },
    timeTextUnread: {
        color: '#8b5cf6',
        fontWeight: '600',
    },
    vehicleName: {
        fontSize: 13,
        color: '#475569',
        fontWeight: '500',
    },
    messageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    lastMessage: {
        fontSize: 13,
        color: '#94a3b8',
        flex: 1,
    },
    lastMessageUnread: {
        color: '#4c1d95',
        fontWeight: '600',
    },
    unreadBadge: {
        backgroundColor: '#8b5cf6',
        borderRadius: 10,
        paddingHorizontal: 7,
        paddingVertical: 2,
        minWidth: 20,
        alignItems: 'center',
    },
    unreadBadgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
    },
});
