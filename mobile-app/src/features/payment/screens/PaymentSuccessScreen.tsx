import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Easing,
    SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * PaymentSuccessScreen
 *
 * Shown after a successful payment confirmation.
 * Replaces the PaymentScreen in the navigation stack so user
 * can't go back to the checkout.
 *
 * Route params expected:
 *   bookingId      string
 *   vehicleName    string
 *   amount         number
 *   paymentId      string
 *   transactionId  string   Razorpay payment ID
 */
export default function PaymentSuccessScreen({ route, navigation }: any) {
    const { vehicleName, amount, transactionId } = route.params;

    // Animated values for entrance animation
    const scale = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        // Sequence: scale in circle → fade in content
        Animated.sequence([
            Animated.spring(scale, {
                toValue: 1,
                tension: 60,
                friction: 6,
                useNativeDriver: true,
            }),
            Animated.parallel([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: 400,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
            ]),
        ]).start();
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>

                {/* Animated success circle */}
                <Animated.View style={[styles.circleOuter, { transform: [{ scale }] }]}>
                    <View style={styles.circleInner}>
                        <Ionicons name="checkmark" size={52} color="#fff" />
                    </View>
                </Animated.View>

                {/* Text content */}
                <Animated.View
                    style={[
                        styles.textBlock,
                        { opacity, transform: [{ translateY }] },
                    ]}
                >
                    <Text style={styles.title}>Payment Successful!</Text>
                    <Text style={styles.subtitle}>
                        Your booking for{' '}
                        <Text style={styles.bold}>{vehicleName}</Text> is now{' '}
                        <Text style={styles.confirmed}>confirmed</Text>.
                    </Text>

                    {/* Payment details */}
                    <View style={styles.detailCard}>
                        <DetailRow
                            icon="cash-outline"
                            label="Amount Paid"
                            value={`LKR ${amount}`}
                            valueColor="#16a34a"
                        />
                        {transactionId && (
                            <DetailRow
                                icon="receipt-outline"
                                label="Transaction ID"
                                value={transactionId.slice(0, 20) + '…'}
                            />
                        )}
                        <DetailRow
                            icon="shield-checkmark-outline"
                            label="Status"
                            value="Confirmed"
                            valueColor="#2563eb"
                        />
                    </View>

                    {/* Info note */}
                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle-outline" size={16} color="#3b82f6" />
                        <Text style={styles.infoText}>
                            The vehicle owner has been notified. You can view your booking details anytime in My Bookings.
                        </Text>
                    </View>
                </Animated.View>
            </View>

            {/* Action Buttons */}
            <Animated.View style={[styles.actions, { opacity }]}>
                <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={() => navigation.navigate('MyBookings')}
                    activeOpacity={0.85}
                >
                    <Ionicons name="calendar-outline" size={18} color="#fff" />
                    <Text style={styles.primaryBtnText}>View My Bookings</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={() => navigation.navigate('Home')}
                    activeOpacity={0.85}
                >
                    <Text style={styles.secondaryBtnText}>Back to Home</Text>
                </TouchableOpacity>
            </Animated.View>
        </SafeAreaView>
    );
}

function DetailRow({
    icon,
    label,
    value,
    valueColor = '#1e293b',
}: {
    icon: any;
    label: string;
    value: string;
    valueColor?: string;
}) {
    return (
        <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
                <Ionicons name={icon} size={15} color="#64748b" />
            </View>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={[styles.detailValue, { color: valueColor }]}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
        justifyContent: 'space-between',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 28,
        gap: 28,
    },

    // Success circle animation
    circleOuter: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#dcfce7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    circleInner: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#16a34a',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Text block
    textBlock: { alignItems: 'center', gap: 16, width: '100%' },
    title: { fontSize: 26, fontWeight: '800', color: '#1e293b', textAlign: 'center' },
    subtitle: { fontSize: 15, color: '#64748b', textAlign: 'center', lineHeight: 22 },
    bold: { fontWeight: '700', color: '#1e293b' },
    confirmed: { fontWeight: '700', color: '#2563eb' },

    // Detail card
    detailCard: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 14,
        paddingVertical: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
        marginTop: 4,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    detailIcon: { width: 20, alignItems: 'center' },
    detailLabel: { flex: 1, fontSize: 13, color: '#64748b' },
    detailValue: { fontSize: 13, fontWeight: '600' },

    // Info box
    infoBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        backgroundColor: '#eff6ff',
        borderRadius: 10,
        padding: 12,
        width: '100%',
    },
    infoText: { flex: 1, fontSize: 12, color: '#3b82f6', lineHeight: 18 },

    // Action buttons
    actions: {
        padding: 24,
        gap: 12,
    },
    primaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#2563eb',
        borderRadius: 14,
        paddingVertical: 16,
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
    secondaryBtn: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    secondaryBtnText: { fontSize: 15, color: '#64748b', fontWeight: '500' },
});
