import { IncomingMessage, ServerResponse } from 'http';
import { Resend } from 'resend';
import { applyCors, checkRateLimit } from '../_utils/security.js';

async function getRequestBody(req: IncomingMessage): Promise<any> {
  if ((req as any).body) return (req as any).body;
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 500000) reject(new Error('Payload too large'));
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
  if (applyCors(req, res)) return;
  if (checkRateLimit(req, res, 20, 60000)) return;

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  try {
    const body = await getRequestBody(req);
    const { 
      email, 
      name, 
      type = 'event', // 'event' | 'order'
      orderId,
      items = [],
      deliveryAddress,
      mpesaReceipt,
      role, 
      eventTitle, 
      ticketNumber, 
      paymentStatus = 'Paid', 
      amount 
    } = body;

    if (!email || !name) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Email and Name are required' }));
      return;
    }

    const apiKey = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;
    if (!apiKey) {
      console.warn("RESEND_API_KEY not set. Simulating email send to", email);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ message: 'Email simulated (no API key configured)' }));
      return;
    }

    const resend = new Resend(apiKey);

    let subject = '';
    let emailContent = '';

    if (type === 'order' || orderId) {
      subject = `Order Confirmed: #${orderId || 'ALOEFLORA'} - Payment Received`;
      emailContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #064e3b; padding: 24px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 24px; letter-spacing: 1px;">ALOEFLORA PRODUCTS</h1>
              <p style="margin: 8px 0 0 0; opacity: 0.9;">Official Order Confirmation & Receipt</p>
          </div>
          <div style="padding: 32px;">
              <h2 style="margin-top: 0; color: #111827;">Thank you for your order, ${name}!</h2>
              <p style="color: #4b5563;">Your payment has been received via M-Pesa and your order is currently being prepared for dispatch.</p>
              
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin: 24px 0; border: 1px solid #e5e7eb;">
                  <h3 style="margin-top: 0; font-size: 14px; text-transform: uppercase; color: #6b7280; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">Order Summary</h3>
                  <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                      <tr>
                          <td style="padding: 6px 0; color: #4b5563;">Order Number:</td>
                          <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #111827;">#${orderId || 'N/A'}</td>
                      </tr>
                      <tr>
                          <td style="padding: 6px 0; color: #4b5563;">M-Pesa Receipt:</td>
                          <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #059669;">${mpesaReceipt || ticketNumber || 'Confirmed'}</td>
                      </tr>
                      <tr>
                          <td style="padding: 6px 0; color: #4b5563;">Payment Status:</td>
                          <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #059669;">Paid</td>
                      </tr>
                      ${deliveryAddress ? `
                      <tr>
                          <td style="padding: 6px 0; color: #4b5563;">Delivery Destination:</td>
                          <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #111827;">${deliveryAddress}</td>
                      </tr>` : ''}
                      ${amount ? `
                      <tr style="border-top: 1px solid #e5e7eb;">
                          <td style="padding: 10px 0; font-weight: bold; color: #111827;">Total Paid:</td>
                          <td style="padding: 10px 0; font-weight: 900; font-size: 16px; text-align: right; color: #064e3b;">KES ${amount}</td>
                      </tr>` : ''}
                  </table>
              </div>

              ${items && items.length > 0 ? `
              <div style="margin: 24px 0;">
                <h4 style="margin-bottom: 8px; color: #374151;">Items Ordered:</h4>
                <ul style="padding-left: 20px; color: #4b5563;">
                  ${items.map((it: any) => `<li><strong>${it.quantity}x</strong> ${it.productName || it.name || 'Product'} ${it.selectedVariant ? `(${it.selectedVariant})` : ''} - KES ${(it.price || 0) * (it.quantity || 1)}</li>`).join('')}
                </ul>
              </div>
              ` : ''}

              <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 16px; margin: 24px 0;">
                  <p style="margin: 0; font-size: 14px; color: #065f46;">📦 <strong>Next Steps:</strong> Our logistics team will contact you once your package is dispatched. You can track your order status live anytime in your Aloeflora account dashboard.</p>
              </div>

              <p style="color: #6b7280; font-size: 14px;">Questions about your order? Reach out to us at <a href="mailto:info@aloefloraproducts.com" style="color: #059669;">info@aloefloraproducts.com</a>.</p>
              <br />
              <p style="color: #374151;">Warm Regards,</p>
              <p style="color: #111827;"><strong>The ALOEFLORA Team</strong></p>
          </div>
        </div>
      `;
    } else {
      // Event Ticket Email
      subject = `Registration Confirmed: ${eventTitle || 'ALOEFLORA Event'}`;
      emailContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #064e3b; padding: 24px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 24px;">ALOEFLORA EVENTS</h1>
              <p style="margin: 8px 0 0 0; opacity: 0.9;">Official ${role === 'vendor' ? 'Vendor Pass' : 'Event Ticket'}</p>
          </div>
          <div style="padding: 32px;">
              <h2 style="margin-top: 0;">Hello ${name},</h2>
              <p>Your registration for <strong>${eventTitle || 'the upcoming ALOEFLORA event'}</strong> is confirmed!</p>
              
              <div style="background-color: #f3f4f6; border-radius: 8px; padding: 16px; margin: 24px 0;">
                  <h3 style="margin-top: 0; font-size: 14px; text-transform: uppercase; color: #6b7280; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">Registration Details</h3>
                  <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                          <td style="padding: 8px 0; color: #4b5563;">Role</td>
                          <td style="padding: 8px 0; font-weight: bold; text-align: right;">${role === 'vendor' ? 'Vendor' : 'Attendee'}</td>
                      </tr>
                      <tr>
                          <td style="padding: 8px 0; color: #4b5563;">Status</td>
                          <td style="padding: 8px 0; font-weight: bold; text-align: right; color: ${paymentStatus.toLowerCase() === 'paid' ? '#059669' : '#4b5563'};">${paymentStatus}</td>
                      </tr>
                      ${amount ? `
                      <tr>
                          <td style="padding: 8px 0; color: #4b5563;">Amount Paid</td>
                          <td style="padding: 8px 0; font-weight: bold; text-align: right;">KES ${amount}</td>
                      </tr>` : ''}
                  </table>
              </div>

              ${ticketNumber ? `
              <div style="text-align: center; margin: 32px 0; padding: 24px; border: 2px dashed #064e3b; border-radius: 12px;">
                  <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280; text-transform: uppercase;">Your Unique Ticket ID</p>
                  <div style="font-size: 24px; font-weight: 900; letter-spacing: 2px; color: #111827;">${ticketNumber}</div>
                  <div style="margin-top: 16px;">
                     <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${ticketNumber}" alt="QR Code" width="150" height="150" />
                  </div>
              </div>` : ''}

              ${role === 'vendor' ? `
              <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                  <h4 style="margin-top: 0; color: #92400e;">Vendor Instructions</h4>
                  <p style="margin-bottom: 0; font-size: 14px; color: #b45309;">Please arrive at least 2 hours before the event starts for stall setup and allocation. Present this email or ticket number at the vendor registration desk.</p>
              </div>
              ` : ''}

              <p>We look forward to seeing you there!</p>
              <br />
              <p>Warm Regards,</p>
              <p><strong>The ALOEFLORA Team</strong></p>
          </div>
        </div>
      `;
    }

    const data = await resend.emails.send({
      from: 'ALOEFLORA <onboarding@resend.dev>',
      to: email,
      subject: subject,
      html: emailContent,
    });

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ message: 'Email sent successfully', data }));
  } catch (error: any) {
    console.error('Email confirmation error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Internal server error', details: error.message }));
  }
}
