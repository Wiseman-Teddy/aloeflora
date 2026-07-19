import { IncomingMessage, ServerResponse } from 'http';

// Simple in-memory rate limiter for serverless environments
// Note: In a highly distributed edge environment, this is instance-specific.
// For strict global rate-limiting, Redis or Vercel KV should be used.
const rateLimitMap = new Map<string, { count: number, resetTime: number }>();

export function checkRateLimit(req: IncomingMessage, res: ServerResponse, maxRequests = 10, windowMs = 60000): boolean {
  // Get IP
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

  // Allow localhost during dev and strictly any *.vercel.app domain for production
  if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    // If no matching origin, don't set the header (browser will block it)
    // or set a strict fallback
    res.setHeader('Access-Control-Allow-Origin', 'https://aloefloraproducts.com'); 
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return true; // Handle preflight and return true so caller stops execution
  }

  return false;
}
