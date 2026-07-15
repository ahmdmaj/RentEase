import React, { useEffect, useState, useCallback } from 'react';
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';

type ConversationItem = {
    id: string;
    vehicle_id: string;
    renter_id: string;
    owner_id: string;
    created_at: string;
    vehicles: {
        make: string;
        model: string;
        location: string;
    } | null;
    otherPartyProfile: { full_name: string } | null;
    lastMessage: {
        message: string;
        created_at: string;
        sender_id: string;
    } | null;
    unreadCount: number;
};

export default function MessagesScreen({ navigation }: any) {
    const { user } = useAuthStore();
    const [conversations, setConversations] = useState<ConversationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchConversations = useCallback(async () => {
        if (!user) return;

        // Fetch all conversations where I am involved (either owner or renter)
        const { data: convData, error: convError } = await supabase
            .from('conversations')
            .select(`
                id,
                vehicle_id,
                renter_id,
                owner_id,
                created_at,
                vehicles ( make, model, location )
            `)
            .or(`renter_id.eq.${user.id},owner_id.eq.${user.id}`)
            .order('created_at', { ascending: false });

        if (convError) {
            console.error('Error fetching conversations:', convError);
            setLoading(false);
            setRefreshing(false);
            return;
        }

        if (!convData || convData.length === 0) {
            setConversations([]);
            setLoading(false);
            setRefreshing(false);
            return;
        }

        // Enrich each conversation with other party profile, last message, and unread count
        const enriched: ConversationItem[] = await Promise.all(
            convData.map(async (conv: any) => {
                const isOwner = user.id === conv.owner_id;
                const otherPartyId = isOwner ? conv.renter_id : conv.owner_id;

                // Fetch other party profile
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', otherPartyId)
                    .maybeSingle();

                // Fetch last message
                const { data: lastMsgData } = await supabase
                    .from('messages')
                    .select('message, created_at, sender_id')
                    .eq('conversation_id', conv.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                // Count unread messages received by me
                const { count: unreadCount } = await supabase
                    .from('messages')
                    .select('id', { count: 'exact', head: true })
                    .eq('conversation_id', conv.id)
                    .eq('receiver_id', user.id)
                    .eq('is_read', false);

                return {
                    ...conv,
                    otherPartyProfile: profileData || null,
                    lastMessage: lastMsgData || null,
                    unreadCount: unreadCount || 0,
                };
            })
        );

        // Sort by last message time (most recent first)
        enriched.sort((a, b) => {
            const aTime = a.lastMessage?.created_at || a.created_at;
            const bTime = b.lastMessage?.created_at || b.created_at;
            return new Date(bTime).getTime() - new Date(aTime).getTime();
        });

        setConversations(enriched);
        setLoading(false);
        setRefreshing(false);
    }, [user]);

    useEffect(() => {
        fetchConversations();

        const unsubscribe = navigation.addListener('focus', () => {
            fetchConversations();
        });
        return unsubscribe;
    }, [navigation, fetchConversations]);

    // Real-time: update when new messages arrive for me
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel('messages_screen_live')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${user.id}`,
                },
                () => {
                    fetchConversations();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, fetchConversations]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchConversations();
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const renderConversation = ({ item }: { item: ConversationItem }) => {
        const isOwner = user?.id === item.owner_id;
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
                onPress={() =>
                    navigation.navigate('Chat', {
                        vehicleId: item.vehicle_id,
                        ownerId: item.owner_id,
                        renterId: item.renter_id,
                        vehicleName,
                    })
                }
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
                            {formatTime(lastTime)}
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
                                ? (lastMsg.sender_id === user?.id ? '✓ You: ' : '') + lastMsg.message
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

    const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#8b5cf6" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#1e293b" />
                </TouchableOpacity>
                <View style={styles.headerTitleGroup}>
                    <Text style={styles.headerTitle}>💬 Messages</Text>
                    <Text style={styles.headerSubtitle}>
                        {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                    </Text>
                </View>
                {totalUnread > 0 && (
                    <View style={styles.headerBadge}>
                        <Text style={styles.headerBadgeText}>{totalUnread}</Text>
                    </View>
                )}
            </View>

            <FlatList
                data={conversations}
                keyExtractor={(item) => item.id}
                renderItem={renderConversation}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#8b5cf6']}
                        tintColor="#8b5cf6"
                    />
                }
                contentContainerStyle={styles.listContent}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                ListEmptyComponent={() => (
                    <View style={styles.empty}>
                        <View style={styles.emptyIconCircle}>
                            <Ionicons name="chatbubbles-outline" size={56} color="#c4b5fd" />
                        </View>
                        <Text style={styles.emptyTitle}>No Messages Yet</Text>
                        <Text style={styles.emptySubtext}>
                            When you book a vehicle or receive a booking,{'\n'}your conversations will appear here.
                        </Text>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 56,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 3,
    },
    backBtn: { padding: 4 },
    headerTitleGroup: { flex: 1 },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    headerSubtitle: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 1,
    },
    headerBadge: {
        backgroundColor: '#8b5cf6',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
        minWidth: 28,
        alignItems: 'center',
    },
    headerBadgeText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 13,
    },

    listContent: {
        paddingVertical: 8,
        paddingBottom: 40,
    },

    // Conversation Card
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
    separator: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginLeft: 78,
    },

    // Empty State
    empty: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 80,
        paddingHorizontal: 32,
        gap: 16,
    },
    emptyIconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#f3e8ff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1e293b',
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: 14,
        color: '#94a3b8',
        textAlign: 'center',
        lineHeight: 22,
    },
});
