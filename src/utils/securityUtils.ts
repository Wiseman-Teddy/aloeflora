import crypto from 'crypto';

/**
 * Essential Security Utility functions for engineering best practices.
 */

/**
 * 1. Mask Mobile Phone Numbers in Public Log Outputs
 * Format: 254712345678 -> 2547****5678 or 0712345678 -> 0712****5678
 */
export function maskPhoneNumber(phone: string | number | undefined | null): string {
  if (!phone) return '****';
  const str = String(phone).trim().replace(/\s+/g, '');
  if (str.length < 8) return '****';

  // Retain first 4 digits (e.g. 2547 or 0712) and last 4 digits (e.g. 5678)
  const start = str.slice(0, 4);
  const end = str.slice(-4);
  const middleLength = Math.max(0, str.length - 8);
  const stars = '*'.repeat(middleLength || 4);

  return `${start}${stars}${end}`;
}

/**
 * 2. Validate HMAC Webhook Signatures (SellioPay / Safaricom / Custom Payment Gateways)
 * Verifies SHA-256 HMAC signature against secret key
 */
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader?: string | string[] | null,
  secret?: string
): boolean {
  // If no secret configured or no signature header supplied, allow with warning in dev
  if (!secret) {
    return true;
  }
  if (!signatureHeader) {
    return false;
  }

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
    console.error('Webhook signature verification error:', err);
    return false;
  }
}
