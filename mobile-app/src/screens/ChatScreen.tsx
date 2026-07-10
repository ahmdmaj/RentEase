import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';
import { Ionicons } from '@expo/vector-icons';

type Message = {
    id: string;
    sender_id: string;
    receiver_id: string;
    message: string;
    created_at: string;
    is_read: boolean;
};

export default function ChatScreen({ route, navigation }: any) {
    const { vehicleId, ownerId, vehicleName } = route.params;
    const { user } = useAuthStore();
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    // 1. Get or Create Conversation
    useEffect(() => {
        const setupConversation = async () => {
            if (!user) return;

            const renterId = route.params.renterId || (user.id === ownerId ? route.params.renterId : user.id);
            if (!renterId || !ownerId) {
                console.error('Missing renterId or ownerId for conversation');
                setLoading(false);
                return;
            }

            // Check if conversation exists
            const { data: existing, error: findError } = await supabase
                .from('conversations')
                .select('id')
                .eq('vehicle_id', vehicleId)
                .eq('renter_id', renterId)
                .eq('owner_id', ownerId)
                .maybeSingle();

            if (findError) {
                console.error('Error finding conversation:', findError);
                return;
            }

            if (existing) {
                setConversationId(existing.id);
                fetchMessages(existing.id);
                setLoading(false);
                return;
            }

            // Create new conversation
            const { data: newConv, error: createError } = await supabase
                .from('conversations')
                .insert({
                    vehicle_id: vehicleId,
                    renter_id: renterId,
                    owner_id: ownerId,
                })
                .select('id')
                .single();

            if (createError) {
                Alert.alert('Error', 'Could not start chat.');
                console.error(createError);
                return;
            }

            setConversationId(newConv.id);
            fetchMessages(newConv.id);
            setLoading(false);
        };

        setupConversation();
    }, []);

    // 2. Fetch Messages
    const fetchMessages = async (convId: string) => {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', convId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching messages:', error);
        } else {
            setMessages(data || []);
        }
        setLoading(false);
    };

    // 3. Supabase Realtime Subscription (Live Chat)
    useEffect(() => {
        if (!conversationId) return;

        // Subscribe to new messages in this conversation
        const channel = supabase
            .channel(`messages:${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`,
                },
                (payload) => {
                    const newMessage = payload.new as Message;
                    // Don't add if it's my own message (already added optimistically)
                    if (newMessage.sender_id !== user?.id) {
                        setMessages((prev) => [...prev, newMessage]);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversationId]);

    // 4. Send Message
    const sendMessage = async () => {
        if (!inputText.trim() || !conversationId || !user) return;

        const messageContent = inputText.trim();
        setInputText('');
        setSending(true);

        // Find receiver (if I am renter, receiver is owner, vice versa)
        const receiverId = user.id === ownerId ? route.params.renterId : ownerId;

        // Optimistic insert (show immediately)
        const tempMessage: Message = {
            id: 'temp-' + Date.now(),
            sender_id: user.id,
            receiver_id: receiverId,
            message: messageContent,
            created_at: new Date().toISOString(),
            is_read: false,
        };
        setMessages((prev) => [...prev, tempMessage]);

        // Actual DB insert
        const { error } = await supabase.from('messages').insert({
            conversation_id: conversationId,
            sender_id: user.id,
            receiver_id: receiverId,
            message: messageContent,
        });

        if (error) {
            Alert.alert('Error', 'Failed to send message.');
            // Remove optimistic message
            setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
            console.error(error);
        }

        setSending(false);
    };

    // 5. Render Message
    const renderMessage = ({ item }: { item: Message }) => {
        const isMyMessage = item.sender_id === user?.id;

        return (
            <View style={[styles.messageRow, isMyMessage ? styles.myMessageRow : styles.theirMessageRow]}>
                <View style={[styles.messageBubble, isMyMessage ? styles.myBubble : styles.theirBubble]}>
                    <Text style={[styles.messageText, isMyMessage ? styles.myText : styles.theirText]}>
                        {item.message}
                    </Text>
                    <Text style={styles.timeText}>
                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
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
            {/* Fixed Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={28} color="#1e293b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>💬 {vehicleName}</Text>
                <View style={{ width: 28 }} />
            </View>

            {/* Messages List */}
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={renderMessage}
                contentContainerStyle={styles.messagesList}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                ListEmptyComponent={() => (
                    <View style={styles.emptyChat}>
                        <Text style={styles.emptyText}>No messages yet.</Text>
                        <Text style={styles.emptySubtext}>Say hello to the owner!</Text>
                    </View>
                )}
            />

            {/* Input Bar */}
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Type a message..."
                    placeholderTextColor="#94a3b8"
                    value={inputText}
                    onChangeText={setInputText}
                    multiline
                />
                <TouchableOpacity
                    style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                    onPress={sendMessage}
                    disabled={!inputText.trim() || sending}
                >
                    <Ionicons name="send" size={24} color={inputText.trim() ? '#fff' : '#94a3b8'} />
                </TouchableOpacity>
            </View>
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
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 48,
        paddingBottom: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1e293b',
    },
    messagesList: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexGrow: 1,
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    myMessageRow: {
        justifyContent: 'flex-end',
    },
    theirMessageRow: {
        justifyContent: 'flex-start',
    },
    messageBubble: {
        maxWidth: '80%',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 16,
    },
    myBubble: {
        backgroundColor: '#2563eb',
        borderBottomRightRadius: 4,
    },
    theirBubble: {
        backgroundColor: '#fff',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    messageText: {
        fontSize: 16,
    },
    myText: {
        color: '#fff',
    },
    theirText: {
        color: '#1e293b',
    },
    timeText: {
        fontSize: 10,
        color: '#94a3b8',
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    emptyChat: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 40,
    },
    emptyText: {
        fontSize: 16,
        color: '#94a3b8',
    },
    emptySubtext: {
        fontSize: 14,
        color: '#d1d5db',
        marginTop: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        alignItems: 'flex-end',
    },
    input: {
        flex: 1,
        backgroundColor: '#f1f5f9',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        maxHeight: 100,
        fontSize: 16,
        color: '#1e293b',
    },
    sendButton: {
        width: 44,
        height: 44,
        backgroundColor: '#2563eb',
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
    sendButtonDisabled: {
        backgroundColor: '#e2e8f0',
    },
});