import React, { useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    ScrollView,
    SafeAreaView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../../store/authStore';
import { usePayment } from '../hooks/usePayment';

/**
 * PaymentScreen
 *
 * Entry point for the payment flow. Receives booking details from route params.
 * Uses usePayment hook for all logic — this screen is purely UI.
 *
 * Route params expected:
 *   bookingId    string   The booking UUID
 *   amount       number   Total amount in LKR
 *   vehicleName  string   e.g. "Toyota Aqua"
 *   startDate    string   "Dec 1, 2025"
 *   endDate      string   "Dec 5, 2025"
 *   days         number   Number of rental days
 */
export default function PaymentScreen({ route, navigation }: any) {
    const { bookingId, amount, vehicleName, startDate, endDate, days } = route.params;
    const { user } = useAuthStore();
    const webViewRef = useRef<any>(null);

    const {
        flowState,
        error,
        razorpayHtml,
        initiatePayment,
        handleWebViewMessage,
        reset,
        isLoading,
        isCheckoutOpen,
    } = usePayment({
        bookingId,
        amount,
        vehicleName,
        onSuccess: (payment) => {
            navigation.replace('PaymentSuccess', {
                bookingId,
                vehicleName,
                amount,
                paymentId: payment.id,
                transactionId: payment.razorpay_payment_id || payment.transaction_id,
            });
        },
        onFailure: (errorMsg) => {
            Alert.alert(
                'Payment Failed',
                errorMsg + '\n\nYou can retry or contact support.',
                [{ text: 'OK' }]
            );
        },
        onCancel: () => {
            // WebView is hidden automatically by flowState returning to 'cancelled'
        },
    });

    const handlePayNow = () => {
        if (!user) return;
        initiatePayment(
            user.email || 'user@rentease.com',
            user.user_metadata?.full_name || 'RentEase User'
        );
    };

    // ── WebView checkout overlay ─────────────────────────────────────
    if (isCheckoutOpen && razorpayHtml) {
        return (
            <SafeAreaView style={styles.container}>
                {/* WebView header with cancel */}
                <View style={styles.webViewHeader}>
                    <TouchableOpacity
                        onPress={() => {
                            Alert.alert(
                                'Cancel Payment',
                                'Are you sure you want to cancel this payment?',
                                [
                                    { text: 'Continue Payment', style: 'cancel' },
                                    {
                                        text: 'Cancel',
                                        style: 'destructive',
                                        onPress: () => reset(),
                                    },
                                ]
                            );
                        }}
                        style={styles.webViewBackBtn}
                    >
                        <Ionicons name="close" size={24} color="#1e293b" />
                    </TouchableOpacity>
                    <Text style={styles.webViewTitle}>Secure Payment</Text>
                    <View style={styles.lockBadge}>
                        <Ionicons name="lock-closed" size={14} color="#16a34a" />
                        <Text style={styles.lockText}>SSL</Text>
                    </View>
                </View>

                <WebView
                    ref={webViewRef}
                    source={{ html: razorpayHtml }}
                    onMessage={(event) => handleWebViewMessage(event.nativeEvent.data)}
                    originWhitelist={['*']}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    startInLoadingState={true}
                    renderLoading={() => (
                        <View style={styles.webViewLoading}>
                            <ActivityIndicator size="large" color="#2563eb" />
                            <Text style={styles.webViewLoadingText}>
                                Loading payment gateway…
                            </Text>
                        </View>
                    )}
                    style={styles.webView}
                />
            </SafeAreaView>
        );
    }

    // ── Processing overlay ────────────────────────────────────────────
    if (flowState === 'processing') {
        return (
            <View style={styles.processingContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.processingTitle}>Confirming Payment…</Text>
                <Text style={styles.processingSubtitle}>
                    Please wait while we confirm your payment with the server.
                </Text>
            </View>
        );
    }

    // ── Main payment summary screen ───────────────────────────────────
    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <Ionicons name="arrow-back" size={24} color="#1e293b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Payment</Text>
                <View style={{ width: 32 }} />
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Booking confirmed banner */}
                <View style={styles.approvedBanner}>
                    <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                    <Text style={styles.approvedText}>
                        Booking approved — complete payment to confirm
                    </Text>
                </View>

                {/* Vehicle card */}
                <View style={styles.vehicleCard}>
                    <View style={styles.vehicleIconWrap}>
                        <Ionicons name="car-sport" size={32} color="#2563eb" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.vehicleTitle}>{vehicleName}</Text>
                        <Text style={styles.vehicleSub}>
                            {startDate} → {endDate}
                        </Text>
                    </View>
                </View>

                {/* Price breakdown */}
                <View style={styles.priceCard}>
                    <Text style={styles.priceCardTitle}>Price Breakdown</Text>

                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Daily Rate</Text>
                        <Text style={styles.priceValue}>
                            LKR {(amount / days).toFixed(0)}
                        </Text>
                    </View>

                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Duration</Text>
                        <Text style={styles.priceValue}>
                            {days} day{days > 1 ? 's' : ''}
                        </Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.priceRow}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>LKR {amount}</Text>
                    </View>
                </View>

                {/* Security assurance */}
                <View style={styles.securityRow}>
                    <Ionicons name="shield-checkmark-outline" size={16} color="#64748b" />
                    <Text style={styles.securityText}>
                        Payments are secured by Razorpay. Your card details are never stored.
                    </Text>
                </View>

                {/* Error state */}
                {(flowState === 'failed' || flowState === 'cancelled') && error && (
                    <View style={styles.errorBox}>
                        <Ionicons name="warning-outline" size={18} color="#dc2626" />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                {/* Pay CTA */}
                <TouchableOpacity
                    style={[
                        styles.payButton,
                        isLoading && styles.payButtonDisabled,
                    ]}
                    onPress={handlePayNow}
                    disabled={isLoading}
                    activeOpacity={0.85}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="card-outline" size={20} color="#fff" />
                            <Text style={styles.payButtonText}>
                                {flowState === 'failed' || flowState === 'cancelled'
                                    ? 'Retry Payment'
                                    : `Pay LKR ${amount}`}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>

                <Text style={styles.footerNote}>
                    You will be redirected to Razorpay's secure checkout.
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#1e293b' },

    // Scroll
    scroll: { flex: 1 },
    content: { padding: 20, gap: 16, paddingBottom: 40 },

    // Approved banner
    approvedBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#f0fdf4',
        borderWidth: 1,
        borderColor: '#bbf7d0',
        borderRadius: 10,
        padding: 12,
    },
    approvedText: { flex: 1, fontSize: 13, color: '#15803d', fontWeight: '500' },

    // Vehicle card
    vehicleCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    vehicleIconWrap: {
        width: 56,
        height: 56,
        borderRadius: 12,
        backgroundColor: '#eff6ff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    vehicleTitle: { fontSize: 17, fontWeight: '700', color: '#1e293b' },
    vehicleSub: { fontSize: 13, color: '#64748b', marginTop: 3 },

    // Price card
    priceCard: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 18,
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    priceCardTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between' },
    priceLabel: { fontSize: 14, color: '#64748b' },
    priceValue: { fontSize: 14, fontWeight: '500', color: '#1e293b' },
    divider: { height: 1, backgroundColor: '#f1f5f9' },
    totalLabel: { fontSize: 17, fontWeight: '700', color: '#1e293b' },
    totalValue: { fontSize: 19, fontWeight: '800', color: '#2563eb' },

    // Security
    securityRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        paddingHorizontal: 4,
    },
    securityText: { flex: 1, fontSize: 12, color: '#94a3b8', lineHeight: 18 },

    // Error
    errorBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        backgroundColor: '#fef2f2',
        borderWidth: 1,
        borderColor: '#fecaca',
        borderRadius: 10,
        padding: 12,
    },
    errorText: { flex: 1, fontSize: 13, color: '#dc2626' },

    // Pay button
    payButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: '#2563eb',
        borderRadius: 14,
        paddingVertical: 17,
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
        marginTop: 4,
    },
    payButtonDisabled: { backgroundColor: '#94a3b8', shadowOpacity: 0 },
    payButtonText: { fontSize: 17, fontWeight: '700', color: '#fff' },
    footerNote: {
        fontSize: 12,
        color: '#94a3b8',
        textAlign: 'center',
        marginTop: 4,
    },

    // WebView overlay
    webViewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    webViewBackBtn: { padding: 4 },
    webViewTitle: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
    lockBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#f0fdf4',
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    lockText: { fontSize: 11, color: '#16a34a', fontWeight: '600' },
    webView: { flex: 1 },
    webViewLoading: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        gap: 12,
    },
    webViewLoadingText: { fontSize: 14, color: '#64748b' },

    // Processing overlay
    processingContainer: {
        flex: 1,
        backgroundColor: '#f8fafc',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: 32,
    },
    processingTitle: { fontSize: 20, fontWeight: '700', color: '#1e293b' },
    processingSubtitle: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 22,
    },
});
