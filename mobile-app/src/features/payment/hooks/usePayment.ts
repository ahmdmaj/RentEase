import { useState, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { paymentService } from '../services/payment.service';
import { Payment, RazorpayWebViewMessage } from '../types/payment';

interface UsePaymentOptions {
    bookingId: string;
    amount: number;
    vehicleName: string;
    onSuccess: (payment: Payment) => void;
    onFailure?: (error: string) => void;
    onCancel?: () => void;
}

type PaymentFlowState =
    | 'idle'          // Initial state — shows booking summary
    | 'creating_order' // Calling Edge Function to create Razorpay order
    | 'checkout'       // WebView is open, user is in Razorpay checkout
    | 'processing'     // WebView responded, confirming in DB
    | 'success'        // Payment confirmed
    | 'failed'         // Payment failed
    | 'cancelled';     // User dismissed checkout

/**
 * ============================================================
 * USE PAYMENT HOOK
 * Orchestrates the full payment flow:
 * 1. Create Razorpay order (Edge Function)
 * 2. Create pending payment record in DB
 * 3. Open Razorpay WebView checkout
 * 4. Handle success/failure/cancel from WebView postMessage
 * 5. Update payment record in DB → triggers booking confirmation
 * ============================================================
 */
export const usePayment = ({
    bookingId,
    amount,
    vehicleName,
    onSuccess,
    onFailure,
    onCancel,
}: UsePaymentOptions) => {
    const [flowState, setFlowState] = useState<PaymentFlowState>('idle');
    const [error, setError] = useState<string | null>(null);
    const [razorpayHtml, setRazorpayHtml] = useState<string | null>(null);

    // We keep the payment record ID in a ref so the WebView message handler
    // can access it without needing it in its dependency array.
    const currentPaymentIdRef = useRef<string | null>(null);

    /**
     * Step 1 + 2: Create Razorpay order (server-side) and pending payment record.
     * Called when user presses "Pay Now".
     */
    const initiatePayment = useCallback(async (userEmail: string, userName: string) => {
        setError(null);
        setFlowState('creating_order');

        // Step 1: Create Razorpay order via Edge Function
        const { data: orderData, error: orderError } = await paymentService.createRazorpayOrder(
            bookingId,
            amount
        );

        if (orderError || !orderData) {
            const msg = orderError?.message || 'Failed to create payment order. Please try again.';
            setError(msg);
            setFlowState('failed');
            onFailure?.(msg);
            return;
        }

        // Step 2: Create a pending payment record in Supabase BEFORE opening checkout.
        // This ensures we have an audit trail even if the user closes the app.
        const { data: paymentRecord, error: recordError } = await paymentService.createPaymentRecord({
            bookingId,
            amount,
            razorpayOrderId: orderData.orderId,
        });

        if (recordError || !paymentRecord) {
            const msg = 'Failed to initialize payment record. Please try again.';
            setError(msg);
            setFlowState('failed');
            onFailure?.(msg);
            return;
        }

        currentPaymentIdRef.current = paymentRecord.id;

        // Step 3: Generate Razorpay checkout HTML and show WebView
        const html = generateRazorpayHTML({
            keyId: orderData.keyId,
            orderId: orderData.orderId,
            amount: orderData.amount,         // already in paise
            currency: orderData.currency,
            vehicleName,
            userName,
            userEmail,
        });

        setRazorpayHtml(html);
        setFlowState('checkout');
    }, [bookingId, amount, vehicleName, onFailure]);

    /**
     * Handles postMessage events from the Razorpay WebView.
     * Called by the PaymentScreen's WebView onMessage handler.
     */
    const handleWebViewMessage = useCallback(async (rawMessage: string) => {
        let parsed: RazorpayWebViewMessage;
        try {
            parsed = JSON.parse(rawMessage);
        } catch {
            console.warn('PaymentHook: Failed to parse WebView message:', rawMessage);
            return;
        }

        const paymentId = currentPaymentIdRef.current;

        if (parsed.type === 'PAYMENT_SUCCESS') {
            setFlowState('processing');

            if (!paymentId) {
                const msg = 'Payment reference lost. Contact support.';
                setError(msg);
                setFlowState('failed');
                onFailure?.(msg);
                return;
            }

            const { data: confirmedPayment, error: confirmError } =
                await paymentService.confirmPayment(
                    paymentId,
                    parsed.razorpay_payment_id,
                    parsed.razorpay_order_id,
                    parsed.razorpay_signature
                );

            if (confirmError || !confirmedPayment) {
                // Payment went through Razorpay but DB update failed.
                // This is a critical edge case — show specific message.
                const msg =
                    'Payment was received but confirmation failed. Please contact support with your payment ID: ' +
                    parsed.razorpay_payment_id;
                setError(msg);
                setFlowState('failed');
                Alert.alert('Payment Received', msg);
                onFailure?.(msg);
                return;
            }

            setFlowState('success');
            onSuccess(confirmedPayment);

        } else if (parsed.type === 'PAYMENT_FAILED') {
            if (paymentId) {
                await paymentService.failPayment(paymentId, parsed.error?.code);
            }
            const msg = parsed.error?.description || 'Payment failed. Please try again.';
            setError(msg);
            setFlowState('failed');
            onFailure?.(msg);

        } else if (parsed.type === 'PAYMENT_CANCELLED') {
            // Don't mark payment as failed on cancel — user may retry.
            setFlowState('cancelled');
            setRazorpayHtml(null);
            onCancel?.();
        }
    }, [onSuccess, onFailure, onCancel]);

    /** Reset hook state so user can retry */
    const reset = useCallback(() => {
        setFlowState('idle');
        setError(null);
        setRazorpayHtml(null);
        currentPaymentIdRef.current = null;
    }, []);

    return {
        flowState,
        error,
        razorpayHtml,
        initiatePayment,
        handleWebViewMessage,
        reset,
        isLoading: flowState === 'creating_order' || flowState === 'processing',
        isCheckoutOpen: flowState === 'checkout',
    };
};

/**
 * ============================================================
 * RAZORPAY HTML GENERATOR
 * Generates an inline HTML string for the WebView.
 * The checkout.js script opens Razorpay's checkout UI inline
 * (not as a browser popup — works natively in React Native WebView).
 * Results are posted back via window.ReactNativeWebView.postMessage().
 * ============================================================
 */
function generateRazorpayHTML(options: {
    keyId: string;
    orderId: string;
    amount: number;    // in paise
    currency: string;
    vehicleName: string;
    userName: string;
    userEmail: string;
}): string {
    const safeVehicleName = options.vehicleName.replace(/"/g, '&quot;');
    const safeUserName = options.userName.replace(/"/g, '&quot;');
    const safeUserEmail = options.userEmail.replace(/"/g, '&quot;');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>RentEase Payment</title>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      flex-direction: column;
      gap: 16px;
      padding: 24px;
    }
    .loader {
      width: 48px; height: 48px;
      border: 4px solid #dbeafe;
      border-top-color: #2563eb;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    p { color: #64748b; font-size: 15px; text-align: center; }
  </style>
</head>
<body>
  <div class="loader"></div>
  <p>Opening payment gateway…</p>
  <script>
    (function () {
      var options = {
        key: "${options.keyId}",
        amount: ${options.amount},
        currency: "${options.currency}",
        name: "RentEase",
        description: "Vehicle Rental: ${safeVehicleName}",
        order_id: "${options.orderId}",
        prefill: {
          name: "${safeUserName}",
          email: "${safeUserEmail}"
        },
        theme: { color: "#2563eb" },
        handler: function (response) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: "PAYMENT_SUCCESS",
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature
          }));
        },
        modal: {
          ondismiss: function () {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: "PAYMENT_CANCELLED"
            }));
          }
        }
      };

      var rzp = new Razorpay(options);

      rzp.on("payment.failed", function (response) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: "PAYMENT_FAILED",
          error: response.error
        }));
      });

      rzp.open();
    })();
  </script>
</body>
</html>`;
}
