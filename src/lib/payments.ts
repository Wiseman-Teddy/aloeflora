// Stub for Payment processing (Stripe / M-Pesa)

export const PaymentService = {
  /**
   * Initializes a payment intent via Stripe or M-Pesa Daraja API
   */
  createPaymentIntent: async (amount: number, currency: string = 'KES') => {
    console.log(`[Payment Stub] Creating intent for ${amount} ${currency}`);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      clientSecret: `stub_secret_${Math.random()}`,
      status: 'requires_payment_method'
    };
  },

  /**
   * Verifies the payment transaction status
   */
  verifyPayment: async (transactionId: string) => {
    console.log(`[Payment Stub] Verifying transaction ${transactionId}`);
    return {
      success: true,
      status: 'succeeded'
    };
  }
};
