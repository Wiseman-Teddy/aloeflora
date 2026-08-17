import { IncomingMessage, ServerResponse } from 'http';
import { createClient } from '@supabase/supabase-js';
import { applyCors, maskPhoneNumber, verifyWebhookSignature } from '../_utils/security.js';

async function getRawRequestBody(req: IncomingMessage): Promise<{ raw: string; json: any }> {
  if ((req as any).body) {
    const raw = typeof (req as any).body === 'string' ? (req as any).body : JSON.stringify((req as any).body);
    const json = typeof (req as any).body === 'string' ? JSON.parse((req as any).body) : (req as any).body;
    return { raw, json };
  }
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve({ raw: body, json: body ? JSON.parse(body) : {} });
      } catch (e) {
        reject(e);
      }
    });
  });
}

/**
 * Decrement product stock when order payment succeeds
 */
async function decrementProductStock(supabase: any, orderItems: any[]) {
  if (!Array.isArray(orderItems) || orderItems.length === 0) return;

  for (const item of orderItems) {
    const productId = item.productId || item.product_id || item.id;
    const quantity = Number(item.quantity) || 1;

    if (!productId) continue;

    try {
      const { data: prod, error: prodErr } = await supabase
        .from('products')
        .select('id, stock')
        .eq('id', productId)
        .maybeSingle();

      if (!prodErr && prod && typeof prod.stock === 'number') {
        const newStock = Math.max(0, prod.stock - quantity);
        await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', productId);
        console.log(`[Inventory] Decremented stock for ${productId} from ${prod.stock} to ${newStock} (-${quantity})`);
      }
    } catch (err) {
      console.error(`[Inventory Error] Failed to update stock for product ${productId}:`, err);
    }
  }
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // Apply CORS & HTTPS Security Headers
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  try {
    const { raw: rawBody, json: body } = await getRawRequestBody(req);

    // Verify Webhook HMAC Signature if signature header is provided
    const signatureHeader = req.headers['x-safaricom-signature'] || req.headers['x-signature'] || req.headers['x-sellio-signature'];
    const webhookSecret = process.env.SELLIO_WEBHOOK_SECRET || process.env.MPESA_CONSUMER_SECRET;
    
    if (signatureHeader && !verifyWebhookSignature(rawBody, signatureHeader, webhookSecret)) {
      console.warn('[SECURITY ALERT] Invalid webhook HMAC signature received! Rejecting callback.');
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Unauthorized: Webhook signature verification failed' }));
      return;
    }

    const stkCallback = body?.Body?.stkCallback;
    if (!stkCallback) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ResultCode: 1, ResultDesc: 'Invalid Safaricom payload structure' }));
      return;
    }

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;
    console.log(`[Daraja Callback] CheckoutRequestID: ${CheckoutRequestID}, ResultCode: ${ResultCode} (${ResultDesc})`);

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn('[Database Warning] Supabase service credentials missing in environment variables.');
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ResultCode: 0, ResultDesc: 'Callback received without DB connection' }));
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (ResultCode === 0 && CallbackMetadata?.Item) {
      const items = CallbackMetadata.Item || [];
      const mpesaReceipt = String(items.find((item: any) => item.Name === 'MpesaReceiptNumber')?.Value || '');
      const amount = Number(items.find((item: any) => item.Name === 'Amount')?.Value || 0);
      const phone = String(items.find((item: any) => item.Name === 'PhoneNumber')?.Value || '');

      console.log(`[Daraja Success] CheckoutID: ${CheckoutRequestID}, Receipt: ${mpesaReceipt}, Amount: KES ${amount}, Phone: ${maskPhoneNumber(phone)}`);

      // 1. Fetch order by checkout_request_id
      let { data: matchedOrders } = await supabase
        .from('orders')
        .select('*')
        .eq('checkout_request_id', CheckoutRequestID);

      let orderToUpdate = matchedOrders && matchedOrders.length > 0 ? matchedOrders[0] : null;

      // Fallback lookup by customer phone if checkout_request_id wasn't saved yet
      if (!orderToUpdate && phone) {
        const localPhone = phone.startsWith('254') ? '0' + phone.slice(3) : phone;
        const intlPhone = phone.startsWith('0') ? '254' + phone.slice(1) : phone;

        const { data: fallbackOrders } = await supabase
          .from('orders')
          .select('*')
          .or(`phone.eq.${intlPhone},phone.eq.${localPhone}`)
          .eq('payment_status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1);

        if (fallbackOrders && fallbackOrders.length > 0) {
          orderToUpdate = fallbackOrders[0];
        }
      }

      if (orderToUpdate) {
        // IDEMPOTENCY GUARD: Check if order is already processed as paid
        if (orderToUpdate.payment_status === 'paid' && orderToUpdate.mpesa_receipt === mpesaReceipt) {
          console.log(`[Idempotency] Order ${orderToUpdate.id} was already marked paid with receipt ${mpesaReceipt}. Acknowledging.`);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ResultCode: 0, ResultDesc: 'Already processed' }));
          return;
        }

        // Fraud Prevention: Validate paid amount equals order total
        if (Number(orderToUpdate.total_amount) !== Number(amount)) {
          console.warn(`[FRAUD ALERT] Paid amount KES ${amount} != Order total KES ${orderToUpdate.total_amount} for Order ${orderToUpdate.id}`);
          await supabase
            .from('orders')
            .update({
              payment_status: 'failed',
              status: 'failed',
              mpesa_receipt: mpesaReceipt,
              checkout_request_id: CheckoutRequestID,
              delivery_notes: `${orderToUpdate.delivery_notes || ''} [FLAGGED: Underpaid/Mismatched amount KES ${amount}]`
            })
            .eq('id', orderToUpdate.id);
            
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ResultCode: 0, ResultDesc: 'Flagged for amount verification' }));
          return;
        }

        // Update Order to Paid
        const { error: updateErr } = await supabase
          .from('orders')
          .update({
            payment_status: 'paid',
            status: 'paid',
            mpesa_receipt: mpesaReceipt,
            checkout_request_id: CheckoutRequestID,
            updated_at: new Date().toISOString()
          })
          .eq('id', orderToUpdate.id);

        if (updateErr) {
          console.error(`[DB Error] Failed to update order ${orderToUpdate.id}:`, updateErr);
        } else {
          console.log(`[Order Paid] Order ${orderToUpdate.id} marked as PAID. Updating stock...`);
          // Decrement Inventory Stock
          await decrementProductStock(supabase, orderToUpdate.items);
        }
      }

      // Update Event Registrations if any matched
      if (phone) {
        const localPhone = phone.startsWith('254') ? '0' + phone.slice(3) : phone;
        await supabase
          .from('event_registrations')
          .update({
            payment_status: 'paid',
            mpesa_receipt: mpesaReceipt,
            amount_paid: amount
          })
          .or(`phone.eq.${phone},phone.eq.${localPhone}`)
          .eq('payment_status', 'pending');
      }
    } else {
      // Payment Failed, Cancelled, or Timed out
      console.warn(`[Payment Failed/Cancelled] CheckoutRequestID: ${CheckoutRequestID}, Reason: ${ResultDesc}`);
      
      await supabase
        .from('orders')
        .update({
          payment_status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('checkout_request_id', CheckoutRequestID)
        .eq('payment_status', 'pending');
    }

    // Safaricom Daraja requires a 200 OK JSON response
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ResultCode: 0, ResultDesc: 'Callback processed successfully' }));
  } catch (error: any) {
    console.error('[Callback Exception]:', error);
    res.statusCode = 200; // Always respond 200 to Safaricom to prevent infinite callback re-delivery loops
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ResultCode: 0, ResultDesc: 'Callback received with internal note' }));
  }
}
