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

// Automatically trigger B2C Payout to Platform (Pochi la Biashara)
async function triggerPlatformPayout(amount: number) {
  try {
    console.log(`Initiating automatic B2C payout of KES ${amount} to platform...`);
    
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    const initiatorName = process.env.MPESA_INITIATOR_NAME || 'api_user';
    const securityCredential = process.env.MPESA_SECURITY_CREDENTIAL || 'base64_cert_password';
    const businessShortCode = '4160861';
    const platformPhone = '254714441312'; // Pochi la Biashara format (0714441312)
    
    if (!consumerKey || !consumerSecret) {
      console.warn("Missing M-Pesa credentials. Skipping B2C payout.");
      return;
    }
    
    const token = await getMpesaToken(consumerKey, consumerSecret);
    
    const appUrl = process.env.APP_URL || 'https://aloefloraproducts.com';
    const b2cCallbackUrl = `${appUrl}/api/mpesa/b2c_result`;
    const b2cTimeoutUrl = `${appUrl}/api/mpesa/b2c_timeout`;
    
    const payload = {
      InitiatorName: initiatorName,
      SecurityCredential: securityCredential,
      CommandID: 'BusinessPayment',
      Amount: Math.round(amount),
      PartyA: businessShortCode,
      PartyB: platformPhone,
      Remarks: 'Platform Commission Split',
      QueueTimeOutURL: b2cTimeoutUrl,
      ResultURL: b2cCallbackUrl,
      Occasion: 'Commission Payout'
    };
    
    const response = await fetch('https://api.safaricom.co.ke/mpesa/b2c/v3/paymentrequest', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    const data: any = await response.json();
    console.log('B2C Payout Response:', data);
    
  } catch (err) {
    console.error('Failed to trigger B2C Payout:', err);
  }
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

      // Try fetching order by checkout_request_id
      let { data, error } = await supabase
        .from('orders')
        .select('id, total_amount')
        .eq('checkout_request_id', CheckoutRequestID);

      let orderToUpdate = null;
      if (data && data.length > 0) {
        orderToUpdate = data[0];
      }

      if (error) {
        console.error('Error fetching order by checkout_request_id:', error);
      }

      // If no order was matched (e.g. because checkout_request_id column was missing or not populated yet)
      // search for the latest pending order matching phone and total_amount
      if (!orderToUpdate) {
        console.log('No order matched checkout_request_id. Searching for matching phone fallback...');
        const formattedPhone = String(phone).replace('254', '0'); // standard phone format local conversion
        
        const { data: matchedOrders, error: matchErr } = await supabase
          .from('orders')
          .select('id, total_amount')
          .or(`phone.eq.${phone},phone.eq.${formattedPhone}`)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1);

        if (matchedOrders && matchedOrders.length > 0) {
          orderToUpdate = matchedOrders[0];
        }
      }

      if (orderToUpdate) {
        // Business Logic & Fraud Prevention Check: Validate paid amount matches order total!
        if (Number(orderToUpdate.total_amount) !== Number(amount)) {
          console.warn(`FRAUD ALERT: Paid amount ${amount} does not match order total ${orderToUpdate.total_amount}! Marking as failed/fraud.`);
          await supabase
            .from('orders')
            .update({
              payment_status: 'failed',
              status: 'failed',
              mpesa_receipt: mpesaReceipt,
              checkout_request_id: CheckoutRequestID
            })
            .eq('id', orderToUpdate.id);
            
          res.statusCode = 200;
          res.end(JSON.stringify({ ResultCode: 0, ResultDesc: 'Success (but flagged as fraud due to amount mismatch)' }));
          return;
        }

        console.log(`Matching order found and amount verified: ${orderToUpdate.id}. Updating...`);
        
        await supabase
          .from('orders')
          .update({
            payment_status: 'paid',
            status: 'paid',
            mpesa_receipt: mpesaReceipt,
            checkout_request_id: CheckoutRequestID
          })
          .eq('id', orderToUpdate.id);
      } else {
        console.warn('Could not find any matching pending orders for fallback phone.');
      }

      // Calculate and save commission split (70% Business / 30% Platform)
      if (amount && Number(amount) > 0) {
        const total = Number(amount);
        const business_amount = total * 0.70;
        const platform_amount = total * 0.30;
        
        console.log(`Calculating commission: Gross=${total}, Business=${business_amount}, Platform=${platform_amount}`);
        
        const { error: commErr } = await supabase
          .from('commissions')
          .insert({
            mpesa_receipt: mpesaReceipt || 'UNKNOWN',
            gross_amount: total,
            business_percentage: 70,
            platform_percentage: 30,
            business_amount: business_amount,
            platform_amount: platform_amount,
            status: 'pending'
          });
          
        if (commErr) {
          console.error('Error saving commission split:', commErr);
        } else {
          console.log('Successfully recorded 70/30 payment split to commissions ledger.');
          // Fire and forget the automatic payout
          triggerPlatformPayout(platform_amount).catch(console.error);
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
