import { IncomingMessage, ServerResponse } from 'http';
import crypto from 'crypto';

// Simple in-memory rate limiter for serverless environments
const rateLimitMap = new Map<string, { count: number, resetTime: number }>();

export function checkRateLimit(req: IncomingMessage, res: ServerResponse, maxRequests = 10, windowMs = 60000): boolean {
  let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  if (Array.isArray(ip)) ip = ip[0];

  const now = Date.now();
  let record = rateLimitMap.get(ip as string);

  if (!record || record.resetTime < now) {
    rateLimitMap.set(ip as string, { count: 1, resetTime: now + windowMs });
    return false; // Not limited
  }

  record.count++;
  if (record.count > maxRequests) {
    res.statusCode = 429;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Retry-After', Math.ceil((record.resetTime - now) / 1000).toString());
    res.end(JSON.stringify({ error: 'Too Many Requests. Strict rate limiting enforced to prevent abuse.' }));
    return true; // Is limited
  }

  return false;
}

export function applyCors(req: IncomingMessage, res: ServerResponse): boolean {
  const allowedOrigins = ['http://localhost:3000', 'http://localhost:5173', 'https://aloefloraproducts.com', 'https://www.aloefloraproducts.com'];
  const origin = req.headers.origin || '';

  if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://aloefloraproducts.com'); 
  }

  // Enforce HSTS (TLS 1.3 / HTTPS Everywhere) and security headers
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-signature, x-safaricom-signature');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return true;
  }

  return false;
}

/**
 * Mask Phone Numbers in Logs (Checklist #4)
 * Returns format e.g. 2547****5678
 */
export function maskPhoneNumber(phone: string | number | undefined | null): string {
  if (!phone) return '****';
  const str = String(phone).trim().replace(/\s+/g, '');
  if (str.length < 8) return '****';

  const start = str.slice(0, 4);
  const end = str.slice(-4);
  const middleLength = Math.max(0, str.length - 8);
  const stars = '*'.repeat(middleLength || 4);

  return `${start}${stars}${end}`;
}

/**
 * Verify HMAC Webhook Signatures (Checklist #2)
 * Validates HMAC SHA-256 signatures for Safaricom/SellioPay payment webhooks
 */
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader?: string | string[] | null,
  secret?: string
): boolean {
  if (!secret) return true; // If no secret configured, allow with log
  if (!signatureHeader) return false;

  const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;

  try {
    const hmacHex = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    const hmacBase64 = crypto.createHmac('sha256', secret).update(rawBody).digest('base64');

    const sigBuf = Buffer.from(signature);
    const hexBuf = Buffer.from(hmacHex);
    const b64Buf = Buffer.from(hmacBase64);

    return (
      (sigBuf.length === hexBuf.length && crypto.timingSafeEqual(sigBuf, hexBuf)) ||
      (sigBuf.length === b64Buf.length && crypto.timingSafeEqual(sigBuf, b64Buf))
    );
  } catch (err) {
    console.error('Webhook signature verification exception:', err);
    return false;
  }
}
