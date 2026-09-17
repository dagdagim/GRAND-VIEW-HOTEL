import { Router } from 'express';
import authRoutes from './authRoutes.js';
import publicRoutes from './publicRoutes.js';
import pmsRoutes from './pmsRoutes.js';
import guestPortalRoutes from './guestPortalRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/public', publicRoutes);
router.use('/pms', pmsRoutes);
router.use('/guest-portal', guestPortalRoutes);

export default router;
