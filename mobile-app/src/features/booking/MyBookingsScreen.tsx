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
import { Ionicons } from '@expo/vector-icons';

type Booking = {
    id: string;
    vehicle_id: string;
    start_date: string;
    end_date: string;
    total_price: number;
    status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
    created_at: string;
    vehicles: {
        make: string;
        model: string;
        location: string;
        price_per_day: number;
        is_available: boolean;
        owner_id: string;
    };
};

export default function MyBookingsScreen({ navigation }: any) {
    const { user } = useAuthStore();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'completed'>('all');

    const fetchMyBookings = async () => {
        if (!user) return;

        const { data, error } = await supabase
            .from('bookings')
            .select(`
        *,
        vehicles ( make, model, location, price_per_day, is_available, owner_id )
      `)
            .eq('renter_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            Alert.alert('Error', error.message);
        } else {
            setBookings(data || []);
        }
        setLoading(false);
        setRefreshing(false);
    };

    useEffect(() => {
        fetchMyBookings();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchMyBookings();
    };

    const handleCancelBooking = async (bookingId: string) => {
        Alert.alert(
            'Cancel Booking',
            'Are you sure you want to cancel this booking?',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: async () => {
                        const { error } = await supabase
                            .from('bookings')
                            .update({ status: 'cancelled' })
                            .eq('id', bookingId)
                            .eq('renter_id', user?.id);

                        if (error) {
                            Alert.alert('Error', error.message);
                        } else {
                            Alert.alert('Success', 'Booking cancelled successfully.');
                            fetchMyBookings();
                        }
                    },
                },
            ]
        );
    };

    const getFilteredBookings = () => {
        if (filter === 'all') return bookings;
        return bookings.filter(b => b.status === filter);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return '#f59e0b';
            case 'approved': return '#22c55e';
            case 'rejected': return '#ef4444';
            case 'completed': return '#3b82f6';
            case 'cancelled': return '#94a3b8';
            default: return '#94a3b8';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return 'time-outline';
            case 'approved': return 'checkmark-circle-outline';
            case 'rejected': return 'close-circle-outline';
            case 'completed': return 'checkmark-done-circle-outline';
            case 'cancelled': return 'ban-outline';
            default: return 'help-circle-outline';
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getStatusCount = (status: string) => {
        return bookings.filter(b => b.status === status).length;
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    const filteredData = getFilteredBookings();

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>📅 My Bookings</Text>
                <TouchableOpacity onPress={fetchMyBookings}>
                    <Ionicons name="refresh-outline" size={24} color="#1e293b" />
                </TouchableOpacity>
            </View>

            {/* Stats Summary */}
            <View style={styles.statsContainer}>
                <TouchableOpacity
                    style={[styles.statItem, filter === 'all' && styles.statItemActive]}
                    onPress={() => setFilter('all')}
                >
                    <Text style={[styles.statNumber, filter === 'all' && styles.statNumberActive]}>
                        {bookings.length}
                    </Text>
                    <Text style={[styles.statLabel, filter === 'all' && styles.statLabelActive]}>All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.statItem, filter === 'pending' && styles.statItemActive]}
                    onPress={() => setFilter('pending')}
                >
                    <Text style={[styles.statNumber, filter === 'pending' && styles.statNumberActive]}>
                        {getStatusCount('pending')}
                    </Text>
                    <Text style={[styles.statLabel, filter === 'pending' && styles.statLabelActive]}>Pending</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.statItem, filter === 'approved' && styles.statItemActive]}
                    onPress={() => setFilter('approved')}
                >
                    <Text style={[styles.statNumber, filter === 'approved' && styles.statNumberActive]}>
                        {getStatusCount('approved')}
                    </Text>
                    <Text style={[styles.statLabel, filter === 'approved' && styles.statLabelActive]}>Approved</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.statItem, filter === 'completed' && styles.statItemActive]}
                    onPress={() => setFilter('completed')}
                >
                    <Text style={[styles.statNumber, filter === 'completed' && styles.statNumberActive]}>
                        {getStatusCount('completed')}
                    </Text>
                    <Text style={[styles.statLabel, filter === 'completed' && styles.statLabelActive]}>Completed</Text>
                </TouchableOpacity>
            </View>

            {/* Booking List */}
            <FlatList
                data={filteredData}
                keyExtractor={(item) => item.id}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View style={styles.vehicleInfo}>
                                <Text style={styles.cardTitle}>
                                    {item.vehicles?.make} {item.vehicles?.model}
                                </Text>
                                <Text style={styles.cardSubtitle}>📍 {item.vehicles?.location}</Text>
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                                <Ionicons name={getStatusIcon(item.status)} size={14} color={getStatusColor(item.status)} />
                                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.cardBody}>
                            <View style={styles.dateRow}>
                                <View style={styles.dateItem}>
                                    <Text style={styles.dateLabel}>Check In</Text>
                                    <Text style={styles.dateValue}>{formatDate(item.start_date)}</Text>
                                </View>
                                <View style={styles.dateItem}>
                                    <Text style={styles.dateLabel}>Check Out</Text>
                                    <Text style={styles.dateValue}>{formatDate(item.end_date)}</Text>
                                </View>
                            </View>
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>Total Price</Text>
                                <Text style={styles.priceValue}>LKR {item.total_price}</Text>
                            </View>
                        </View>

                        {item.status === 'pending' && (
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => handleCancelBooking(item.id)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel Booking</Text>
                            </TouchableOpacity>
                        )}

                        {/* Chat with Owner button */}
                        {(item.status === 'pending' || item.status === 'approved') && (
                            <TouchableOpacity
                                style={styles.chatButton}
                                onPress={() => navigation.navigate('Chat', {
                                    vehicleId: item.vehicle_id,
                                    ownerId: item.vehicles?.owner_id,
                                    renterId: user?.id,
                                    vehicleName: `${item.vehicles?.make} ${item.vehicles?.model}`,
                                })}
                            >
                                <Ionicons name="chatbubble-outline" size={16} color="#8b5cf6" />
                                <Text style={styles.chatButtonText}>💬 Chat with Owner</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
                ListEmptyComponent={() => (
                    <View style={styles.empty}>
                        <Ionicons name="calendar-outline" size={64} color="#d1d5db" />
                        <Text style={styles.emptyText}>No bookings found</Text>
                        <Text style={styles.emptySubtext}>
                            {filter === 'all' ? 'You haven\'t made any bookings yet.' : `No ${filter} bookings.`}
                        </Text>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1e293b',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#fff',
        marginVertical: 8,
        marginHorizontal: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    statItem: {
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statItemActive: {
        backgroundColor: '#dbeafe',
    },
    statNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#64748b',
    },
    statNumberActive: {
        color: '#2563eb',
    },
    statLabel: {
        fontSize: 12,
        color: '#94a3b8',
    },
    statLabelActive: {
        color: '#2563eb',
        fontWeight: '500',
    },
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
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    vehicleInfo: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
    },
    cardSubtitle: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '500',
    },
    cardBody: {
        gap: 8,
    },
    dateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        padding: 10,
    },
    dateItem: {
        alignItems: 'center',
    },
    dateLabel: {
        fontSize: 11,
        color: '#94a3b8',
    },
    dateValue: {
        fontSize: 14,
        fontWeight: '500',
        color: '#1e293b',
        marginTop: 2,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    priceLabel: {
        fontSize: 13,
        color: '#64748b',
    },
    priceValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#16a34a',
    },
    cancelButton: {
        marginTop: 12,
        paddingVertical: 8,
        backgroundColor: '#fee2e2',
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#dc2626',
        fontWeight: '600',
        fontSize: 14,
    },
    chatButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 10,
        paddingVertical: 10,
        backgroundColor: '#f3e8ff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e9d5ff',
    },
    chatButtonText: {
        color: '#7c3aed',
        fontWeight: '600',
        fontSize: 14,
    },
    empty: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 60,
    },
    emptyText: {
        fontSize: 16,
        color: '#94a3b8',
        marginTop: 12,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#d1d5db',
        marginTop: 4,
    },
});