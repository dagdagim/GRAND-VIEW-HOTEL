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
router.post('/chapa/webhook', chapaWebhook);

export default router;
