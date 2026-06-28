import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    ScrollView,
} from 'react-native';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function BookingScreen({ route, navigation }: any) {
    const { vehicle } = route.params;
    const { user } = useAuthStore();

    // State
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [loading, setLoading] = useState(false);

    // Calculate total price
    const calculateTotal = () => {
        if (!startDate || !endDate) return null;
        const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        if (days <= 0) return null;
        return {
            days,
            total: days * vehicle.price_per_day,
        };
    };

    const bookingDetails = calculateTotal();

    const handleConfirmBooking = async () => {
        if (!startDate || !endDate) {
            Alert.alert('Error', 'Please select both start and end dates.');
            return;
        }

        const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        if (days <= 0) {
            Alert.alert('Error', 'End date must be after start date.');
            return;
        }

        setLoading(true);

        // Format dates for Supabase (YYYY-MM-DD)
        const start = startDate.toISOString().split('T')[0];
        const end = endDate.toISOString().split('T')[0];

        const { data, error } = await supabase.rpc('check_and_create_booking', {
            p_vehicle_id: vehicle.id,
            p_renter_id: user?.id,
            p_start_date: start,
            p_end_date: end,
        });

        setLoading(false);

        if (error) {
            Alert.alert('Error', error.message);
            return;
        }

        if (data && data.success === false) {
            Alert.alert('Unavailable', data.error || 'Vehicle is not available for the selected dates.');
            return;
        }

        if (data && data.success === true) {
            Alert.alert(
                'Booking Request Sent! 🎉',
                `Your booking has been submitted for ${vehicle.make} ${vehicle.model}.\n\nTotal: LKR ${data.total_price}\nStatus: ${data.status}`,
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.navigate('Home'),
                    },
                ]
            );
        }
    };

    // Format date for display
    const formatDate = (date: Date | null) => {
        if (!date) return 'Select Date';
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    // Get minimum date (today)
    const getMinDate = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
    };

    // Get minimum end date (start date + 1 day)
    const getMinEndDate = () => {
        if (!startDate) return getMinDate();
        const minDate = new Date(startDate);
        minDate.setDate(minDate.getDate() + 1);
        return minDate;
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={28} color="#1e293b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Book Vehicle</Text>
                <View style={{ width: 28 }} />
            </View>

            {/* Vehicle Summary */}
            <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>
                    {vehicle.make} {vehicle.model}
                </Text>
                <Text style={styles.summaryPrice}>LKR {vehicle.price_per_day} / day</Text>
                <Text style={styles.summaryLocation}>📍 {vehicle.location}</Text>
            </View>

            {/* Date Selection */}
            <Text style={styles.sectionTitle}>📅 Select Dates</Text>

            {/* Start Date */}
            <TouchableOpacity style={styles.dateButton} onPress={() => setShowStartPicker(true)}>
                <Ionicons name="calendar-outline" size={24} color="#2563eb" />
                <View style={styles.dateTextContainer}>
                    <Text style={styles.dateLabel}>Start Date</Text>
                    <Text style={styles.dateValue}>{formatDate(startDate)}</Text>
                </View>
                <Ionicons name="chevron-down" size={20} color="#94a3b8" />
            </TouchableOpacity>

            {/* End Date */}
            <TouchableOpacity
                style={[styles.dateButton, !startDate && styles.dateButtonDisabled]}
                onPress={() => {
                    if (!startDate) {
                        Alert.alert('Select Start Date First', 'Please select a start date before choosing an end date.');
                        return;
                    }
                    setShowEndPicker(true);
                }}
                disabled={!startDate}
            >
                <Ionicons name="calendar-outline" size={24} color={startDate ? '#2563eb' : '#94a3b8'} />
                <View style={styles.dateTextContainer}>
                    <Text style={styles.dateLabel}>End Date</Text>
                    <Text style={[styles.dateValue, !startDate && styles.dateValueDisabled]}>
                        {formatDate(endDate)}
                    </Text>
                </View>
                <Ionicons name="chevron-down" size={20} color="#94a3b8" />
            </TouchableOpacity>

            {/* Price Summary */}
            {bookingDetails && (
                <View style={styles.summaryBox}>
                    <Text style={styles.summaryBoxTitle}>💰 Price Summary</Text>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Daily Rate</Text>
                        <Text style={styles.summaryValue}>LKR {vehicle.price_per_day}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Number of Days</Text>
                        <Text style={styles.summaryValue}>{bookingDetails.days} day{bookingDetails.days > 1 ? 's' : ''}</Text>
                    </View>
                    <View style={[styles.summaryRow, styles.totalRow]}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>LKR {bookingDetails.total}</Text>
                    </View>
                </View>
            )}

            {/* Confirm Button */}
            <TouchableOpacity
                style={[
                    styles.confirmButton,
                    (!startDate || !endDate || loading) && styles.confirmButtonDisabled,
                ]}
                onPress={handleConfirmBooking}
                disabled={!startDate || !endDate || loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.confirmButtonText}>✅ Confirm Booking</Text>
                )}
            </TouchableOpacity>

            {/* Date Picker Modals */}
            {showStartPicker && (
                <DateTimePicker
                    value={startDate || getMinDate()}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                        setShowStartPicker(false);
                        if (selectedDate) {
                            setStartDate(selectedDate);
                            // Reset end date if it's before the new start date
                            if (endDate && selectedDate >= endDate) {
                                setEndDate(null);
                            }
                        }
                    }}
                    minimumDate={getMinDate()}
                />
            )}

            {showEndPicker && (
                <DateTimePicker
                    value={endDate || getMinEndDate()}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                        setShowEndPicker(false);
                        if (selectedDate) {
                            setEndDate(selectedDate);
                        }
                    }}
                    minimumDate={getMinEndDate()}
                />
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    content: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 60,
        paddingBottom: 24,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1e293b',
    },
    summaryCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    summaryTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1e293b',
    },
    summaryPrice: {
        fontSize: 18,
        fontWeight: '700',
        color: '#16a34a',
        marginTop: 4,
    },
    summaryLocation: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 16,
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    dateButtonDisabled: {
        opacity: 0.6,
    },
    dateTextContainer: {
        flex: 1,
        marginLeft: 12,
    },
    dateLabel: {
        fontSize: 12,
        color: '#94a3b8',
    },
    dateValue: {
        fontSize: 16,
        color: '#1e293b',
        fontWeight: '500',
    },
    dateValueDisabled: {
        color: '#94a3b8',
    },
    summaryBox: {
        backgroundColor: '#eff6ff',
        borderRadius: 12,
        padding: 16,
        marginTop: 16,
        marginBottom: 24,
    },
    summaryBoxTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 12,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
    },
    summaryLabel: {
        color: '#64748b',
        fontSize: 14,
    },
    summaryValue: {
        color: '#1e293b',
        fontWeight: '500',
        fontSize: 14,
    },
    totalRow: {
        borderTopWidth: 1,
        borderTopColor: '#dbeafe',
        marginTop: 6,
        paddingTop: 10,
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1e293b',
    },
    totalValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#2563eb',
    },
    confirmButton: {
        backgroundColor: '#2563eb',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    confirmButtonDisabled: {
        backgroundColor: '#94a3b8',
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
});