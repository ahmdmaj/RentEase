import React from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MessageInputProps {
    value: string;
    onChangeText: (text: string) => void;
    onSend: () => void;
    sending?: boolean;
    placeholder?: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({
    value,
    onChangeText,
    onSend,
    sending = false,
    placeholder = 'Type a message...',
}) => {
    const isDisabled = !value.trim() || sending;

    return (
        <View style={styles.inputContainer}>
            <TextInput
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor="#94a3b8"
                value={value}
                onChangeText={onChangeText}
                multiline
            />
            <TouchableOpacity
                style={[styles.sendButton, isDisabled && styles.sendButtonDisabled]}
                onPress={onSend}
                disabled={isDisabled}
            >
                <Ionicons
                    name="send"
                    size={22}
                    color={!isDisabled ? '#fff' : '#94a3b8'}
                />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
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
