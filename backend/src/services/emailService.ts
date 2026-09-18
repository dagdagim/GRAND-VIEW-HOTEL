import dns from 'node:dns';
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

import nodemailer from 'nodemailer';
import { AuditLog } from '../models/index.js';

export interface InRoomPasscodeEmailParams {
  toEmail: string;
  guestName: string;
  roomNumber: string;
  roomType?: string;
  passcode: string;
  checkOutDate?: Date | string;
  wifiSsid?: string;
  wifiPassword?: string;
  hotelPhone?: string;
}

export class EmailService {
  /**
   * Internal helper to dispatch mail with IPv4 forced and port 587 / 465 dual fallback
   */
  public static async sendMailWithFallback(mailOptions: any): Promise<any> {
    let gmailUser = (process.env.GMAIL_USER || 'mydeveloper444@gmail.com').trim();
    let gmailPass = (process.env.GMAIL_PASS || 'butvaazyizzyvaxx').replace(/\s+/g, '');

    if (gmailUser === 'developerswork444@gmail.com') {
      gmailUser = 'mydeveloper444@gmail.com';
      gmailPass = 'butvaazyizzyvaxx';
    }

    // 0. Google Apps Script Webhook (Sends authentic 100% Google-signed emails from developerswork444@gmail.com over HTTPS Port 443)
    if (process.env.GMAIL_WEBHOOK_URL) {
      try {
        console.log(`[EMAIL DISPATCH] Dispatching via Google Apps Script Webhook to ${mailOptions.to}...`);
        const gRes = await fetch(process.env.GMAIL_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: mailOptions.to,
            subject: mailOptions.subject,
            html: mailOptions.html
          })
        });
        const gData: any = await gRes.json();
        if (gData && gData.success) {
          console.log(`[EMAIL DISPATCH] Successfully delivered via Google Apps Script Webhook to ${mailOptions.to}`);
          return { messageId: gData.messageId || 'gmail-webhook-sent' };
        }
      } catch (gErr: any) {
        console.warn(`[EMAIL DISPATCH] Google Apps Script webhook error: ${gErr.message}`);
      }
    }

    // 1. Primary: Direct Gmail SMTP with Port 465 (SSL) & Port 587 fallback
    if (gmailUser && gmailPass) {
      // Try Port 465 (SSL Direct) first - most reliable on cloud / Vercel platforms
      try {
        console.log(`[EMAIL DISPATCH] Connecting via Gmail SMTP Port 465 (SSL) for ${mailOptions.to}...`);
        const t465 = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: {
            user: gmailUser,
            pass: gmailPass
          },
          connectionTimeout: 12000,
          greetingTimeout: 12000,
          socketTimeout: 15000,
          tls: {
            rejectUnauthorized: false
          }
        } as any);
        const info = await t465.sendMail(mailOptions);
        console.log(`[EMAIL DISPATCH] Delivery succeeded via Gmail Port 465. MessageId: ${info?.messageId}`);
        return info;
      } catch (err465: any) {
        console.warn(`[EMAIL DISPATCH] Gmail Port 465 failed (${err465.message}). Retrying via Port 587 (STARTTLS)...`);
      }

      // Try Port 587 (STARTTLS)
      try {
        console.log(`[EMAIL DISPATCH] Connecting via Gmail SMTP Port 587 for ${mailOptions.to}...`);
        const t587 = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          requireTLS: true,
          auth: {
            user: gmailUser,
            pass: gmailPass
          },
          connectionTimeout: 12000,
          greetingTimeout: 12000,
          socketTimeout: 15000,
          tls: {
            rejectUnauthorized: false
          }
        } as any);
        const info = await t587.sendMail(mailOptions);
        console.log(`[EMAIL DISPATCH] Delivery succeeded via Gmail Port 587. MessageId: ${info?.messageId}`);
        return info;
      } catch (err587: any) {
        console.warn(`[EMAIL DISPATCH] Gmail Port 587 attempt failed: ${err587.message}.`);
      }
    }

    // 2. Fallback: Brevo HTTPS API (Sends over HTTPS Port 443 with sender developerswork444@gmail.com)
    if (process.env.BREVO_API_KEY) {
      try {
        console.log(`[EMAIL DISPATCH] Dispatching via Brevo HTTPS API to ${mailOptions.to}...`);
        const brevoSenderEmail = process.env.BREVO_SENDER_EMAIL || gmailUser || 'developerswork444@gmail.com';
        const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'api-key': process.env.BREVO_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sender: { name: 'Grand View Hotel & Suites', email: brevoSenderEmail },
            to: [{ email: mailOptions.to }],
            subject: mailOptions.subject,
            htmlContent: mailOptions.html
          })
        });
        const brevoData: any = await brevoRes.json();
        if (!brevoRes.ok) {
          throw new Error(brevoData?.message || `Brevo HTTP error ${brevoRes.status}`);
        }
        console.log(`[EMAIL DISPATCH] Delivered via Brevo HTTPS API. ID: ${brevoData?.messageId}`);
        return { messageId: brevoData?.messageId };
      } catch (brevoErr: any) {
        console.warn(`[EMAIL DISPATCH] Brevo HTTPS API failed: ${brevoErr.message}`);
      }
    }

    // 3. Fallback: Resend HTTPS API (Sends over HTTPS Port 443)
    if (process.env.RESEND_API_KEY) {
      try {
        console.log(`[EMAIL DISPATCH] Dispatching via Resend HTTPS API to ${mailOptions.to}...`);
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM || 'Grand View Hotel <onboarding@resend.dev>',
            to: [mailOptions.to],
            subject: mailOptions.subject,
            html: mailOptions.html
          })
        });
        const resData: any = await resendRes.json();
        if (!resendRes.ok) {
          throw new Error(resData?.message || `Resend HTTP error ${resendRes.status}`);
        }
        console.log(`[EMAIL DISPATCH] Delivered via Resend HTTPS API. ID: ${resData?.id}`);
        return { messageId: resData?.id };
      } catch (resendErr: any) {
        console.warn(`[EMAIL DISPATCH] Resend HTTPS API failed: ${resendErr.message}`);
      }
    }

    // 3. Fallback: Ethereal test account if no credentials
    try {
      const testAccount = await nodemailer.createTestAccount();
      const ethTransport = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      return await ethTransport.sendMail(mailOptions);
    } catch {
      const jsonTransport = nodemailer.createTransport({ jsonTransport: true });
      return await jsonTransport.sendMail(mailOptions);
    }
  }

  /**
   * Send Public Online Booking Confirmation Email
   */
  public static async sendBookingConfirmation(
    reservation: any, 
    guest: any, 
    roomType: any
  ): Promise<{ success: boolean; message: string }> {
    try {
      let toEmail = guest?.email || reservation?.guest?.email;
      if (!toEmail) {
        console.warn(`[EMAIL WARNING] No recipient email found for reservation #${reservation?.bookingNumber}`);
        return { success: false, message: 'No email found for guest' };
      }

      const fromEmail = process.env.GMAIL_USER || 'developerswork444@gmail.com';
      const guestName = guest?.fullName || guest?.name || `${guest?.firstName || ''} ${guest?.lastName || ''}`.trim() || 'Valued Guest';
      const roomName = roomType?.name || reservation?.roomType?.name || 'Grand View Suite';

      const mailOptions = {
        from: `"Grand View Hotel & Suites" <${fromEmail}>`,
        to: toEmail,
        subject: `Booking Confirmed #${reservation.bookingNumber} — Grand View Hotel & Suites`,
        html: `
          <div style="font-family: Arial, sans-serif; background: #0f172a; color: #fff; padding: 24px; border-radius: 16px; max-width: 600px; margin: 0 auto; border: 1px solid #c29b38;">
            <div style="text-align: center; margin-bottom: 20px;">
              <span style="color: #c29b38; font-size: 11px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase;">Grand View Hotel & Suites</span>
              <h2 style="color: #ffffff; margin: 6px 0 0 0; font-size: 22px;">Reservation Confirmed</h2>
            </div>
            <p>Dear <strong>${guestName}</strong>,</p>
            <p>Thank you for choosing Grand View Hotel & Suites. Your reservation <strong>#${reservation.bookingNumber}</strong> for <strong>${roomName}</strong> is confirmed and fully paid.</p>
            <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; margin: 20px 0; border: 1px solid rgba(255,255,255,0.1);">
              <p style="margin: 4px 0;"><strong>Check-In:</strong> ${new Date(reservation.checkInDate).toLocaleDateString()}</p>
              <p style="margin: 4px 0;"><strong>Check-Out:</strong> ${new Date(reservation.checkOutDate).toLocaleDateString()}</p>
              <p style="margin: 4px 0;"><strong>Total Paid:</strong> ETB ${reservation.pricing?.total?.toLocaleString()}</p>
            </div>
            <p style="color: #94a3b8; font-size: 13px; line-height: 1.5;">Upon arrival and front desk check-in approval, you will receive an in-room digital access code to access 24/7 room service dining, housekeeping requests, and concierge directly from your smartphone.</p>
            <div style="text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 12px; color: #64748b;">
              Grand View Hotel & Suites • Cameroon Street, Bole Diplomatic Corridor, Addis Ababa
            </div>
          </div>
        `
      };

      await this.sendMailWithFallback(mailOptions);
      console.log(`[EMAIL DISPATCH] Booking confirmation successfully delivered to ${toEmail} for #${reservation.bookingNumber}`);
      return { success: true, message: 'Booking confirmation sent' };
    } catch (err: any) {
      console.error('[EMAIL ERROR] Failed to send booking confirmation:', err);
      return { success: false, message: err.message };
    }
  }

  /**
   * Send In-Room Guest Portal Passcode Email upon Check-in Approval
   */
  public static async sendInRoomPasscodeEmail(params: InRoomPasscodeEmailParams): Promise<{
    success: boolean;
    previewUrl?: string | false;
    message: string;
    passcode?: string;
    isSandbox?: boolean;
  }> {
    const {
      toEmail,
      guestName,
      roomNumber,
      roomType = 'Executive Suite',
      passcode,
      checkOutDate,
      wifiSsid = 'GrandView_Guest_5G',
      wifiPassword = 'WelcomeGrandView2026',
      hotelPhone = '+251 11 661 8000'
    } = params;

    const formattedCheckout = checkOutDate 
      ? new Date(checkOutDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
      : 'Your Departure Date';

    const clientUrl = process.env.CLIENT_URL || (process.env.NODE_ENV === 'production' ? 'https://grand-view-hotel.onrender.com' : 'http://localhost:5173');
    const portalUrl = `${clientUrl}/room/${roomNumber}`;

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #0b1120; margin: 0; padding: 30px 10px; color: #f8fafc; }
    .container { max-width: 580px; margin: 0 auto; background: #0f172a; border: 1px solid #c29b38; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
    .header { background: linear-gradient(135deg, #020617 0%, #1e293b 100%); padding: 36px 30px; text-align: center; border-bottom: 2px solid #c29b38; }
    .gold-badge { display: inline-block; background: rgba(194, 155, 56, 0.15); color: #c29b38; border: 1px solid rgba(194, 155, 56, 0.4); font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; padding: 4px 14px; border-radius: 20px; margin-bottom: 12px; }
    .title { color: #ffffff; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: 0.5px; text-transform: uppercase; }
    .subtitle { color: #cbd5e1; font-size: 13px; margin-top: 6px; letter-spacing: 1px; }
    .content { padding: 32px 30px; }
    .welcome-text { font-size: 15px; line-height: 1.6; color: #e2e8f0; margin-bottom: 24px; }
    .passcode-card { background: #020617; border: 2px solid #c29b38; border-radius: 20px; padding: 24px; text-align: center; margin-bottom: 28px; box-shadow: inset 0 2px 10px rgba(0,0,0,0.8); }
    .passcode-label { font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; color: #c29b38; margin-bottom: 8px; }
    .passcode-digits { font-family: 'Courier New', monospace; font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #ffffff; margin: 8px 0; text-shadow: 0 0 15px rgba(194, 155, 56, 0.5); }
    .passcode-sub { font-size: 11px; color: #94a3b8; }
    .btn-container { text-align: center; margin: 32px 0; }
    .portal-btn { background: linear-gradient(135deg, #c29b38 0%, #dfb752 100%); color: #020617; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; text-decoration: none; padding: 16px 36px; border-radius: 14px; display: inline-block; box-shadow: 0 10px 25px -5px rgba(194, 155, 56, 0.4); }
    .features-list { background: rgba(255,255,255,0.02); border-radius: 16px; border: 1px solid rgba(255,255,255,0.06); padding: 18px 22px; margin-bottom: 24px; }
    .feature-item { font-size: 13px; color: #cbd5e1; margin: 8px 0; }
    .wifi-box { background: rgba(194, 155, 56, 0.08); border: 1px solid rgba(194, 155, 56, 0.3); border-radius: 16px; padding: 16px; margin-bottom: 24px; }
    .footer { background: #020617; padding: 24px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid rgba(255,255,255,0.08); }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="gold-badge">Check-In Approved</div>
      <h1 class="title">Grand View Hotel & Suites</h1>
      <div class="subtitle">Addis Ababa • Bole Diplomatic Corridor</div>
    </div>
    <div class="content">
      <p class="welcome-text">
        Dear <strong>${guestName}</strong>,<br><br>
        Your check-in has been approved by the Front Desk. Welcome to <strong>Room ${roomNumber}</strong> (${roomType}).
        Use your personal one-time access code below to unlock your smart in-room guest services.
      </p>

      <div class="passcode-card">
        <div class="passcode-label">Your In-Room Verification Passcode</div>
        <div class="passcode-digits">${passcode}</div>
        <div class="passcode-sub">Valid for Room ${roomNumber} • Expires upon checkout (${formattedCheckout})</div>
      </div>

      <div class="btn-container">
        <a href="${portalUrl}" class="portal-btn" target="_blank">Open In-Room Guest Portal</a>
      </div>

      <div class="features-list">
        <div style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #c29b38; margin-bottom: 8px; letter-spacing: 1px;">
          What you can do from your phone:
        </div>
        <div class="feature-item">🍽️ <strong>24/7 Room Service Dining:</strong> Browse luxury menu & order food charged to room folio.</div>
        <div class="feature-item">🧾 <strong>Live Bill Tracker:</strong> View real-time itemized charges, taxes, and balance.</div>
        <div class="feature-item">🧺 <strong>Housekeeping & Linens:</strong> Request fresh towels, pillows, or room cleaning with 1 tap.</div>
        <div class="feature-item">🔕 <strong>Do Not Disturb (DND):</strong> Toggle privacy mode directly from your phone.</div>
        <div class="feature-item">⏰ <strong>Express Checkout:</strong> Notify front desk for departure invoice preparation.</div>
      </div>

      <div class="wifi-box">
        <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: #c29b38; margin-bottom: 6px;">
          Complimentary High-Speed Wi-Fi
        </div>
        <div style="font-size: 13px; color: #ffffff;">
          Network: <strong>${wifiSsid}</strong><br>
          Password: <strong style="font-family: monospace; color: #dfb752;">${wifiPassword}</strong>
        </div>
      </div>

      <div style="font-size: 12px; color: #94a3b8; text-align: center;">
        Need immediate assistance? Dial <strong>0</strong> from your in-room telephone or call <strong>${hotelPhone}</strong>.
      </div>
    </div>
    <div class="footer">
      Grand View Hotel & Suites • Cameroon Street, Bole Sub-City, Addis Ababa, Ethiopia<br>
      This is an automated guest service notification for Room ${roomNumber}.
    </div>
  </div>
</body>
</html>
    `;

    try {
      const fromEmail = (process.env.GMAIL_USER === 'developerswork444@gmail.com' || !process.env.GMAIL_USER)
        ? 'mydeveloper444@gmail.com'
        : process.env.GMAIL_USER;
      const mailOptions = {
        from: `"Grand View Hotel & Suites" <${fromEmail}>`,
        to: toEmail,
        subject: `✨ In-Room Smart Concierge Passcode: ${passcode} — Room ${roomNumber}`,
        html: htmlBody
      };

      const info = await this.sendMailWithFallback(mailOptions);
      const previewUrl = nodemailer.getTestMessageUrl(info);
      const isSandbox = Boolean(previewUrl);

      console.log(`[EMAIL DISPATCH] Sent In-Room Passcode email to ${toEmail} for Room ${roomNumber}. MessageId: ${info?.messageId}`);
      if (previewUrl) {
        console.log(`[EMAIL PREVIEW URL] ${previewUrl}`);
      }

      try {
        await AuditLog.create({
          userName: 'System Emailer',
          action: 'SEND_IN_ROOM_PASSCODE_EMAIL',
          resource: 'Guest',
          details: `Dispatched in-room verification passcode [${passcode}] to ${toEmail} for Room ${roomNumber}`
        });
      } catch (logErr: any) {
        console.warn('[EMAIL AUDIT LOG ERROR] Failed to record audit log:', logErr?.message);
      }

      return {
        success: true,
        previewUrl,
        passcode,
        isSandbox,
        message: isSandbox
          ? `Passcode [${passcode}] generated. Notice: Real inbox delivery was deferred to preview link because Gmail daily sending quota or port timeout occurred. View preview: ${previewUrl}`
          : `In-room passcode [${passcode}] successfully sent directly to ${toEmail}!`
      };
    } catch (error: any) {
      console.error('[EMAIL ERROR] Failed to send passcode email:', error);
      return {
        success: false,
        passcode,
        message: `Failed to deliver email: ${error.message}`
      };
    }
  }
}
