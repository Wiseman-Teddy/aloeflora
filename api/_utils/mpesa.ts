import { IncomingMessage } from 'http';

/**
 * Safaricom Daraja API Helpers & Validators for Production & Sandbox
 */

/**
 * Resolves the Daraja Base URL based on environment setting
 */
export function getDarajaBaseUrl(): string {
  const env = (process.env.MPESA_ENV || 'production').trim().toLowerCase();
  return env === 'sandbox' 
    ? 'https://sandbox.safaricom.co.ke' 
    : 'https://api.safaricom.co.ke';
}

/**
 * Validates and formats any Kenyan phone number to the standard 12-digit MSISDN (254XXXXXXXXX).
 * Supported inputs:
 *  - 07XXXXXXXX, 01XXXXXXXX
 *  - +2547XXXXXXXX, +2541XXXXXXXX
 *  - 2547XXXXXXXX, 2541XXXXXXXX
 *  - 7XXXXXXXX, 1XXXXXXXX
 * Throws an Error with a user-friendly message if invalid.
 */
export function validateAndFormatKenyanPhone(input: string | number | undefined | null): string {
  if (!input) {
    throw new Error('Phone number is required');
  }

  // Strip all whitespace, dashes, plus signs, brackets
  let cleaned = String(input).trim().replace(/[\s\-\+\(\)]/g, '').replace(/[^0-9]/g, '');

  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  } else if (cleaned.length === 9 && (cleaned.startsWith('7') || cleaned.startsWith('1'))) {
    cleaned = '254' + cleaned;
  }

  // A valid Kenyan MSISDN must be exactly 12 digits long and start with 2547 or 2541
  const kenyanPhoneRegex = /^254(7\d{8}|1\d{8})$/;

  if (!kenyanPhoneRegex.test(cleaned)) {
    throw new Error('Please provide a valid 10-digit Kenyan mobile number (e.g. 0712345678 or 0112345678)');
  }

  return cleaned;
}

/**
 * Validates the transaction amount according to Central Bank of Kenya / Safaricom limits
 */
export function validateAmount(amount: any): number {
  const parsed = Number(amount);
  if (isNaN(parsed) || !isFinite(parsed) || parsed < 1) {
    throw new Error('Payment amount must be at least KES 1');
  }
  if (parsed > 300000) {
    throw new Error('Maximum transaction limit is KES 300,000 per Daraja transaction');
  }
  return Math.round(parsed);
}

/**
 * Safaricom Daraja AccountReference must be max 12 alphanumeric characters (no spaces or symbols)
 */
export function sanitizeAccountReference(rawRef: string | undefined | null): string {
  if (!rawRef) return 'AFORDER';
  const alphanumeric = String(rawRef).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return (alphanumeric || 'AFORDER').slice(0, 12);
}

/**
 * Safaricom Daraja TransactionDesc must be max 13 characters (no special characters)
 */
export function sanitizeTransactionDesc(rawDesc: string | undefined | null): string {
  if (!rawDesc) return 'Order Payment';
  const alphanumeric = String(rawDesc).replace(/[^a-zA-Z0-9 ]/g, '').trim();
  return (alphanumeric || 'Order Payment').slice(0, 13);
}

/**
 * Generate M-Pesa OAuth Access Token from Safaricom Daraja
 */
export async function getMpesaOAuthToken(consumerKey: string, consumerSecret: string): Promise<string> {
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
  const baseUrl = getDarajaBaseUrl();

  const response = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: {
      Authorization: `Basic ${auth}`
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Daraja OAuth Error (${response.status}): ${errorText}`);
  }

  const data: any = await response.json();
  if (!data.access_token) {
    throw new Error(`Invalid OAuth response: ${JSON.stringify(data)}`);
  }

  return data.access_token;
}

/**
 * Map Daraja numeric result codes to customer-friendly feedback
 */
export function translateDarajaResultCode(code: string | number, defaultDesc?: string): string {
  const num = Number(code);
  switch (num) {
    case 0:
      return 'Payment successful and confirmed.';
    case 1:
      return 'Insufficient M-Pesa balance to complete payment.';
    case 1032:
      return 'Payment cancelled by user.';
    case 1037:
      return 'Payment request timed out (no response from handset). Please try again.';
    case 2001:
      return 'Invalid M-Pesa PIN entered.';
    case 1001:
      return 'A transaction is already in progress on your phone. Please try again in a moment.';
    case 1019:
      return 'Transaction expired. Please try again.';
    case 1025:
      return 'An error occurred while sending the push prompt to your phone.';
    default:
      return defaultDesc || 'Payment was not completed. Please try again.';
  }
}
