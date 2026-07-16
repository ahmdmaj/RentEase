import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatDateDivider } from '../utils/formatTime';

interface DateDividerProps {
    dateStr?: string;
    label?: string;
}

export const DateDivider: React.FC<DateDividerProps> = ({ dateStr, label }) => {
    const text = label || (dateStr ? formatDateDivider(dateStr) : '');
    if (!text) return null;

    return (
        <View style={styles.container}>
            <View style={styles.line} />
            <View style={styles.badge}>
                <Text style={styles.badgeText}>{text}</Text>
            </View>
            <View style={styles.line} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 12,
        paddingHorizontal: 16,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: '#e2e8f0',
    },
    badge: {
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginHorizontal: 8,
    },
    badgeText: {
        fontSize: 11,
        color: '#64748b',
        fontWeight: '600',
    },
});
