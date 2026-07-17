import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Message } from '../types/message';
import { formatMessageTime } from '../utils/formatTime';

export interface ChatBubbleProps {
    /** The message object containing text, timestamps, and status */
    message: Message;
    /** True if the message was sent by the current user (renders on the right) */
    isMyMessage: boolean;
}

/**
 * ============================================================
 * CHAT BUBBLE COMPONENT
 * Pure UI presentation for sent and received chat messages.
 * Displays message content and formatted timestamp.
 * No business logic.
 * ============================================================
 */
export const ChatBubble: React.FC<ChatBubbleProps> = ({
    message,
    isMyMessage,
}) => {
    return (
        <View
            style={[
                styles.rowContainer,
                isMyMessage ? styles.sentRow : styles.receivedRow,
            ]}
        >
            <View
                style={[
                    styles.bubble,
                    isMyMessage ? styles.sentBubble : styles.receivedBubble,
                ]}
            >
                <Text
                    style={[
                        styles.messageText,
                        isMyMessage ? styles.sentText : styles.receivedText,
                    ]}
                >
                    {message.message}
                </Text>
                
                <View style={styles.footerRow}>
                    <Text
                        style={[
                            styles.timestampText,
                            isMyMessage ? styles.sentTimestamp : styles.receivedTimestamp,
                        ]}
                    >
                        {formatMessageTime(message.created_at)}
                    </Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    rowContainer: {
        flexDirection: 'row',
        marginVertical: 4,
        paddingHorizontal: 4,
    },
    sentRow: {
        justifyContent: 'flex-end',
    },
    receivedRow: {
        justifyContent: 'flex-start',
    },
    bubble: {
        maxWidth: '80%',
        paddingHorizontal: 14,
        paddingTop: 10,
        paddingBottom: 8,
        borderRadius: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    sentBubble: {
        backgroundColor: '#2563eb',
        borderBottomRightRadius: 4,
    },
    receivedBubble: {
        backgroundColor: '#ffffff',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    sentText: {
        color: '#ffffff',
    },
    receivedText: {
        color: '#1e293b',
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginTop: 4,
    },
    timestampText: {
        fontSize: 11,
        fontWeight: '500',
    },
    sentTimestamp: {
        color: '#bfdbfe',
    },
    receivedTimestamp: {
        color: '#94a3b8',
    },
});
