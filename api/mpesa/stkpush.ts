import { IncomingMessage, ServerResponse } from 'http';
import { applyCors, checkRateLimit } from '../utils/security';

// Helper to read body if Vercel doesn't parse it (though Vercel does parse it for POST requests)
async function getRequestBody(req: IncomingMessage): Promise<any> {
  if ((req as any).body) return (req as any).body;
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      // Payload size validation (limit 100KB)
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

// Generate M-Pesa Token
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
  // Apply Strict CORS
  if (applyCors(req, res)) return;

  // Apply Strict Rate Limiting (max 5 requests per minute for STK Push)
  if (checkRateLimit(req, res, 5, 60000)) return;

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  try {
    const body = await getRequestBody(req);
    const { phone, amount } = body;

    if (!phone || !amount) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Phone and amount are required' }));
      return;
    }

    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    const businessShortCode = process.env.MPESA_SHORTCODE || '4160861';
    const passkey = process.env.MPESA_PASSKEY || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';

    if (!consumerKey || !consumerSecret) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'M-Pesa credentials not configured on server' }));
      return;
    }

    // Format phone number to 254...
    let formattedPhone = phone.replace(/\s+/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith('+')) {
      formattedPhone = formattedPhone.substring(1);
    }

    const token = await getMpesaToken(consumerKey, consumerSecret);
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password = Buffer.from(`${businessShortCode}${passkey}${timestamp}`).toString('base64');

    const appUrl = process.env.APP_URL || 'https://aloefloraproducts.com';
    const callbackUrl = `${appUrl}/api/mpesa/callback`;

    const payload = {
      BusinessShortCode: businessShortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: formattedPhone,
      PartyB: businessShortCode,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: 'Aloeflora Order',
      TransactionDesc: 'Payment for order'
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
