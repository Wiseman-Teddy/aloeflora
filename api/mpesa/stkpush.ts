import { IncomingMessage, ServerResponse } from 'http';
import { applyCors, checkRateLimit, maskPhoneNumber } from '../_utils/security.js';
import { 
  getDarajaBaseUrl, 
  validateAndFormatKenyanPhone, 
  validateAmount, 
  sanitizeAccountReference, 
  sanitizeTransactionDesc, 
  getMpesaOAuthToken,
  translateDarajaResultCode
} from '../_utils/mpesa.js';

async function getRequestBody(req: IncomingMessage): Promise<any> {
  if ((req as any).body) return (req as any).body;
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 100000) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
  });
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // Apply Strict CORS & HSTS HTTPS Headers (Checklist #3)
  if (applyCors(req, res)) return;

  // Apply Strict Rate Limiting (max 6 requests per minute per IP to prevent spamming/DoS)
  if (checkRateLimit(req, res, 6, 60000)) return;

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  try {
    const body = await getRequestBody(req);
    const { phone, amount, transactionType, orderId, accountRef } = body;

    // Strict Validation: Phone Number (Kenyan standard MSISDN)
    let formattedPhone: string;
    try {
      formattedPhone = validateAndFormatKenyanPhone(phone);
    } catch (valErr: any) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: valErr.message }));
      return;
    }

    // Strict Validation: Amount (KES 1 to KES 300,000)
    let validAmount: number;
    try {
      validAmount = validateAmount(amount);
    } catch (amtErr: any) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: amtErr.message }));
      return;
    }

    // 1. Strictly load secrets from environment variables (Checklist #1)
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    const businessShortCode = process.env.MPESA_SHORTCODE || '4160861';
    const passkey = process.env.MPESA_PASSKEY;

    if (!consumerKey || !consumerSecret || !businessShortCode || !passkey) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'M-Pesa credentials not configured in server environment' }));
      return;
    }

    // 4. Log masked phone numbers in public logs (Checklist #4)
    console.log(`[STK Push] Initiating push for Phone: ${maskPhoneNumber(formattedPhone)}, Amount: KES ${validAmount}, Order: ${orderId || 'N/A'}`);

    const token = await getMpesaOAuthToken(consumerKey, consumerSecret);
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password = Buffer.from(`${businessShortCode}${passkey}${timestamp}`).toString('base64');

    const appUrl = (process.env.APP_URL || 'https://aloefloraproducts.com').replace(/\/$/, '');
    const callbackUrl = `${appUrl}/api/mpesa/callback`;

    const txType = transactionType || 'CustomerPayBillOnline';
    const formattedAccountRef = sanitizeAccountReference(accountRef || orderId);
    const formattedDesc = sanitizeTransactionDesc(`Order ${formattedAccountRef}`);

    const payload = {
      BusinessShortCode: businessShortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: txType,
      Amount: validAmount,
      PartyA: formattedPhone,
      PartyB: businessShortCode,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: formattedAccountRef,
      TransactionDesc: formattedDesc
    };

    const baseUrl = getDarajaBaseUrl();
    const response = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data: any = await response.json();
    res.setHeader('Content-Type', 'application/json');

    if (data.ResponseCode === '0') {
      res.statusCode = 200;
      res.end(JSON.stringify({
        success: true,
        message: 'STK push sent successfully. Please check your phone.',
        checkoutRequestID: data.CheckoutRequestID,
        merchantRequestID: data.MerchantRequestID,
        customerMessage: data.CustomerMessage || 'Success. Request accepted for processing'
      }));
    } else {
      const friendlyError = translateDarajaResultCode(data.ResponseCode || data.errorCode, data.errorMessage || data.CustomerMessage);
      res.statusCode = 400;
      res.end(JSON.stringify({
        success: false,
        error: friendlyError,
        details: data
      }));
    }
  } catch (error: any) {
    console.error('[STK Push Error]:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ 
      error: 'Internal server error processing payment request', 
      message: error.message 
    }));
  }
}
