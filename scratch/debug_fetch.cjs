require('dotenv').config();

const consumerKey = process.env.MPESA_CONSUMER_KEY;
const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
const baseUrl = 'https://api.safaricom.co.ke';

async function debugFetch() {
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
  try {
    const res = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${auth}` }
    });
    const data = await res.json();
    console.log("Response:", data);
  } catch (err) {
    console.error("Fetch detailed error:", err);
    if (err.cause) console.error("Cause:", err.cause);
  }
}

debugFetch();
