import { supabase } from "./supabase";

export const PaymentService = {
  /**
   * Triggers Safaricom M-Pesa Live STK Push request to customer phone
   */
  initiateMpesaStkPush: async (phone: string, amount: number) => {
    try {
      const response = await fetch('/api/mpesa/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, amount })
      });
      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('M-Pesa STK Push Error:', error);
      return { success: false, error: error.message || 'Failed to connect to M-Pesa Gateway' };
    }
  },

  /**
   * Verifies payment status of an order in Supabase
   */
  verifyPaymentStatus: async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('payment_status, status, mpesa_receipt')
        .eq('id', orderId)
        .maybeSingle();

      if (error) throw error;
      if (data && (data.payment_status === 'paid' || data.status === 'paid')) {
        return { success: true, status: 'paid', receipt: data.mpesa_receipt };
      }
      return { success: false, status: data?.payment_status || 'pending' };
    } catch (error: any) {
      console.error('Verify Payment Error:', error);
      return { success: false, error: error.message };
    }
  }
};

