import React, { useRef } from 'react';
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
import { ChatBubble } from '../components/ChatBubble';
import { MessageInput } from '../components/MessageInput';
import { DateDivider } from '../components/DateDivider';
import { Message } from '../types/message';

export default function ChatScreen({ route, navigation }: any) {
    const { vehicleId, ownerId, renterId, vehicleName } = route.params;
    const flatListRef = useRef<FlatList>(null);

    const {
        user,
        messages,
        loading,
        sending,
        inputText,
        setInputText,
        handleSendMessage,
    } = useRealtimeChat({
        vehicleId,
        ownerId,
        renterId,
    });

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

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#2563eb" />
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
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={26} color="#1e293b" />
                </TouchableOpacity>
                <View style={styles.headerTitleGroup}>
                    <Text style={styles.headerTitle} numberOfLines={1}>
                        💬 {vehicleName || 'Chat'}
                    </Text>
                </View>
                <View style={{ width: 28 }} />
            </View>

            {/* Messages List */}
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={renderMessageItem}
                contentContainerStyle={styles.messagesList}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                ListEmptyComponent={() => (
                    <View style={styles.emptyChat}>
                        <View style={styles.emptyIconCircle}>
                            <Ionicons name="chatbubbles" size={48} color="#93c5fd" />
                        </View>
                        <Text style={styles.emptyText}>No messages yet.</Text>
                        <Text style={styles.emptySubtext}>Say hello and start the conversation!</Text>
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
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 52,
        paddingBottom: 14,
        backgroundColor: '#fff',
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
        paddingTop: 80,
        gap: 12,
    },
    emptyIconCircle: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
    },
    emptySubtext: {
        fontSize: 14,
        color: '#64748b',
    },
});