import { supabase } from "./supabase";

/**
 * Kenyan MSISDN Formatter & Validator for Frontend
 */
export function formatKenyanPhoneInput(phone: string): { isValid: boolean; formatted: string; error?: string } {
  if (!phone) {
    return { isValid: false, formatted: '', error: 'Phone number is required' };
  }
  let cleaned = String(phone).trim().replace(/[\s\-\+\(\)]/g, '').replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  } else if (cleaned.length === 9 && (cleaned.startsWith('7') || cleaned.startsWith('1'))) {
    cleaned = '254' + cleaned;
  }

  const kenyanPhoneRegex = /^254(7\d{8}|1\d{8})$/;
  if (!kenyanPhoneRegex.test(cleaned)) {
    return { 
      isValid: false, 
      formatted: cleaned, 
      error: 'Please enter a valid Kenyan number (e.g. 0712345678 or 0112345678)' 
    };
  }

  return { isValid: true, formatted: cleaned };
}

export const PaymentService = {
  /**
   * Triggers Safaricom M-Pesa Live STK Push request to customer phone
   */
  initiateMpesaStkPush: async (phone: string, amount: number, orderId?: string, accountRef?: string) => {
    try {
      const response = await fetch('/api/mpesa/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, amount, orderId, accountRef })
      });
      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('M-Pesa STK Push Error:', error);
      return { success: false, error: error.message || 'Failed to connect to M-Pesa Gateway' };
    }
  },

  /**
   * Directly queries Daraja API for STK Push status if callback is delayed
   */
  queryMpesaStkStatus: async (checkoutRequestID: string) => {
    try {
      const response = await fetch('/api/mpesa/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkoutRequestID })
      });
      return await response.json();
    } catch (error: any) {
      console.error('M-Pesa STK Query Error:', error);
      return { success: false, error: error.message };
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
