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
    Image,
} from 'react-native';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getAvailabilityLabel } from '../constants/vehicleData';

export default function MyListingsScreen({ navigation }: any) {
    const { user } = useAuthStore();
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
            .select('*, bookings(start_date, end_date, status), vehicle_images(image_url, display_order)')
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
            .channel('my_listings_live_bookings')
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
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#1e293b" />
                </TouchableOpacity>
                <View style={styles.headerTitleGroup}>
                    <Text style={styles.headerTitle}>My Listings</Text>
                    <Text style={styles.headerSubtitle}>Manage your vehicles</Text>
                </View>
                {pendingCount > 0 && (
                    <TouchableOpacity
                        style={styles.requestsBadge}
                        onPress={() => navigation.navigate('OwnerBookings')}
                    >
                        <Ionicons name="calendar" size={16} color="#fff" />
                        <Text style={styles.requestsBadgeText}>{pendingCount}</Text>
                    </TouchableOpacity>
                )}
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
                renderItem={({ item }) => {
                    const availabilityLabel = getAvailabilityLabel(item.bookings);
                    const firstImage = item.vehicle_images && item.vehicle_images.length > 0 
                        ? [...item.vehicle_images].sort((a, b) => (a.display_order || 0) - (b.display_order || 0))[0]?.image_url 
                        : null;
                    return (
                    <TouchableOpacity
                        style={styles.card}
                        onPress={() => navigation.navigate('EditVehicle', { vehicleId: item.id })}
                    >
                        <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
                            {/* Thumbnail Image */}
                            {firstImage ? (
                                <Image
                                    source={{ uri: firstImage }}
                                    style={styles.cardThumbnail}
                                    resizeMode="cover"
                                />
                            ) : (
                                <View style={styles.cardThumbnailPlaceholder}>
                                    <Ionicons name="car-sport" size={32} color="#cbd5e1" />
                                </View>
                            )}

                            {/* Text Content */}
                            <View style={[styles.cardContent, { flex: 1 }]}>
                                <View style={styles.cardHeader}>
                                    <Text style={[styles.cardTitle, { flexShrink: 1 }]} numberOfLines={1}>{item.make} {item.model}</Text>
                                    <View style={[styles.statusBadge, { backgroundColor: item.is_available ? '#dcfce7' : '#fef9c3' }]}>
                                        <Text style={[styles.statusText, { color: item.is_available ? '#16a34a' : '#ca8a04' }]}>
                                            {item.is_available ? '✅ Listed' : '⏳ Under Check'}
                                        </Text>
                                    </View>
                                </View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                                    <Text style={styles.cardSubtitle}>📍 {item.location}</Text>
                                    {availabilityLabel ? (
                                        <View style={styles.bookedBadge}>
                                            <Ionicons name="time-outline" size={11} color="#b45309" />
                                            <Text style={styles.bookedBadgeText}>{availabilityLabel}</Text>
                                        </View>
                                    ) : (
                                        <View style={styles.availableBadge}>
                                            <Text style={styles.availableBadgeText}>🟢 Available</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.cardPrice}>LKR {item.price_per_day} / day</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                    );
                }}
                contentContainerStyle={{ paddingBottom: 120 }}
                ListEmptyComponent={() => (
                    <View style={styles.empty}>
                        <Ionicons name="car-outline" size={56} color="#cbd5e1" />
                        <Text style={styles.emptyText}>You haven't listed any vehicles yet.</Text>
                        <TouchableOpacity style={styles.emptyButton} onPress={() => navigation.navigate('AddVehicle')}>
                            <Text style={styles.emptyButtonText}>+ List Your First Car</Text>
                        </TouchableOpacity>
                    </View>
                )}
            />

            {/* Floating Add Button */}
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
                            style={styles.fab}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Ionicons name="add" size={28} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        gap: 12,
    },
    backBtn: {
        padding: 4,
    },
    headerTitleGroup: {
        flex: 1,
    },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1e293b' },
    headerSubtitle: { fontSize: 13, color: '#64748b' },
    requestsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ef4444',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        gap: 4,
    },
    requestsBadgeText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 13,
    },

    // Alert Banner
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
    alertBannerIcon: { marginRight: 12 },
    alertBannerContent: { flex: 1 },
    alertBannerTitle: { fontSize: 15, fontWeight: '700', color: '#92400e' },
    alertBannerSubtitle: { fontSize: 13, color: '#b45309', marginTop: 2 },
    alertBannerButton: {
        backgroundColor: '#f59e0b',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    alertBannerButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },

    // Stats
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

    // Cards
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
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardTitle: { fontSize: 18, fontWeight: '600', color: '#1e293b', flex: 1 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: 12, marginLeft: 8 },
    statusText: { fontSize: 12, fontWeight: '500' },
    cardSubtitle: { fontSize: 14, color: '#64748b' },
    cardPrice: { fontSize: 16, fontWeight: '700', color: '#16a34a', marginTop: 4 },
    cardThumbnail: {
        width: 85,
        height: 80,
        borderRadius: 10,
        backgroundColor: '#f1f5f9',
    },
    cardThumbnailPlaceholder: {
        width: 85,
        height: 80,
        borderRadius: 10,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    bookedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fef3c7',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        gap: 4,
        borderWidth: 1,
        borderColor: '#fde68a',
    },
    bookedBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#b45309',
    },
    availableBadge: {
        backgroundColor: '#dcfce7',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
    },
    availableBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#16a34a',
    },

    // Empty
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60, gap: 12 },
    emptyText: { fontSize: 16, color: '#94a3b8' },
    emptyButton: { marginTop: 8, backgroundColor: '#2563eb', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
    emptyButtonText: { color: '#fff', fontWeight: '600' },

    // FAB
    fabWrapper: {
        position: 'absolute',
        bottom: 28,
        right: 24,
    },
    fab: {
        width: 58,
        height: 58,
        borderRadius: 29,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.45,
        shadowRadius: 10,
        elevation: 10,
    },
});
