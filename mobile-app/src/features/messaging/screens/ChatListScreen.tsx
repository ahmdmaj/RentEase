import React, { useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMessages } from '../hooks/useMessages';
import { ConversationCard } from '../components/ConversationCard';
import { ConversationItem } from '../types/message';

export default function ChatListScreen({ navigation }: any) {
    const {
        conversations,
        loading,
        refreshing,
        fetchConversations,
        onRefresh,
        user,
    } = useMessages();

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchConversations();
        });
        return unsubscribe;
    }, [navigation, fetchConversations]);

    const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

    const renderConversation = ({ item }: { item: ConversationItem }) => {
        const isOwner = user?.id === item.owner_id;
        const vehicleName = item.vehicles
            ? `${item.vehicles.make} ${item.vehicles.model}`
            : 'Vehicle';

        return (
            <ConversationCard
                item={item}
                currentUserId={user?.id}
                onPress={() =>
                    navigation.navigate('Chat', {
                        vehicleId: item.vehicle_id,
                        ownerId: item.owner_id,
                        renterId: item.renter_id,
                        vehicleName,
                    })
                }
            />
        );
    };

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
