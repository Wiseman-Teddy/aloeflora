import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Daraja API Credentials
const consumerKey = process.env.MPESA_CONSUMER_KEY;
const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
// Optional: If you have a shortcode and passkey for Daraja
const businessShortCode = process.env.MPESA_SHORTCODE || '174379'; // Test shortcode
const passkey = process.env.MPESA_PASSKEY || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';

// Generate M-Pesa Token
async function getMpesaToken() {
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
  try {
    const response = await fetch('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      headers: {
        Authorization: `Basic ${auth}`
      }
    });
    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error generating M-Pesa token:', error);
    throw error;
  }
}

// Endpoint to initiate STK Push
app.post('/api/mpesa/stkpush', async (req, res) => {
  const { phone, amount } = req.body;

  if (!phone || !amount) {
    return res.status(400).json({ error: 'Phone and amount are required' });
  }

  // Format phone number to 254...
  let formattedPhone = phone.replace(/\s+/g, '');
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '254' + formattedPhone.substring(1);
  } else if (formattedPhone.startsWith('+')) {
    formattedPhone = formattedPhone.substring(1);
  }

  try {
    const token = await getMpesaToken();
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password = Buffer.from(`${businessShortCode}${passkey}${timestamp}`).toString('base64');

    const payload = {
      BusinessShortCode: businessShortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: formattedPhone,
      PartyB: businessShortCode,
      PhoneNumber: formattedPhone,
      CallBackURL: `${process.env.APP_URL || 'https://your-ngrok-url.com'}/api/mpesa/callback`, // Needs to be public
      AccountReference: 'Aloeflora Order',
      TransactionDesc: 'Payment for order'
    };

    const response = await fetch('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (data.ResponseCode === '0') {
      res.json({ success: true, message: 'STK push sent successfully', checkoutRequestID: data.CheckoutRequestID });
    } else {
      res.status(400).json({ success: false, error: data.errorMessage || 'Failed to send STK push', details: data });
    }
  } catch (error) {
    console.error('STK Push Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// M-Pesa Callback Endpoint
app.post('/api/mpesa/callback', (req, res) => {
  console.log('--- STK Push Callback Received ---');
  console.log(JSON.stringify(req.body, null, 2));

  // In production, update Supabase order payment status here based on CheckoutRequestID.

  res.status(200).json({ message: 'Success' });
});

// Serve frontend if in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Express API Server running on port ${PORT}`);
});
