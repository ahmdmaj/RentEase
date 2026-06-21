import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { useAuthStore } from '../store/authstore';

export default function HomeScreen() {
    const { user, signOut } = useAuthStore();

    const handleSignOut = async () => {
        await signOut();
        Alert.alert('Signed Out', 'You have been logged out.');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>🚗 RentEase</Text>
            <Text style={styles.welcome}>Welcome, {user?.email}!</Text>
            <Text style={styles.subtitle}>You are logged in.</Text>

            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                <Text style={styles.signOutButtonText}>Sign Out</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        gap: 12,
    },
    title: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    welcome: {
        fontSize: 20,
        color: '#334155',
    },
    subtitle: {
        fontSize: 16,
        color: '#64748b',
    },
    signOutButton: {
        backgroundColor: '#ef4444',
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 40,
        marginTop: 20,
    },
    signOutButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
});