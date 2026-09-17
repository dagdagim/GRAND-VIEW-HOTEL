import { Router } from 'express';
import {
  loginRoomPortal,
  authenticateGuestSession,
  getStayInfo,
  toggleDoNotDisturb,
  getInRoomMenu,
  placeRoomServiceOrder,
  getInRoomFolio,
  createServiceRequest,
  getMyOrdersAndRequests,
  requestExpressCheckout,
  getRoomPublicStatus,
  placeDayFinished,
  reopenDay
} from '../controllers/guestPortalController.js';

const router = Router();

// Public routes for in-room portal
router.post('/login', loginRoomPortal);
router.get('/menu', getInRoomMenu);
router.get('/room-status/:roomNumber', getRoomPublicStatus);

// Protected routes requiring active in-room guest session
router.use(authenticateGuestSession as any);

router.get('/stay', getStayInfo);
router.post('/dnd', toggleDoNotDisturb);
router.post('/order', placeRoomServiceOrder);
router.get('/folio', getInRoomFolio);
router.post('/service-request', createServiceRequest);
router.get('/activity', getMyOrdersAndRequests);
router.post('/express-checkout', requestExpressCheckout);
router.post('/day-finished', placeDayFinished);
router.post('/day-reopen', reopenDay);

export default router;
