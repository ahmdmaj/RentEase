import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    View,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    ScrollView,
} from 'react-native';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen({ navigation }: any) {
    const { user, signOut } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [role, setRole] = useState('renter');

    // Fetch profile data
    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('full_name, phone, role')
                .eq('id', user.id)
                .single();

            if (error) throw error;

            setFullName(data?.full_name || '');
            setPhone(data?.phone || '');
            setRole(data?.role || 'renter');
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    // Save profile updates
    const handleSave = async () => {
        if (!user) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: fullName,
                    phone: phone,
                })
                .eq('id', user.id);

            if (error) throw error;

            Alert.alert('Success', 'Profile updated successfully!');
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setSaving(false);
        }
    };

    // Sign Out
    const handleSignOut = async () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                        await signOut();
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'Login' }],
                        });
                    },
                },
            ]
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
        <View style={styles.container}>
            {/* Fixed Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1e293b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.content}>

            {/* Avatar */}
            <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {fullName ? fullName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || '?'}
                    </Text>
                </View>
                <Text style={styles.roleBadge}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                </Text>
            </View>

            {/* Quick Activity & Requests Menu */}
            <View style={styles.menuCard}>
                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => navigation.navigate('MyBookings')}
                >
                    <Ionicons name="calendar-outline" size={22} color="#2563eb" />
                    <Text style={styles.menuText}>My Bookings</Text>
                    <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                </TouchableOpacity>
                <View style={styles.menuDivider} />
                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => navigation.navigate('MyListings')}
                >
                    <Ionicons name="car-sport-outline" size={22} color="#2563eb" />
                    <Text style={styles.menuText}>Your Listings</Text>
                    <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                </TouchableOpacity>
                <View style={styles.menuDivider} />
                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => navigation.navigate('OwnerBookings')}
                >
                    <Ionicons name="clipboard-outline" size={22} color="#2563eb" />
                    <Text style={styles.menuText}>Booking Requests</Text>
                    <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                </TouchableOpacity>
            </View>

            {/* Email (Read-only) */}
            <View style={styles.inputContainer}>
                <Text style={styles.label}>📧 Email</Text>
                <View style={styles.readonlyInput}>
                    <Text style={styles.readonlyText}>{user?.email}</Text>
                </View>
            </View>

            {/* Full Name (Editable) */}
            <View style={styles.inputContainer}>
                <Text style={styles.label}>👤 Full Name</Text>
                <TextInput
                    style={styles.input}
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Enter your full name"
                    placeholderTextColor="#94a3b8"
                />
            </View>

            {/* Phone (Editable) */}
            <View style={styles.inputContainer}>
                <Text style={styles.label}>📱 Phone</Text>
                <TextInput
                    style={styles.input}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Enter your phone number"
                    placeholderTextColor="#94a3b8"
                    keyboardType="phone-pad"
                />
            </View>

            {/* Save Button */}
            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
                {saving ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.saveButtonText}>💾 Save Changes</Text>
                )}
            </TouchableOpacity>

            {/* Sign Out Button */}
            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                <Text style={styles.signOutButtonText}>🚪 Sign Out</Text>
            </TouchableOpacity>

            <View style={styles.bottomSpacer} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    scrollContainer: {
        flex: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
    },
    content: {
        paddingHorizontal: 20,
        paddingBottom: 40,
        paddingTop: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    backButton: { padding: 4 },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#2563eb',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatarText: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#fff',
    },
    roleBadge: {
        backgroundColor: '#dbeafe',
        color: '#2563eb',
        paddingHorizontal: 16,
        paddingVertical: 4,
        borderRadius: 12,
        fontSize: 14,
        fontWeight: '500',
    },
    menuCard: {
        backgroundColor: '#fff',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 4,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        gap: 12,
    },
    menuText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        color: '#1e293b',
    },
    menuDivider: {
        height: 1,
        backgroundColor: '#f1f5f9',
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#334155',
        marginBottom: 6,
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 16,
        color: '#1e293b',
    },
    readonlyInput: {
        backgroundColor: '#f1f5f9',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    readonlyText: {
        fontSize: 16,
        color: '#64748b',
    },
    saveButton: {
        backgroundColor: '#2563eb',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    signOutButton: {
        backgroundColor: '#fee2e2',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 12,
    },
    signOutButtonText: {
        color: '#dc2626',
        fontSize: 16,
        fontWeight: '600',
    },
    bottomSpacer: {
        height: 20,
    },
});