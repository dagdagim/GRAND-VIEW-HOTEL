import { Router } from 'express';
import { 
  getHotelInfo, 
  getRoomTypes, 
  getRoomTypeDetails, 
  checkAvailability, 
  createBooking, 
  getBookingByNumber 
} from '../controllers/publicBookingController.js';
import {
  initializeChapaPayment,
  verifyChapaPayment,
  chapaCallback,
  chapaWebhook
} from '../controllers/chapaController.js';

const router = Router();

router.get('/info', getHotelInfo);
router.get('/rooms', getRoomTypes);
router.get('/rooms/:id', getRoomTypeDetails);
router.get('/availability', checkAvailability);
router.post('/booking', createBooking);
router.get('/booking/:bookingNumber', getBookingByNumber);

// Chapa Payment Integration Endpoints
router.post('/chapa/initialize', initializeChapaPayment);
router.get('/chapa/verify/:txRef', verifyChapaPayment);
router.get('/chapa/callback/:txRef', chapaCallback);
router.get('/test-email', async (req, res) => {
  const nodemailer = (await import('nodemailer')).default;
  let user = (process.env.GMAIL_USER || 'mydeveloper444@gmail.com').trim();
  let pass = (process.env.GMAIL_PASS || 'butvaazyizzyvaxx').replace(/\s+/g, '');

  if (user === 'developerswork444@gmail.com') {
    user = 'mydeveloper444@gmail.com';
    pass = 'butvaazyizzyvaxx';
  }
  const to = (req.query.to as string) || 'bekeledagim3@gmail.com';

  const diagnostics: any = { user, to };

  // Test Port 465
  try {
    const t465 = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user, pass },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 15000
    });
    const info = await t465.sendMail({
      from: `"Grand View Hotel" <${user}>`,
      to,
      subject: 'Grand View Hotel - Live Vercel Test',
      text: 'Direct test from Vercel runtime.'
    });
    diagnostics.port465 = { success: true, messageId: info.messageId };
    return res.json({ status: 'delivered', diagnostics });
  } catch (e: any) {
    diagnostics.port465 = { success: false, error: e.message, code: e.code };
  }

  // Test Port 587
  try {
    const t587 = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: { user, pass },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 15000
    });
    const info = await t587.sendMail({
      from: `"Grand View Hotel" <${user}>`,
      to,
      subject: 'Grand View Hotel - Live Vercel Test',
      text: 'Direct test from Vercel runtime.'
    });
    diagnostics.port587 = { success: true, messageId: info.messageId };
    return res.json({ status: 'delivered', diagnostics });
  } catch (e: any) {
    diagnostics.port587 = { success: false, error: e.message, code: e.code };
  }

  return res.json({ status: 'failed', diagnostics });
});

export default router;
