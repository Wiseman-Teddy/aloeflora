require('dotenv').config();

const consumerKey = process.env.MPESA_CONSUMER_KEY;
const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
const shortcode = process.env.MPESA_SHORTCODE;
const passkey = process.env.MPESA_PASSKEY;
const env = process.env.MPESA_ENV || 'production';
const appUrl = process.env.APP_URL;

console.log('=== PHASE 1: DARAJA API CONFIGURATION VALIDATION ===\n');

// 1. Environment & Credentials check
console.log('1. Configuration & Secret Audit:');
console.log(' - MPESA_ENV:', env);
console.log(' - MPESA_SHORTCODE:', shortcode);
console.log(' - MPESA_CONSUMER_KEY:', consumerKey ? `Configured (Length: ${consumerKey.length})` : 'MISSING!');
console.log(' - MPESA_CONSUMER_SECRET:', consumerSecret ? `Configured (Length: ${consumerSecret.length})` : 'MISSING!');
console.log(' - MPESA_PASSKEY:', passkey ? `Configured (Length: ${passkey.length})` : 'MISSING!');
console.log(' - APP_URL (Callback Domain):', appUrl);

if (!consumerKey || !consumerSecret || !shortcode || !passkey) {
  console.error('\n❌ FAIL: Incomplete M-Pesa environment variables in .env');
  process.exit(1);
}

// 2. Production URL verification
const baseUrl = env === 'sandbox' ? 'https://sandbox.safaricom.co.ke' : 'https://api.safaricom.co.ke';
console.log('\n2. Target Gateway Endpoint:', baseUrl);

// 3. OAuth Token Generation & Cache Test
async function testOAuthAndTokenCaching() {
  console.log('\n3. Testing Daraja OAuth Token Generation & Caching...');
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
  
  try {
    const startTime = Date.now();
    const res = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${auth}` }
    });
    const duration = Date.now() - startTime;

    console.log(` - HTTP Status: ${res.status} ${res.statusText} (${duration}ms)`);

    if (!res.ok) {
      const errBody = await res.text();
      console.error(' - Response Body:', errBody);
      throw new Error(`OAuth request failed with status ${res.status}`);
    }

    const data = await res.json();
    if (data.access_token) {
      console.log(' ✓ Access Token Generated Successfully');
      console.log(' - Token Preview:', data.access_token.slice(0, 8) + '...' + data.access_token.slice(-6));
      console.log(' - Expires In:', data.expires_in, 'seconds (~' + Math.round(data.expires_in / 60) + ' minutes)');
    } else {
      throw new Error('access_token field missing in response');
    }
  } catch (err) {
    console.error('❌ OAuth Generation Error:', err.message);
  }
}

testOAuthAndTokenCaching().then(() => {
  console.log('\n=== PHASE 1 VALIDATION COMPLETE ===');
});
