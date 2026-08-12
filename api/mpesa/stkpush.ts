import { IncomingMessage, ServerResponse } from 'http';
import { applyCors, checkRateLimit, maskPhoneNumber } from '../_utils/security.js';

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

// Generate M-Pesa OAuth Token
async function getMpesaToken(consumerKey: string, consumerSecret: string) {
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
  try {
    const response = await fetch('https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      headers: {
        Authorization: `Basic ${auth}`
      }
    });
    const data: any = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error generating M-Pesa token:', error);
    throw error;
  }
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // Apply Strict CORS & HSTS HTTPS Headers (Checklist #3)
  if (applyCors(req, res)) return;

  // Apply Strict Rate Limiting (max 5 requests per minute per IP)
  if (checkRateLimit(req, res, 5, 60000)) return;

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  try {
    const body = await getRequestBody(req);
    const { phone, amount, transactionType, orderId, accountRef } = body;

    if (!phone || !amount) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Phone and amount are required' }));
      return;
    }

    // 1. Strictly load secrets from environment variables (Checklist #1)
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    const businessShortCode = process.env.MPESA_SHORTCODE;
    const passkey = process.env.MPESA_PASSKEY;

    if (!consumerKey || !consumerSecret || !businessShortCode || !passkey) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'M-Pesa credentials not configured in environment variables' }));
      return;
    }

    // Format phone number to 254... (supports 07..., 01..., +254..., 7..., 1...)
    let formattedPhone = String(phone).replace(/\s+/g, '').replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1);
    } else if (formattedPhone.length === 9 && (formattedPhone.startsWith('7') || formattedPhone.startsWith('1'))) {
      formattedPhone = '254' + formattedPhone;
    }

    // 4. Log masked phone numbers in public logs (Checklist #4)
    console.log(`Initiating STK Push for Phone: ${maskPhoneNumber(formattedPhone)}, Amount: KES ${amount}`);

    const token = await getMpesaToken(consumerKey, consumerSecret);
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password = Buffer.from(`${businessShortCode}${passkey}${timestamp}`).toString('base64');

    const appUrl = process.env.APP_URL || 'https://aloefloraproducts.com';
    const callbackUrl = `${appUrl}/api/mpesa/callback`;

    const txType = transactionType || 'CustomerPayBillOnline';
    const rawRef = String(accountRef || orderId || 'Aloeflora').replace(/[^a-zA-Z0-9]/g, '');
    const formattedAccountRef = (rawRef || 'AFORDER').slice(0, 12).toUpperCase();

    const payload = {
      BusinessShortCode: businessShortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: txType,
      Amount: Math.round(amount),
      PartyA: formattedPhone,
      PartyB: businessShortCode,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: formattedAccountRef,
      TransactionDesc: `Order ${formattedAccountRef}`
    };

    const response = await fetch('https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
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
        message: 'STK push sent successfully',
        checkoutRequestID: data.CheckoutRequestID
      }));
    } else {
      res.statusCode = 400;
      res.end(JSON.stringify({
        success: false,
        error: data.errorMessage || 'Failed to send STK push',
        details: data
      }));
    }
  } catch (error: any) {
    console.error('STK Push Error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Internal server error', details: error.message }));
  }
}
