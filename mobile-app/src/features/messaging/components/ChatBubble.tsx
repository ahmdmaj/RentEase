import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Message } from '../types/message';
import { formatMessageTime } from '../utils/formatTime';

interface ChatBubbleProps {
    message: Message;
    isMyMessage: boolean;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
    message,
    isMyMessage,
}) => {
    return (
        <View
            style={[
                styles.messageRow,
                isMyMessage ? styles.myMessageRow : styles.theirMessageRow,
            ]}
        >
            <View
                style={[
                    styles.messageBubble,
                    isMyMessage ? styles.myBubble : styles.theirBubble,
                ]}
            >
                <Text
                    style={[
                        styles.messageText,
                        isMyMessage ? styles.myText : styles.theirText,
                    ]}
                >
                    {message.message}
                </Text>
                <Text
                    style={[
                        styles.timeText,
                        isMyMessage ? styles.myTimeText : styles.theirTimeText,
                    ]}
                >
                    {formatMessageTime(message.created_at)}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
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
        lineHeight: 22,
    },
    myText: {
        color: '#fff',
    },
    theirText: {
        color: '#1e293b',
    },
    timeText: {
        fontSize: 10,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    myTimeText: {
        color: '#bfdbfe',
    },
    theirTimeText: {
        color: '#94a3b8',
    },
});
