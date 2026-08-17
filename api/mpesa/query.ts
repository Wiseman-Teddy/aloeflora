import { IncomingMessage, ServerResponse } from 'http';
import { createClient } from '@supabase/supabase-js';
import { applyCors, checkRateLimit } from '../_utils/security.js';
import { getDarajaBaseUrl, getMpesaOAuthToken, translateDarajaResultCode } from '../_utils/mpesa.js';

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

/**
 * Decrement product stock if query marks order as paid
 */
async function decrementProductStock(supabase: any, orderItems: any[]) {
  if (!Array.isArray(orderItems) || orderItems.length === 0) return;

  for (const item of orderItems) {
    const productId = item.productId || item.product_id || item.id;
    const quantity = Number(item.quantity) || 1;
    if (!productId) continue;

    try {
      const { data: prod } = await supabase
        .from('products')
        .select('id, stock')
        .eq('id', productId)
        .maybeSingle();

      if (prod && typeof prod.stock === 'number') {
        const newStock = Math.max(0, prod.stock - quantity);
        await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', productId);
      }
    } catch (err) {
      console.error(`[Inventory Error] Stock decrement failed for ${productId}:`, err);
    }
  }
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // Apply Strict CORS & HSTS HTTPS Headers
  if (applyCors(req, res)) return;

  // Rate Limiting (max 15 queries per minute per IP)
  if (checkRateLimit(req, res, 15, 60000)) return;

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  try {
    const body = await getRequestBody(req);
    const { checkoutRequestID } = body;

    if (!checkoutRequestID) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'checkoutRequestID is required' }));
      return;
    }

    // Load secrets from environment variables
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

    const token = await getMpesaOAuthToken(consumerKey, consumerSecret);
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password = Buffer.from(`${businessShortCode}${passkey}${timestamp}`).toString('base64');
    const baseUrl = getDarajaBaseUrl();

    const response = await fetch(`${baseUrl}/mpesa/stkpushquery/v1/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        BusinessShortCode: businessShortCode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestID
      })
    });

    const data: any = await response.json();
    res.setHeader('Content-Type', 'application/json');

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (data.ResultCode === '0' || data.ResultCode === 0) {
      // Payment confirmed via Daraja Query
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        const { data: matchedOrder } = await supabase
          .from('orders')
          .select('*')
          .eq('checkout_request_id', checkoutRequestID)
          .maybeSingle();

        if (matchedOrder && matchedOrder.payment_status !== 'paid') {
          await supabase
            .from('orders')
            .update({
              payment_status: 'paid',
              status: 'paid',
              updated_at: new Date().toISOString()
            })
            .eq('id', matchedOrder.id);

          await decrementProductStock(supabase, matchedOrder.items);
        }
      }

      res.statusCode = 200;
      res.end(JSON.stringify({ 
        success: true, 
        status: 'paid', 
        message: 'Payment confirmed successfully by M-Pesa.',
        details: data 
      }));
    } else {
      const friendlyMessage = translateDarajaResultCode(data.ResultCode || data.errorCode, data.ResultDesc || data.errorMessage);
      res.statusCode = 200;
      res.end(JSON.stringify({ 
        success: false, 
        status: 'pending_or_failed', 
        message: friendlyMessage,
        details: data 
      }));
    }
  } catch (error: any) {
    console.error('[Query STK Status Error]:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Failed to query STK status from M-Pesa Gateway', details: error.message }));
  }
}
