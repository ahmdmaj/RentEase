import { supabase } from '../../../services/supabase';
import {
    Payment,
    PaymentStatus,
    CreatePaymentPayload,
    RazorpayOrderResponse,
} from '../types/payment';

/**
 * ============================================================
 * PAYMENT SERVICE LAYER
 * Handles all Supabase database interactions for payments.
 * No UI code, no React hooks.
 * Follows the same pattern as MessageService.
 * ============================================================
 */
export class PaymentService {

    /**
     * 1. createRazorpayOrder()
     * Calls the Supabase Edge Function to create a Razorpay order server-side.
     * This keeps the Razorpay secret key off the client device.
     */
    async createRazorpayOrder(
        bookingId: string,
        amount: number,
        currency: string = 'INR'
    ): Promise<{ data: RazorpayOrderResponse | null; error: any }> {
        try {
            const { data, error } = await supabase.functions.invoke(
                'create-razorpay-order',
                { body: { bookingId, amount, currency } }
            );

            if (error) {
                console.error('Edge function error:', error);
                return { data: null, error };
            }

            if (data?.error) {
                return { data: null, error: new Error(data.error) };
            }

            return { data: data as RazorpayOrderResponse, error: null };
        } catch (err) {
            console.error('createRazorpayOrder error:', err);
            return { data: null, error: err };
        }
    }

    /**
     * 2. createPaymentRecord()
     * Inserts a new payment record with status='pending' BEFORE opening checkout.
     * This ensures we always have a record, even if the user closes the app.
     */
    async createPaymentRecord(
        payload: CreatePaymentPayload
    ): Promise<{ data: Payment | null; error: any }> {
        try {
            const { data, error } = await supabase
                .from('payments')
                .insert({
                    booking_id: payload.bookingId,
                    amount: payload.amount,
                    status: 'pending',
                    razorpay_order_id: payload.razorpayOrderId,
                })
                .select('*')
                .single();

            if (error) {
                console.error('createPaymentRecord error:', error);
                return { data: null, error };
            }

            return { data: data as Payment, error: null };
        } catch (err) {
            console.error('createPaymentRecord exception:', err);
            return { data: null, error: err };
        }
    }

    /**
     * 3. confirmPayment()
     * Called after Razorpay returns success.
     * Updates the payment record with Razorpay IDs and sets status='success'.
     * The DB trigger then auto-sets the booking to status='confirmed'.
     */
    async confirmPayment(
        paymentId: string,
        razorpayPaymentId: string,
        razorpayOrderId: string,
        razorpaySignature: string
    ): Promise<{ data: Payment | null; error: any }> {
        try {
            const { data, error } = await supabase
                .from('payments')
                .update({
                    status: 'success' as PaymentStatus,
                    transaction_id: razorpayPaymentId,
                    razorpay_payment_id: razorpayPaymentId,
                    razorpay_order_id: razorpayOrderId,
                    razorpay_signature: razorpaySignature,
                })
                .eq('id', paymentId)
                .select('*')
                .single();

            if (error) {
                console.error('confirmPayment error:', error);
                return { data: null, error };
            }

            return { data: data as Payment, error: null };
        } catch (err) {
            console.error('confirmPayment exception:', err);
            return { data: null, error: err };
        }
    }

    /**
     * 4. failPayment()
     * Called when Razorpay returns a failure.
     * Updates the payment record to status='failed'.
     */
    async failPayment(
        paymentId: string,
        errorCode?: string
    ): Promise<{ error: any }> {
        try {
            const { error } = await supabase
                .from('payments')
                .update({
                    status: 'failed' as PaymentStatus,
                    transaction_id: errorCode || null,
                })
                .eq('id', paymentId);

            return { error };
        } catch (err) {
            console.error('failPayment exception:', err);
            return { error: err };
        }
    }

    /**
     * 5. getPaymentByBookingId()
     * Fetches the payment record for a specific booking.
     * Used to check if a booking has already been paid or is in progress.
     */
    async getPaymentByBookingId(
        bookingId: string
    ): Promise<{ data: Payment | null; error: any }> {
        try {
            const { data, error } = await supabase
                .from('payments')
                .select('*')
                .eq('booking_id', bookingId)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error) {
                return { data: null, error };
            }

            return { data: data as Payment | null, error: null };
        } catch (err) {
            console.error('getPaymentByBookingId exception:', err);
            return { data: null, error: err };
        }
    }

    /**
     * 6. getOwnerEarnings()
     * Fetches all successful payments for an owner's vehicles.
     * Used for the owner's earnings summary.
     */
    async getOwnerEarnings(
        ownerId: string
    ): Promise<{ data: (Payment & { bookings: any })[] | null; error: any }> {
        try {
            const { data, error } = await supabase
                .from('payments')
                .select(`
                    *,
                    bookings!inner (
                        id,
                        vehicle_id,
                        renter_id,
                        start_date,
                        end_date,
                        total_price,
                        vehicles!inner ( make, model, owner_id )
                    )
                `)
                .eq('status', 'success')
                .eq('bookings.vehicles.owner_id', ownerId)
                .order('created_at', { ascending: false });

            if (error) {
                return { data: null, error };
            }

            return { data: data as any, error: null };
        } catch (err) {
            console.error('getOwnerEarnings exception:', err);
            return { data: null, error: err };
        }
    }

    /**
     * 7. getTotalRevenue() — used by admin dashboard
     * Returns the sum of all successful payments.
     */
    async getTotalRevenue(): Promise<{ total: number; error: any }> {
        try {
            const { data, error } = await supabase
                .from('payments')
                .select('amount')
                .eq('status', 'success');

            if (error) return { total: 0, error };

            const total = (data || []).reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
            return { total, error: null };
        } catch (err) {
            return { total: 0, error: err };
        }
    }
}

export const paymentService = new PaymentService();
