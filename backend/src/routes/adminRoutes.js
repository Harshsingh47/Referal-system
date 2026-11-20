import { Router } from 'express';
import {
  adminLogin,
  getRegistrations,
  getRegistrationDetails,
  revealAccountNumber,
  updateStatus,
  getAdminStats,
  exportRegistrationsCsv
} from '../controllers/adminController.js';
import { requireAdmin } from '../middleware/adminAuth.js';

const router = Router();

// Public Admin Login endpoint
router.post('/login', adminLogin);

// Protected Admin Endpoints
router.get('/stats', requireAdmin, getAdminStats);
router.get('/registrations', requireAdmin, getRegistrations);
router.get('/registrations/:id', requireAdmin, getRegistrationDetails);
router.get('/registrations/:id/account-number', requireAdmin, revealAccountNumber);
router.patch('/registrations/:id/status', requireAdmin, updateStatus);
router.get('/export', requireAdmin, exportRegistrationsCsv);

export default router;
