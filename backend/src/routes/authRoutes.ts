import { Router } from 'express';
import { login, getMe, listStaff, createStaff, updateStaffStatus } from '../controllers/authController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.get('/me', authenticate, getMe);
router.get('/staff', authenticate, authorize('SUPER_ADMIN', 'HOTEL_MANAGER', 'RECEPTIONIST'), listStaff);
router.post('/staff', authenticate, authorize('SUPER_ADMIN', 'HOTEL_MANAGER'), createStaff);
router.patch('/staff/:id/status', authenticate, authorize('SUPER_ADMIN', 'HOTEL_MANAGER'), updateStaffStatus);

export default router;
