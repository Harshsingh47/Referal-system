import { Router } from 'express';
import mongoose from 'mongoose';
import {
  registerUser,
  getReferralByCode,
  checkReferralCode
} from '../controllers/referralController.js';
import { registerRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    uptime: Math.floor(process.uptime())
  });
});

// User Registration endpoint with rate limiting
router.post('/register', registerRateLimiter, registerUser);

// Validate referral code (for referrer attribution UI)
router.get('/referral/check/:code', checkReferralCode);

// Get public referral details & dynamic QR code
router.get('/referral/:code', getReferralByCode);

export default router;
