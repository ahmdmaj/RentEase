import React, { useEffect, useState, useRef } from 'react';
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    RefreshControl,
    Animated,
} from 'react-native';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function OwnerHomeScreen({ navigation }: any) {
    const { user, signOut } = useAuthStore();
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const fabScale = useRef(new Animated.Value(1)).current;

    const onFabPressIn = () => {
        Animated.spring(fabScale, { toValue: 0.92, useNativeDriver: true, speed: 30 }).start();
    };
    const onFabPressOut = () => {
        Animated.spring(fabScale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();
    };

    const hasShownLoginAlert = useRef(false);

    const fetchDashboardData = async () => {
        if (!user) return;

        const vehiclesRes = await supabase
            .from('vehicles')
            .select('*')
            .eq('owner_id', user.id)
            .order('created_at', { ascending: false });

        if (vehiclesRes.error) {
            Alert.alert('Error', vehiclesRes.error.message);
            setLoading(false);
            setRefreshing(false);
            return;
        }

        const myVehicles = vehiclesRes.data || [];
        setVehicles(myVehicles);

        if (myVehicles.length > 0) {
            const vehicleIds = myVehicles.map(v => v.id);
            const pendingRes = await supabase
                .from('bookings')
                .select('id')
                .in('vehicle_id', vehicleIds)
                .eq('status', 'pending');

            if (!pendingRes.error) {
                const pendingList = pendingRes.data || [];
                setPendingRequests(pendingList);

                // If owner just logged in / loaded dashboard and has pending requests, show popup alert
                if (!hasShownLoginAlert.current && pendingList.length > 0) {
                    hasShownLoginAlert.current = true;
                    Alert.alert(
                        '🔔 Action Required!',
                        `You have ${pendingList.length} pending booking request(s) waiting for approval.`,
                        [
                            { text: 'Dismiss', style: 'cancel' },
                            { text: 'Review Now', onPress: () => navigation.navigate('OwnerBookings') }
                        ]
                    );
                }
            }
        } else {
            setPendingRequests([]);
        }

        setLoading(false);
        setRefreshing(false);
    };

    useEffect(() => {
        fetchDashboardData();
        const unsubscribe = navigation.addListener('focus', () => {
            fetchDashboardData();
        });
        return unsubscribe;
    }, [navigation, user]);

    // Real-time listener for incoming booking requests
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel('owner_dashboard_live_bookings')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'bookings' },
                () => {
                    fetchDashboardData();
                    Alert.alert(
                        '🔔 New Booking Request!',
                        'A renter just submitted a new booking request for one of your vehicles.',
                        [
                            { text: 'Later', style: 'cancel' },
                            { text: 'Review Now', onPress: () => navigation.navigate('OwnerBookings') }
                        ]
                    );
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchDashboardData();
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

    const pendingCount = pendingRequests.length;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>My Listings</Text>
                    <Text style={styles.headerSubtitle}>Manage your vehicles</Text>
                </View>
                <View style={styles.headerRight}>
                    <TouchableOpacity
                        style={[
                            styles.requestsButton,
                            pendingCount > 0 ? styles.requestsButtonPending : styles.requestsButtonEmpty
                        ]}
                        onPress={() => navigation.navigate('OwnerBookings')}
                    >
                        <Ionicons
                            name="calendar"
                            size={18}
                            color={pendingCount > 0 ? '#fff' : '#475569'}
                        />
                        <Text
                            style={[
                                styles.requestsButtonText,
                                pendingCount > 0 ? styles.requestsButtonTextPending : styles.requestsButtonTextEmpty
                            ]}
                        >
                            {pendingCount} Pending
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleSignOut}>
                        <Text style={styles.logoutButton}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Notification Banner when pending requests exist */}
            {pendingCount > 0 && (
                <TouchableOpacity
                    style={styles.alertBanner}
                    onPress={() => navigation.navigate('OwnerBookings')}
                    activeOpacity={0.85}
                >
                    <View style={styles.alertBannerIcon}>
                        <Ionicons name="notifications" size={24} color="#d97706" />
                    </View>
                    <View style={styles.alertBannerContent}>
                        <Text style={styles.alertBannerTitle}>🔔 Action Required!</Text>
                        <Text style={styles.alertBannerSubtitle}>
                            You have {pendingCount} pending booking request{pendingCount > 1 ? 's' : ''} waiting for approval.
                        </Text>
                    </View>
                    <View style={styles.alertBannerButton}>
                        <Text style={styles.alertBannerButtonText}>Review ➔</Text>
                    </View>
                </TouchableOpacity>
            )}

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
                        onPress={() => navigation.navigate('EditVehicle', { vehicleId: item.id })}
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
                contentContainerStyle={{ paddingBottom: 120 }}
                ListEmptyComponent={() => (
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>You haven't listed any vehicles yet.</Text>
                        <TouchableOpacity style={styles.emptyButton} onPress={() => navigation.navigate('AddVehicle')}>
                            <Text style={styles.emptyButtonText}>+ List Your First Car</Text>
                        </TouchableOpacity>
                    </View>
                )}
            />

            {/* Bottom Navigation */}
            <View style={styles.bottomNavContainer}>
                <View style={styles.bottomNav}>
                    <TouchableOpacity style={styles.navItem} onPress={() => { }}>
                        <Ionicons name="home" size={24} color="#fff" />
                        <Text style={styles.navLabel}>Home</Text>
                    </TouchableOpacity>

                    {/* Central FAB */}
                    <View style={styles.fabWrapper}>
                        <Animated.View style={{ transform: [{ scale: fabScale }] }}>
                            <TouchableOpacity
                                onPress={() => navigation.navigate('AddVehicle')}
                                onPressIn={onFabPressIn}
                                onPressOut={onFabPressOut}
                                activeOpacity={1}
                            >
                                <LinearGradient
                                    colors={['#3B82F6', '#1D4ED8']}
                                    style={styles.fabGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <Ionicons name="add" size={30} color="#fff" />
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>
                        <Text style={styles.fabLabel}>Add Vehicle</Text>
                    </View>

                    <TouchableOpacity style={styles.navItem} onPress={() => { }}>
                        <Ionicons name="person" size={24} color="rgba(255,255,255,0.6)" />
                        <Text style={[styles.navLabel, { color: 'rgba(255,255,255,0.6)' }]}>Profile</Text>
                    </TouchableOpacity>
                </View>
            </View>
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
    headerRight: { flexDirection: 'row', gap: 10, alignItems: 'center' },
    requestsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    requestsButtonEmpty: {
        backgroundColor: '#f1f5f9',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    requestsButtonPending: {
        backgroundColor: '#ef4444',
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 3,
    },
    requestsButtonText: {
        fontSize: 12,
        fontWeight: '600',
    },
    requestsButtonTextEmpty: {
        color: '#475569',
    },
    requestsButtonTextPending: {
        color: '#fff',
    },
    logoutButton: { color: '#ef4444', fontWeight: '500', fontSize: 14 },
    alertBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fef3c7',
        marginHorizontal: 16,
        marginTop: 12,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#fde68a',
        shadowColor: '#d97706',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    alertBannerIcon: {
        marginRight: 12,
    },
    alertBannerContent: {
        flex: 1,
    },
    alertBannerTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#92400e',
    },
    alertBannerSubtitle: {
        fontSize: 13,
        color: '#b45309',
        marginTop: 2,
    },
    alertBannerButton: {
        backgroundColor: '#f59e0b',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    alertBannerButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 13,
    },
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
    bottomNavContainer: {
        position: 'absolute',
        bottom: 20,
        left: 16,
        right: 16,
    },
    bottomNav: {
        flexDirection: 'row',
        backgroundColor: '#1e293b',
        width: '100%',
        height: 68,
        borderRadius: 34,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 32,
        shadowColor: '#1e293b',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 10,
    },
    navItem: {
        alignItems: 'center',
        gap: 2,
        paddingHorizontal: 8,
    },
    navLabel: {
        fontSize: 10,
        color: '#fff',
        fontWeight: '500',
        marginTop: 2,
    },
    fabWrapper: {
        alignItems: 'center',
        top: -28,
    },
    fabGradient: {
        width: 62,
        height: 62,
        borderRadius: 31,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.55,
        shadowRadius: 10,
        elevation: 12,
        borderWidth: 3,
        borderColor: '#f8fafc',
    },
    fabLabel: {
        fontSize: 10,
        color: '#3B82F6',
        fontWeight: '700',
        marginTop: 6,
        letterSpacing: 0.3,
    },
});