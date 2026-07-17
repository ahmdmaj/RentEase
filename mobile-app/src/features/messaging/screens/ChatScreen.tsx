import React, { useRef, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRealtimeChat } from '../hooks/useRealtimeChat';
import { useMessages } from '../hooks/useMessages';
import { ChatBubble } from '../components/ChatBubble';
import { MessageInput } from '../components/MessageInput';
import { DateDivider } from '../components/DateDivider';
import { Message } from '../types/message';

/**
 * ============================================================
 * CHAT SCREEN COMPONENT
 * Active messaging screen. Uses useRealtimeChat and useMessages
 * hooks to manage messages, loading states, and read status.
 * Contains no direct database or Supabase code.
 * ============================================================
 */
export default function ChatScreen({ route, navigation }: any) {
    const { vehicleId, ownerId, renterId, vehicleName, conversationId: routeConversationId } = route?.params || {};
    const flatListRef = useRef<FlatList<Message>>(null);

    // 1. Live realtime chat hook for message subscription, input, and sending
    const {
        user,
        conversationId,
        messages,
        loading: realtimeLoading,
        sending,
        inputText,
        setInputText,
        handleSendMessage,
    } = useRealtimeChat({
        vehicleId,
        ownerId,
        renterId,
        conversationId: routeConversationId,
    });

    // 2. Messaging hook for refreshing and read-status synchronization
    const {
        markAsRead,
        refreshMessages,
        refreshing,
        loading: messagesLoading,
    } = useMessages(conversationId || routeConversationId);

    // Mark conversation messages as read when conversation ID or message count updates
    useEffect(() => {
        if (conversationId) {
            markAsRead(conversationId);
        }
    }, [conversationId, messages.length, markAsRead]);

    const isSameDay = (d1Str: string, d2Str: string) => {
        if (!d1Str || !d2Str) return false;
        const d1 = new Date(d1Str);
        const d2 = new Date(d2Str);
        return (
            d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate()
        );
    };

    const renderMessageItem = ({ item, index }: { item: Message; index: number }) => {
        const isMyMessage = item.sender_id === user?.id;
        const prevItem = index > 0 ? messages[index - 1] : null;
        const showDivider = !prevItem || !isSameDay(prevItem.created_at, item.created_at);

        return (
            <View>
                {showDivider && <DateDivider dateStr={item.created_at} />}
                <ChatBubble message={item} isMyMessage={isMyMessage} />
            </View>
        );
    };

    const isLoading = realtimeLoading && (messagesLoading || messages.length === 0);

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.loadingText}>Loading messages...</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation?.goBack()}
                    style={styles.backBtn}
                    accessibilityLabel="Back"
                >
                    <Ionicons name="arrow-back" size={26} color="#1e293b" />
                </TouchableOpacity>
                <View style={styles.headerTitleGroup}>
                    <Text style={styles.headerTitle} numberOfLines={1}>
                        💬 {vehicleName || 'Chat'}
                    </Text>
                </View>
                <View style={{ width: 28 }} />
            </View>

            {/* Messages FlatList */}
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={renderMessageItem}
                contentContainerStyle={styles.messagesList}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                onRefresh={refreshMessages}
                refreshing={refreshing}
                ListEmptyComponent={() => (
                    <View style={styles.emptyChat}>
                        <View style={styles.emptyIconCircle}>
                            <Ionicons name="chatbubbles-outline" size={52} color="#3b82f6" />
                        </View>
                        <Text style={styles.emptyText}>No messages yet</Text>
                        <Text style={styles.emptySubtext}>
                            Send a message below to start the conversation about this listing!
                        </Text>
                    </View>
                )}
            />

            {/* Input Bar */}
            <MessageInput
                value={inputText}
                onChangeText={setInputText}
                onSend={handleSendMessage}
                sending={sending}
                placeholder="Type a message..."
            />
        </KeyboardAvoidingView>
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
        gap: 12,
    },
    loadingText: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '500',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 52,
        paddingBottom: 14,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 2,
    },
    backBtn: {
        padding: 4,
    },
    headerTitleGroup: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
    },
    messagesList: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexGrow: 1,
    },
    emptyChat: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
        paddingHorizontal: 32,
        gap: 12,
    },
    emptyIconCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 19,
        fontWeight: '700',
        color: '#1e293b',
    },
    emptySubtext: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 20,
    },
});