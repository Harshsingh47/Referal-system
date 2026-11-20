import Registration from '../models/Registration.js';
import { decrypt } from '../utils/encryption.js';
import { generateAdminToken } from '../middleware/adminAuth.js';
import { generateQRCodeDataUrl } from '../utils/qrcode.js';
import { getBaseUrl } from './referralController.js';

/**
 * Admin Login
 * POST /api/admin/login
 */
export const adminLogin = async (req, res, next) => {
  try {
    const { username, password } = req.body || {};

    const configuredUsername = process.env.ADMIN_USERNAME || 'admin';
    const configuredPassword = process.env.ADMIN_PASSWORD || 'admin@sudhiska2026!';

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    if (username.trim() !== configuredUsername || password !== configuredPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin username or password'
      });
    }

    const token = generateAdminToken(username.trim());

    return res.status(200).json({
      success: true,
      message: 'Admin authentication successful',
      token,
      admin: {
        username: configuredUsername,
        role: 'Administrator'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all registered users with search, filter, and pagination
 * GET /api/admin/registrations
 */
export const getRegistrations = async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 25 } = req.query;

    const query = {};

    // Filter by status
    if (status && status !== 'all') {
      query.registrationStatus = status.toLowerCase();
    }

    // Search across Name, Email, Mobile, Referral Code, Referred By, ID
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { fullName: regex },
        { email: regex },
        { mobileNumber: regex },
        { referralCode: regex },
        { referredBy: regex },
        { registrationId: regex },
        { bankName: regex },
        { accountHolderName: regex }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));
    const skip = (pageNum - 1) * limitNum;

    const [total, registrations] = await Promise.all([
      Registration.countDocuments(query),
      Registration.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean()
    ]);

    // Format safe response with masked bank account
    const formatted = registrations.map((doc) => ({
      _id: doc._id,
      registrationId: doc.registrationId,
      fullName: doc.fullName,
      email: doc.email,
      mobileNumber: doc.mobileNumber,
      address: doc.address || '',
      accountHolderName: doc.accountHolderName,
      bankName: doc.bankName,
      accountNumberMasked: `•••• •••• ${doc.accountNumberLast4 || '••••'}`,
      accountNumberLast4: doc.accountNumberLast4,
      ifscCode: doc.ifscCode,
      branchName: doc.branchName || '',
      referralCode: doc.referralCode,
      referredBy: doc.referredBy || null,
      registrationDate: doc.registrationDate || doc.createdAt,
      status: doc.registrationStatus || 'active'
    }));

    return res.status(200).json({
      success: true,
      data: formatted,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 1
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get detailed partner information including dynamic QR code
 * GET /api/admin/registrations/:id
 */
export const getRegistrationDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const registration = await Registration.findById(id);

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    const frontendBase = getBaseUrl(req);
    const referralUrl = `${frontendBase}/?ref=${registration.referralCode}`;
    const qrCodeDataUrl = await generateQRCodeDataUrl(referralUrl);

    // Count how many people registered using this person's referral code
    const referralsCount = await Registration.countDocuments({
      referredBy: registration.referralCode
    });

    return res.status(200).json({
      success: true,
      data: {
        _id: registration._id,
        registrationId: registration.registrationId,
        fullName: registration.fullName,
        email: registration.email,
        mobileNumber: registration.mobileNumber,
        address: registration.address,
        accountHolderName: registration.accountHolderName,
        bankName: registration.bankName,
        accountNumberMasked: `•••• •••• ${registration.accountNumberLast4}`,
        accountNumberLast4: registration.accountNumberLast4,
        ifscCode: registration.ifscCode,
        branchName: registration.branchName,
        referralCode: registration.referralCode,
        referredBy: registration.referredBy,
        registrationDate: registration.registrationDate,
        status: registration.registrationStatus,
        referralUrl,
        qrCodeDataUrl,
        referralsCount
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Securely decrypt and reveal full bank account number for authorized admin
 * GET /api/admin/registrations/:id/account-number
 */
export const revealAccountNumber = async (req, res, next) => {
  try {
    const { id } = req.params;
    const registration = await Registration.findById(id).select('+encryptedAccountNumber');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration record not found'
      });
    }

    const decrypted = decrypt(registration.encryptedAccountNumber);

    if (!decrypted) {
      return res.status(500).json({
        success: false,
        message: 'Failed to decrypt account number'
      });
    }

    return res.status(200).json({
      success: true,
      registrationId: registration.registrationId,
      fullName: registration.fullName,
      bankName: registration.bankName,
      accountNumber: decrypted
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update registration status (active, verified, pending, suspended)
 * PATCH /api/admin/registrations/:id/status
 */
export const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['active', 'verified', 'pending', 'suspended'];
    if (!status || !validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const updated = await Registration.findByIdAndUpdate(
      id,
      { registrationStatus: status.toLowerCase() },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Registration record not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: `Status updated to ${updated.registrationStatus}`,
      status: updated.registrationStatus
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get overall admin dashboard analytics
 * GET /api/admin/stats
 */
export const getAdminStats = async (req, res, next) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [totalPartners, todayPartners, verifiedCount, referredPartnersCount] = await Promise.all([
      Registration.countDocuments({}),
      Registration.countDocuments({ createdAt: { $gte: startOfToday } }),
      Registration.countDocuments({ registrationStatus: 'verified' }),
      Registration.countDocuments({ referredBy: { $ne: null } })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalPartners,
        todayPartners,
        verifiedCount,
        referredPartnersCount
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Export registrations as CSV
 * GET /api/admin/export
 */
export const exportRegistrationsCsv = async (req, res, next) => {
  try {
    const registrations = await Registration.find({}).sort({ createdAt: -1 }).lean();

    const headers = [
      'Registration ID',
      'Full Name',
      'Email',
      'Mobile Number',
      'Address',
      'Bank Name',
      'Account Holder',
      'IFSC Code',
      'Branch',
      'Masked Account',
      'Referral Code',
      'Referred By',
      'Status',
      'Registration Date'
    ];

    const escapeCsv = (str) => {
      if (!str) return '""';
      const clean = String(str).replace(/"/g, '""');
      return `"${clean}"`;
    };

    const rows = registrations.map((r) => [
      escapeCsv(r.registrationId),
      escapeCsv(r.fullName),
      escapeCsv(r.email),
      escapeCsv(r.mobileNumber),
      escapeCsv(r.address),
      escapeCsv(r.bankName),
      escapeCsv(r.accountHolderName),
      escapeCsv(r.ifscCode),
      escapeCsv(r.branchName),
      escapeCsv(`•••• ${r.accountNumberLast4}`),
      escapeCsv(r.referralCode),
      escapeCsv(r.referredBy || 'None'),
      escapeCsv(r.registrationStatus),
      escapeCsv(r.registrationDate ? new Date(r.registrationDate).toISOString() : '')
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=referral_registrations_${Date.now()}.csv`);
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};
