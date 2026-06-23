import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';

export default function HomeScreen({ navigation }: any) {
    const { user, signOut } = useAuthStore();
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchVehicles = async () => {
        const { data, error } = await supabase
            .from('vehicles')
            .select('*, profiles(full_name)')
            .eq('is_available', true)
            .order('created_at', { ascending: false });

        if (error) {
            Alert.alert('Error', error.message);
        } else {
            setVehicles(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchVehicles();
    }, []);

    const handleSignOut = async () => {
        await signOut();
        Alert.alert('Signed Out', 'You have been logged out.');
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
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>🚗 RentEase</Text>
                <View style={styles.headerRight}>
                    <Text style={styles.userRole}>Renter</Text>
                    <TouchableOpacity onPress={handleSignOut}>
                        <Text style={styles.logoutButton}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Vehicle List */}
            <FlatList
                data={vehicles}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.card}
                        onPress={() => navigation.navigate('VehicleDetail', { vehicleId: item.id })}
                    >
                        <View style={styles.cardContent}>
                            <Text style={styles.cardTitle}>{item.make} {item.model}</Text>
                            <Text style={styles.cardSubtitle}>📍 {item.location}</Text>
                            <Text style={styles.cardPrice}>LKR {item.price_per_day} / day</Text>
                            {item.profiles && (
                                <Text style={styles.cardOwner}>👤 {item.profiles.full_name || 'Owner'}</Text>
                            )}
                        </View>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={() => (
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>No vehicles available yet.</Text>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
    headerRight: { flexDirection: 'row', gap: 16, alignItems: 'center' },
    userRole: {
        backgroundColor: '#dbeafe',
        color: '#2563eb',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        fontSize: 12,
        fontWeight: '500',
    },
    logoutButton: { color: '#ef4444', fontWeight: '500', fontSize: 14 },
    card: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginTop: 12,
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    cardContent: { gap: 4 },
    cardTitle: { fontSize: 18, fontWeight: '600', color: '#1e293b' },
    cardSubtitle: { fontSize: 14, color: '#64748b' },
    cardPrice: { fontSize: 16, fontWeight: '700', color: '#16a34a', marginTop: 4 },
    cardOwner: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
    emptyText: { fontSize: 16, color: '#94a3b8' },
});