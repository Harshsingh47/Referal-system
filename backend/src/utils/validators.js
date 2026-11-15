import validator from 'validator';

/**
 * Standard Indian IFSC Code regex:
 * - 4 letters (Bank code)
 * - 5th character is '0' (reserved for future use)
 * - 6 alphanumeric characters (Branch code)
 */
export const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

/**
 * Standard Indian Mobile Number regex:
 * 10 digits starting with 6, 7, 8, or 9
 */
export const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

/**
 * Standard Bank Account Number regex:
 * 9 to 18 digits (standard across Indian banks e.g. SBI, HDFC, ICICI, PNB)
 */
export const BANK_ACCOUNT_REGEX = /^\d{9,18}$/;

/**
 * Normalize Indian mobile number by removing +91, 0 prefix, spaces, and hyphens
 * @param {string} phone
 * @returns {string} 10-digit phone string
 */
export const normalizeMobileNumber = (phone) => {
  if (!phone) return '';
  let cleaned = String(phone).replace(/[\s\-\(\)]/g, '');
  if (cleaned.startsWith('+91')) {
    cleaned = cleaned.slice(3);
  } else if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.slice(2);
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.slice(1);
  }
  return cleaned;
};

/**
 * Validate registration input data
 * @param {Object} data 
 * @returns {Object} { isValid: boolean, errors: Object, sanitizedData: Object }
 */
export const validateRegistrationInput = (data) => {
  const errors = {};
  const sanitized = {};

  // Full Name
  const fullName = typeof data.fullName === 'string' ? data.fullName.trim() : '';
  if (!fullName) {
    errors.fullName = 'Full Name is required';
  } else if (fullName.length < 2 || fullName.length > 70) {
    errors.fullName = 'Full Name must be between 2 and 70 characters';
  } else if (!/^[a-zA-Z\s\.\'\-]+$/.test(fullName)) {
    errors.fullName = 'Full Name can only contain letters, spaces, dots, and hyphens';
  }
  sanitized.fullName = fullName;

  // Email
  const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
  if (!email) {
    errors.email = 'Email Address is required';
  } else if (!validator.isEmail(email)) {
    errors.email = 'Please provide a valid email address';
  }
  sanitized.email = email;

  // Mobile Number
  const rawMobile = typeof data.mobileNumber === 'string' ? data.mobileNumber.trim() : '';
  const normalizedMobile = normalizeMobileNumber(rawMobile);
  if (!rawMobile) {
    errors.mobileNumber = 'Mobile Number is required';
  } else if (!INDIAN_MOBILE_REGEX.test(normalizedMobile)) {
    errors.mobileNumber = 'Please provide a valid 10-digit Indian mobile number (starts with 6-9)';
  }
  sanitized.mobileNumber = normalizedMobile;

  // Address (Optional)
  const address = typeof data.address === 'string' ? data.address.trim() : '';
  if (address.length > 300) {
    errors.address = 'Address cannot exceed 300 characters';
  }
  sanitized.address = address;

  // Bank Account Holder Name
  const accountHolderName = typeof data.accountHolderName === 'string' ? data.accountHolderName.trim() : '';
  if (!accountHolderName) {
    errors.accountHolderName = 'Account Holder Name is required';
  } else if (accountHolderName.length < 2 || accountHolderName.length > 70) {
    errors.accountHolderName = 'Account Holder Name must be between 2 and 70 characters';
  } else if (!/^[a-zA-Z\s\.\'\-]+$/.test(accountHolderName)) {
    errors.accountHolderName = 'Account Holder Name can only contain letters, spaces, dots, and hyphens';
  }
  sanitized.accountHolderName = accountHolderName;

  // Bank Name
  const bankName = typeof data.bankName === 'string' ? data.bankName.trim() : '';
  if (!bankName) {
    errors.bankName = 'Bank Name is required';
  } else if (bankName.length < 2 || bankName.length > 100) {
    errors.bankName = 'Bank Name must be between 2 and 100 characters';
  }
  sanitized.bankName = bankName;

  // Account Number
  const accountNumber = typeof data.accountNumber === 'string' ? data.accountNumber.trim() : '';
  if (!accountNumber) {
    errors.accountNumber = 'Account Number is required';
  } else if (!BANK_ACCOUNT_REGEX.test(accountNumber)) {
    errors.accountNumber = 'Account Number must be between 9 and 18 numeric digits';
  }
  sanitized.accountNumber = accountNumber;

  // Confirm Account Number
  const confirmAccountNumber = typeof data.confirmAccountNumber === 'string' ? data.confirmAccountNumber.trim() : '';
  if (!confirmAccountNumber) {
    errors.confirmAccountNumber = 'Please confirm your Account Number';
  } else if (accountNumber && confirmAccountNumber !== accountNumber) {
    errors.confirmAccountNumber = 'Account Number and Confirm Account Number do not match';
  }

  // IFSC Code
  const rawIfsc = typeof data.ifscCode === 'string' ? data.ifscCode.trim().toUpperCase() : '';
  if (!rawIfsc) {
    errors.ifscCode = 'IFSC Code is required';
  } else if (!IFSC_REGEX.test(rawIfsc)) {
    errors.ifscCode = 'Invalid IFSC code format (e.g. SBIN0001234, HDFC0001234)';
  }
  sanitized.ifscCode = rawIfsc;

  // Branch Name (Optional)
  const branchName = typeof data.branchName === 'string' ? data.branchName.trim() : '';
  if (branchName.length > 100) {
    errors.branchName = 'Branch Name cannot exceed 100 characters';
  }
  sanitized.branchName = branchName;

  // Referred By (Optional)
  const referredBy = typeof data.referredBy === 'string' ? data.referredBy.trim().toUpperCase() : '';
  if (referredBy && !/^REF\d{5,}$/.test(referredBy)) {
    errors.referredBy = 'Invalid referral code format (expected REF followed by numbers, e.g. REF10001)';
  }
  sanitized.referredBy = referredBy || null;

  // Privacy Policy & Consent
  if (data.consent !== true && data.consent !== 'true') {
    errors.consent = 'You must accept the Privacy Policy and terms to register';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitizedData: sanitized
  };
};
