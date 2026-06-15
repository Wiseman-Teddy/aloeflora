import { IncomingMessage, ServerResponse } from 'http';
import { createClient } from '@supabase/supabase-js';

async function getRequestBody(req: IncomingMessage): Promise<any> {
  if ((req as any).body) return (req as any).body;
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
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
  // Allow all origins for webhook support
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  try {
    const body = await getRequestBody(req);
    console.log('--- M-Pesa Callback Webhook Received ---');
    console.log(JSON.stringify(body, null, 2));

    const stkCallback = body?.Body?.stkCallback;
    if (!stkCallback) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Invalid Safaricom payload structure' }));
      return;
    }

    const { CheckoutRequestID, ResultCode, ResultDesc } = stkCallback;

    // Supabase credentials
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn('Supabase credentials missing, cannot update order status.');
      res.statusCode = 200; // Return 200 to Safaricom to acknowledge delivery
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ message: 'Callback received but database client is not configured' }));
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (ResultCode === 0) {
      // Payment Succeeded! Extract metadata details.
      const items = stkCallback.CallbackMetadata?.Item || [];
      const mpesaReceipt = items.find((item: any) => item.Name === 'MpesaReceiptNumber')?.Value;
      const amount = items.find((item: any) => item.Name === 'Amount')?.Value;
      const phone = items.find((item: any) => item.Name === 'PhoneNumber')?.Value;

      console.log(`STK Success! CheckoutRequestID: ${CheckoutRequestID}, Receipt: ${mpesaReceipt}, Amount: ${amount}`);

      // Try updating order by checkout_request_id
      let { data, error } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          status: 'paid', // fallback for table column name differences
          mpesa_receipt: mpesaReceipt
        })
        .eq('checkout_request_id', CheckoutRequestID)
        .select();

      if (error) {
        console.error('Error updating order by checkout_request_id:', error);
      }

      // If no order was matched (e.g. because checkout_request_id column was missing or not populated yet)
      // search for the latest pending order matching phone and total_amount
      if (!data || data.length === 0) {
        console.log('No order matched checkout_request_id. Searching for matching phone/amount fallback...');
        const formattedPhone = String(phone).replace('254', '0'); // standard phone format local conversion
        
        const { data: matchedOrders, error: matchErr } = await supabase
          .from('orders')
          .select('id')
          .or(`phone.eq.${phone},phone.eq.${formattedPhone}`)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1);

        if (matchedOrders && matchedOrders.length > 0) {
          const orderId = matchedOrders[0].id;
          console.log(`Matching fallback order found: ${orderId}. Updating...`);
          
          await supabase
            .from('orders')
            .update({
              payment_status: 'paid',
              status: 'paid',
              mpesa_receipt: mpesaReceipt,
              checkout_request_id: CheckoutRequestID
            })
            .eq('id', orderId);
        } else {
          console.warn('Could not find any matching pending orders for fallback phone/amount.');
        }
      }
    } else {
      // Payment Failed or Cancelled
      console.warn(`STK Failed/Cancelled! CheckoutRequestID: ${CheckoutRequestID}, ResultCode: ${ResultCode}, Desc: ${ResultDesc}`);
      
      await supabase
        .from('orders')
        .update({
          payment_status: 'failed',
          status: 'failed'
        })
        .eq('checkout_request_id', CheckoutRequestID);
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ResultCode: 0, ResultDesc: 'Success' }));
  } catch (error: any) {
    console.error('Callback parsing exception:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Internal server error', details: error.message }));
  }
}
