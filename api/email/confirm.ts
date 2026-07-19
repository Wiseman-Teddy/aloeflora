import { IncomingMessage, ServerResponse } from 'http';
import { Resend } from 'resend';
import { applyCors, checkRateLimit } from '../_utils/security';

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
    const { email, name, role, eventTitle, ticketNumber, paymentStatus, amount } = body;

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
      res.end(JSON.stringify({ message: 'Email simulated (no API key)' }));
      return;
    }

    const resend = new Resend(apiKey);

    const emailContent = `
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

    const data = await resend.emails.send({
      from: 'ALOEFLORA Events <onboarding@resend.dev>',
      to: email,
      subject: `Registration Confirmed: ${eventTitle || 'ALOEFLORA Event'}`,
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
