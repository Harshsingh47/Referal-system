import crypto from 'crypto';
import Registration from '../models/Registration.js';
import Counter from '../models/Counter.js';
import { encrypt } from '../utils/encryption.js';
import { generateQRCodeDataUrl } from '../utils/qrcode.js';
import { validateRegistrationInput } from '../utils/validators.js';

/**
 * Resolve frontend base URL dynamically from request, client body, or env
 * Always ensures the referral link opens the FRONTEND registration app, NOT the backend API.
 */
export const getBaseUrl = (req) => {
  // 1. If client provided its origin in body (e.g. registration form)
  if (req?.body?.clientOrigin && typeof req.body.clientOrigin === 'string') {
    const clientOrigin = req.body.clientOrigin.trim().replace(/\/+$/, '');
    if (!clientOrigin.includes('backend-one-rho-96') && !clientOrigin.includes(':5000')) {
      return clientOrigin;
    }
  }

  // 2. Check HTTP Origin header from browser request
  const origin = req?.headers?.origin;
  if (origin && !origin.includes('backend-one-rho-96') && !origin.includes(':5000')) {
    return origin.replace(/\/+$/, '');
  }

  // 3. Check HTTP Referer header
  const referer = req?.headers?.referer;
  if (referer) {
    try {
      const url = new URL(referer);
      if (!url.hostname.includes('backend-one-rho-96') && !url.host.includes(':5000')) {
        return url.origin.replace(/\/+$/, '');
      }
    } catch {
      // ignore parsing error
    }
  }

  // 4. If FRONTEND_URL is explicitly set in environment and not pointing to backend
  if (process.env.FRONTEND_URL && !process.env.FRONTEND_URL.includes('backend-one-rho-96')) {
    return process.env.FRONTEND_URL.replace(/\/+$/, '');
  }

  // 5. Default in production / Vercel: use primary custom domain
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    return 'https://www.sudhiskaenterprises.com';
  }

  // 6. Default in local development
  return 'http://localhost:5173';
};

/**
 * Controller to handle user registration
 * POST /api/register
 */
export const registerUser = async (req, res, next) => {
  try {
    // 1. Validate Form Input
    const { isValid, errors, sanitizedData } = validateRegistrationInput(req.body);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed. Please correct the highlighted errors.',
        errors
      });
    }

    // 2. Check for duplicate Email
    const existingEmail = await Registration.findOne({ email: sanitizedData.email });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'This email address is already registered. Please use another email or contact support.',
        field: 'email'
      });
    }

    // 3. Check for duplicate Mobile Number
    const existingMobile = await Registration.findOne({ mobileNumber: sanitizedData.mobileNumber });
    if (existingMobile) {
      return res.status(409).json({
        success: false,
        message: 'This mobile number is already registered. Please use another mobile number.',
        field: 'mobileNumber'
      });
    }

    // 4. Validate Referrer Code (if provided)
    let validReferrer = null;
    if (sanitizedData.referredBy) {
      const referrer = await Registration.findOne({ referralCode: sanitizedData.referredBy });
      if (referrer) {
        validReferrer = referrer.referralCode;
      }
    }

    // 5. Atomic Sequential Referral Code Generation
    const nextSeq = await Counter.getNextSequence('referralCode');
    const referralCode = `REF${nextSeq}`;

    // Unique Registration ID
    const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase();
    const registrationId = `REG-${nextSeq}-${randomHex}`;

    // 6. Encrypt sensitive banking information
    const encryptedAccountNumber = encrypt(sanitizedData.accountNumber);
    const accountNumberLast4 = sanitizedData.accountNumber.slice(-4);

    // 7. Save to MongoDB
    const registration = new Registration({
      registrationId,
      fullName: sanitizedData.fullName,
      email: sanitizedData.email,
      mobileNumber: sanitizedData.mobileNumber,
      address: sanitizedData.address,
      accountHolderName: sanitizedData.accountHolderName,
      bankName: sanitizedData.bankName,
      encryptedAccountNumber,
      accountNumberLast4,
      ifscCode: sanitizedData.ifscCode,
      branchName: sanitizedData.branchName,
      referralCode,
      referredBy: validReferrer,
      registrationDate: new Date(),
      registrationStatus: 'active'
    });

    await registration.save();

    // 8. Generate dynamic Referral URL and QR Code
    const frontendBase = getBaseUrl(req);
    const referralUrl = `${frontendBase}/?ref=${referralCode}`;
    const qrCodeDataUrl = await generateQRCodeDataUrl(referralUrl);

    // 9. Send Safe Response
    return res.status(201).json({
      success: true,
      message: 'Registration completed successfully! Your unique referral code and QR code have been generated.',
      data: {
        registrationId,
        fullName: registration.fullName,
        email: registration.email,
        mobileNumber: registration.mobileNumber,
        referralCode,
        referralUrl,
        qrCodeDataUrl,
        registrationDate: registration.registrationDate,
        status: registration.registrationStatus
      }
    });
  } catch (error) {
    // Handle MongoDB duplicate key error code 11000 gracefully if race condition occurs
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'credential';
      const fieldLabel = field === 'email' ? 'Email address' : field === 'mobileNumber' ? 'Mobile number' : 'Value';
      return res.status(409).json({
        success: false,
        message: `${fieldLabel} is already registered. Please check your information.`,
        field
      });
    }
    next(error);
  }
};

/**
 * Controller to get public referral information by referral code
 * GET /api/referral/:code
 */
export const getReferralByCode = async (req, res, next) => {
  try {
    const rawCode = (req.params.code || '').trim().toUpperCase();

    if (!rawCode) {
      return res.status(400).json({
        success: false,
        message: 'Referral code parameter is required'
      });
    }

    const registration = await Registration.findOne({ referralCode: rawCode });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: `No active registration found for referral code "${rawCode}"`
      });
    }

    // Dynamic referral URL & QR code
    const frontendBase = getBaseUrl(req);
    const referralUrl = `${frontendBase}/?ref=${registration.referralCode}`;
    const qrCodeDataUrl = await generateQRCodeDataUrl(referralUrl);

    // Strictly return only safe, non-sensitive public information
    return res.status(200).json({
      success: true,
      data: {
        registrationId: registration.registrationId,
        referralCode: registration.referralCode,
        fullName: registration.fullName,
        referralUrl,
        qrCodeDataUrl,
        registrationDate: registration.registrationDate,
        status: registration.registrationStatus
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper to validate if a referral code exists (for referral link auto-fill)
 * GET /api/referral/check/:code
 */
export const checkReferralCode = async (req, res, next) => {
  try {
    const code = (req.params.code || '').trim().toUpperCase();
    if (!code) {
      return res.json({ valid: false, message: 'No referral code provided' });
    }

    const referrer = await Registration.findOne({ referralCode: code });
    if (!referrer) {
      return res.json({ valid: false, message: 'Invalid or expired referral code' });
    }

    return res.json({
      valid: true,
      referralCode: referrer.referralCode,
      referrerName: referrer.fullName
    });
  } catch (error) {
    next(error);
  }
};
