/**
 * ============================================================
 * PAYMENT TYPES & INTERFACES
 * Based on Supabase `payments` table and Razorpay SDK responses
 * ============================================================
 */

/** Status of a payment record in the DB */
export type PaymentStatus = 'pending' | 'success' | 'failed';

/** Payment status stored on the bookings row */
export type BookingPaymentStatus = 'unpaid' | 'paid' | 'refunded';

/**
 * Matches the `payments` table in Supabase
 */
export interface Payment {
    id: string;
    booking_id: string;
    amount: number;
    status: PaymentStatus;
    transaction_id?: string;        // generic reference
    razorpay_order_id?: string;     // Razorpay order ID (created server-side)
    razorpay_payment_id?: string;   // Razorpay payment ID (returned after success)
    razorpay_signature?: string;    // HMAC signature for server-side verification
    created_at: string;
}

/**
 * Payload to create a new payment record in Supabase
 */
export interface CreatePaymentPayload {
    bookingId: string;
    amount: number;
    razorpayOrderId: string;
}

/**
 * Response from the `create-razorpay-order` Edge Function
 */
export interface RazorpayOrderResponse {
    orderId: string;        // e.g. "order_MXxx..."
    amount: number;         // in smallest currency unit (paise for INR)
    currency: string;       // 'INR'
    keyId: string;          // Razorpay public key (safe to use on client)
}

/**
 * Success payload posted from Razorpay WebView checkout
 */
export interface RazorpaySuccessPayload {
    type: 'PAYMENT_SUCCESS';
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
}

/**
 * Failure payload posted from Razorpay WebView checkout
 */
export interface RazorpayFailurePayload {
    type: 'PAYMENT_FAILED';
    error: {
        code: string;
        description: string;
        source: string;
        step: string;
        reason: string;
    };
}

/**
 * Cancelled payload posted from Razorpay WebView checkout
 */
export interface RazorpayCancelledPayload {
    type: 'PAYMENT_CANCELLED';
}

export type RazorpayWebViewMessage =
    | RazorpaySuccessPayload
    | RazorpayFailurePayload
    | RazorpayCancelledPayload;

/**
 * Booking type extended with payment fields — used in booking screens
 */
export interface BookingWithPayment {
    id: string;
    vehicle_id: string;
    renter_id?: string;
    start_date: string;
    end_date: string;
    total_price: number;
    status: 'pending' | 'approved' | 'confirmed' | 'rejected' | 'completed' | 'cancelled';
    payment_status: BookingPaymentStatus;
    created_at: string;
    vehicles: {
        make: string;
        model: string;
        location: string;
        price_per_day: number;
        is_available?: boolean;
        owner_id: string;
    };
    profiles?: {
        full_name: string;
        phone: string;
    };
}
