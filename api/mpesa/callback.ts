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

// Automatically trigger B2C Payout to Platform (Pochi la Biashara)
async function triggerPlatformPayout(amount: number) {
  try {
    // 1. Strictly load secrets from environment variables (Checklist #1)
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    const initiatorName = process.env.MPESA_INITIATOR_NAME || 'api_user';
    const securityCredential = process.env.MPESA_SECURITY_CREDENTIAL;
    const businessShortCode = process.env.MPESA_SHORTCODE || '4160861';
    const platformPhone = process.env.PLATFORM_POCHI_PHONE || '254714441312';
    
    if (!consumerKey || !consumerSecret || !securityCredential) {
      console.warn("Missing M-Pesa B2C credentials in environment variables. Skipping payout.");
      return;
    }
    
    // 4. Mask phone numbers in logs (Checklist #4)
    console.log(`Initiating automatic B2C payout of KES ${amount} to platform recipient ${maskPhoneNumber(platformPhone)}...`);
    
    const token = await getMpesaToken(consumerKey, consumerSecret);
    const appUrl = process.env.APP_URL || 'https://aloefloraproducts.com';
    
    const payload = {
      InitiatorName: initiatorName,
      SecurityCredential: securityCredential,
      CommandID: 'BusinessPayment',
      Amount: Math.round(amount),
      PartyA: businessShortCode,
      PartyB: platformPhone,
      Remarks: 'Platform Commission Split',
      QueueTimeOutURL: `${appUrl}/api/mpesa/b2c_timeout`,
      ResultURL: `${appUrl}/api/mpesa/b2c_result`,
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
  // Apply CORS & HTTPS Security Headers (Checklist #3)
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  try {
    const { raw: rawBody, json: body } = await getRawRequestBody(req);

    // 2. Verify Webhook HMAC Signature if present (Checklist #2)
    const signatureHeader = req.headers['x-safaricom-signature'] || req.headers['x-signature'] || req.headers['x-sellio-signature'];
    const webhookSecret = process.env.SELLIO_WEBHOOK_SECRET || process.env.MPESA_CONSUMER_SECRET;
    
    if (signatureHeader && !verifyWebhookSignature(rawBody, signatureHeader, webhookSecret)) {
      console.warn('SECURITY ALERT: Invalid webhook HMAC signature received! Rejecting callback request.');
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Unauthorized: Webhook signature verification failed' }));
      return;
    }

    console.log('--- Validated Payment Callback Webhook Received ---');

    const stkCallback = body?.Body?.stkCallback;
    if (!stkCallback) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Invalid Safaricom payload structure' }));
      return;
    }

    const { CheckoutRequestID, ResultCode, ResultDesc } = stkCallback;

    // 1. Strictly load credentials from environment variables (Checklist #1)
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn('Supabase service credentials missing in environment variables.');
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ message: 'Callback received but database credentials missing' }));
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (ResultCode === 0) {
      const items = stkCallback.CallbackMetadata?.Item || [];
      const mpesaReceipt = items.find((item: any) => item.Name === 'MpesaReceiptNumber')?.Value;
      const amount = items.find((item: any) => item.Name === 'Amount')?.Value;
      const phone = items.find((item: any) => item.Name === 'PhoneNumber')?.Value;

      // 4. Log masked phone numbers (Checklist #4)
      console.log(`STK Success! CheckoutID: ${CheckoutRequestID}, Receipt: ${mpesaReceipt}, Amount: KES ${amount}, Phone: ${maskPhoneNumber(phone)}`);

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

      // If no order matched checkout_request_id, search by AccountReference / Phone
      if (!orderToUpdate && phone) {
        console.log(`Searching pending orders for masked phone: ${maskPhoneNumber(phone)}...`);
        const formattedPhone = String(phone).replace('254', '0');
        
        const { data: matchedOrders } = await supabase
          .from('orders')
          .select('id, total_amount')
          .or(`phone.eq.${phone},phone.eq.${formattedPhone}`)
          .eq('payment_status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1);

        if (matchedOrders && matchedOrders.length > 0) {
          orderToUpdate = matchedOrders[0];
        }
      }

      if (orderToUpdate) {
        // Fraud Prevention Check: Validate paid amount matches order total
        if (Number(orderToUpdate.total_amount) !== Number(amount)) {
          console.warn(`FRAUD ALERT: Paid amount KES ${amount} does not match order total KES ${orderToUpdate.total_amount}!`);
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
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ResultCode: 0, ResultDesc: 'Success (flagged for fraud verification)' }));
          return;
        }

        console.log(`Matching order verified: ${orderToUpdate.id}. Updating status to paid...`);
        
        await supabase
          .from('orders')
          .update({
            payment_status: 'paid',
            status: 'paid',
            mpesa_receipt: mpesaReceipt,
            checkout_request_id: CheckoutRequestID
          })
          .eq('id', orderToUpdate.id);
      }

      // Update event registrations if matched
      if (phone) {
        const formattedPhone = String(phone).replace('254', '0');
        await supabase
          .from('event_registrations')
          .update({
            payment_status: 'paid',
            mpesa_receipt: mpesaReceipt,
            amount_paid: amount
          })
          .or(`phone.eq.${phone},phone.eq.${formattedPhone}`)
          .eq('payment_status', 'pending');
      }

      // Record commission split (70% Business / 30% Platform)
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
          console.error('Error saving commission ledger record:', commErr);
        } else {
          console.log('Successfully recorded 70/30 payment split to commissions ledger.');
          triggerPlatformPayout(platform_amount).catch(console.error);
        }
      }
    } else {
      console.warn(`STK Failed/Cancelled! CheckoutRequestID: ${CheckoutRequestID}, ResultCode: ${ResultCode}`);
      
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
    console.error('Callback handling exception:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Internal server error', details: error.message }));
  }
}
