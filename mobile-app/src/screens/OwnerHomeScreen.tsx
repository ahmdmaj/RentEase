import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    RefreshControl,
} from 'react-native';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';

export default function OwnerHomeScreen({ navigation }: any) {
    const { user, signOut } = useAuthStore();
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchMyVehicles = async () => {
        const { data, error } = await supabase
            .from('vehicles')
            .select('*')
            .eq('owner_id', user?.id)
            .order('created_at', { ascending: false });

        if (error) {
            Alert.alert('Error', error.message);
        } else {
            setVehicles(data || []);
        }
        setLoading(false);
        setRefreshing(false);
    };

    useEffect(() => {
        fetchMyVehicles();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchMyVehicles();
    };

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
                <View>
                    <Text style={styles.headerTitle}>My Listings</Text>
                    <Text style={styles.headerSubtitle}>Manage your vehicles</Text>
                </View>
                <View style={styles.headerRight}>
                    <Text style={styles.userRole}>Owner</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('AddVehicle')}>
                        <Text style={styles.addButton}>+ Add</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleSignOut}>
                        <Text style={styles.logoutButton}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Stats */}
            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{vehicles.length}</Text>
                    <Text style={styles.statLabel}>Total Vehicles</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>
                        {vehicles.filter(v => v.is_available).length}
                    </Text>
                    <Text style={styles.statLabel}>Available</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>
                        {vehicles.filter(v => !v.is_available).length}
                    </Text>
                    <Text style={styles.statLabel}>Unavailable</Text>
                </View>
            </View>

            {/* Vehicle List */}
            <FlatList
                data={vehicles}
                keyExtractor={(item) => item.id}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.card}
                        onPress={() => navigation.navigate('VehicleDetail', { vehicleId: item.id })}
                    >
                        <View style={styles.cardContent}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTitle}>{item.make} {item.model}</Text>
                                <View style={[styles.statusBadge, { backgroundColor: item.is_available ? '#dcfce7' : '#fee2e2' }]}>
                                    <Text style={[styles.statusText, { color: item.is_available ? '#16a34a' : '#dc2626' }]}>
                                        {item.is_available ? 'Available' : 'Unavailable'}
                                    </Text>
                                </View>
                            </View>
                            <Text style={styles.cardSubtitle}>📍 {item.location}</Text>
                            <Text style={styles.cardPrice}>LKR {item.price_per_day} / day</Text>
                        </View>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={() => (
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>You haven't listed any vehicles yet.</Text>
                        <TouchableOpacity style={styles.emptyButton} onPress={() => navigation.navigate('AddVehicle')}>
                            <Text style={styles.emptyButtonText}>+ List Your First Car</Text>
                        </TouchableOpacity>
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
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
    headerSubtitle: { fontSize: 14, color: '#64748b' },
    headerRight: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    userRole: {
        backgroundColor: '#dcfce7',
        color: '#16a34a',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        fontSize: 12,
        fontWeight: '500',
    },
    addButton: { color: '#2563eb', fontWeight: '600', fontSize: 16 },
    logoutButton: { color: '#ef4444', fontWeight: '500', fontSize: 14 },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 16,
        paddingHorizontal: 20,
        backgroundColor: '#fff',
        marginTop: 8,
        marginHorizontal: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    statItem: { alignItems: 'center' },
    statNumber: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
    statLabel: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
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
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardTitle: { fontSize: 18, fontWeight: '600', color: '#1e293b', flex: 1 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: 12, marginLeft: 8 },
    statusText: { fontSize: 12, fontWeight: '500' },
    cardSubtitle: { fontSize: 14, color: '#64748b' },
    cardPrice: { fontSize: 16, fontWeight: '700', color: '#16a34a', marginTop: 4 },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
    emptyText: { fontSize: 16, color: '#94a3b8' },
    emptyButton: { marginTop: 16, backgroundColor: '#2563eb', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
    emptyButtonText: { color: '#fff', fontWeight: '600' },
});