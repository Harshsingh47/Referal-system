import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  CreditCard,
  KeyRound,
  ShieldCheck,
  Lock,
  ArrowRight,
  AlertTriangle,
  Gift,
  CheckCircle2
} from 'lucide-react';
import InputField from './InputField';
import { registerUser, checkReferralCode } from '../api/client';

export const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;
export const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export default function RegistrationForm({ onRegistrationSuccess, initialReferralCode, onShowToast, onOpenTerms }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobileNumber: '',
    address: '',
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    branchName: '',
    referredBy: initialReferralCode || '',
    consent: false
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [referrerDetails, setReferrerDetails] = useState(null);

  // Auto-detect & validate referredBy if provided in query params or changed
  useEffect(() => {
    if (formData.referredBy && formData.referredBy.length >= 6) {
      checkReferralCode(formData.referredBy)
        .then((res) => {
          if (res.valid) {
            setReferrerDetails(res);
          } else {
            setReferrerDetails(null);
          }
        })
        .catch(() => setReferrerDetails(null));
    } else {
      setReferrerDetails(null);
    }
  }, [formData.referredBy]);

  // Validation function
  const validateField = (name, value, allValues = formData) => {
    let error = '';

    switch (name) {
      case 'fullName':
        if (!value.trim()) {
          error = 'Full Name is required';
        } else if (value.trim().length < 2) {
          error = 'Full Name must be at least 2 characters';
        } else if (!/^[a-zA-Z\s\.\'\-]+$/.test(value.trim())) {
          error = 'Full Name can only contain letters and spaces';
        }
        break;

      case 'email':
        if (!value.trim()) {
          error = 'Email Address is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          error = 'Please enter a valid email address';
        }
        break;

      case 'mobileNumber': {
        const cleaned = value.replace(/\D/g, '');
        if (!cleaned) {
          error = 'Mobile Number is required';
        } else if (cleaned.length !== 10) {
          error = 'Mobile Number must be exactly 10 digits';
        } else if (!INDIAN_MOBILE_REGEX.test(cleaned)) {
          error = 'Indian mobile number must start with 6, 7, 8, or 9';
        }
        break;
      }

      case 'accountHolderName':
        if (!value.trim()) {
          error = 'Account Holder Name is required';
        } else if (value.trim().length < 2) {
          error = 'Account Holder Name must be at least 2 characters';
        }
        break;

      case 'bankName':
        if (!value.trim()) {
          error = 'Bank Name is required';
        }
        break;

      case 'accountNumber':
        if (!value) {
          error = 'Account Number is required';
        } else if (!/^\d{9,18}$/.test(value)) {
          error = 'Account Number must be between 9 and 18 digits';
        }
        break;

      case 'confirmAccountNumber':
        if (!value) {
          error = 'Please confirm your Account Number';
        } else if (value !== allValues.accountNumber) {
          error = 'Account numbers do not match';
        }
        break;

      case 'ifscCode': {
        const upper = value.trim().toUpperCase();
        if (!upper) {
          error = 'IFSC Code is required';
        } else if (!IFSC_REGEX.test(upper)) {
          error = 'Invalid IFSC code (e.g. SBIN0001234, 11 characters)';
        }
        break;
      }

      case 'consent':
        if (!value) {
          error = 'You must accept the terms & privacy policy to register';
        }
        break;

      default:
        break;
    }

    return error;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let val = type === 'checkbox' ? checked : value;

    // Auto formatting for specific fields
    if (name === 'mobileNumber') {
      val = val.replace(/\D/g, '').slice(0, 10);
    } else if (name === 'accountNumber' || name === 'confirmAccountNumber') {
      val = val.replace(/\D/g, '').slice(0, 18);
    } else if (name === 'ifscCode') {
      val = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
    } else if (name === 'referredBy') {
      val = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
    }

    const updatedFormData = { ...formData, [name]: val };
    setFormData(updatedFormData);

    // Live validation if field was touched
    if (touched[name]) {
      const err = validateField(name, val, updatedFormData);
      setErrors((prev) => ({ ...prev, [name]: err }));
    }

    // Also revalidate confirmAccountNumber when accountNumber changes
    if (name === 'accountNumber' && touched.confirmAccountNumber) {
      const confirmErr = validateField('confirmAccountNumber', formData.confirmAccountNumber, updatedFormData);
      setErrors((prev) => ({ ...prev, confirmAccountNumber: confirmErr }));
    }
  };

  const handleBlur = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const err = validateField(name, val, formData);
    setErrors((prev) => ({ ...prev, [name]: err }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    // Mark all required fields as touched
    const allFields = [
      'fullName',
      'email',
      'mobileNumber',
      'accountHolderName',
      'bankName',
      'accountNumber',
      'confirmAccountNumber',
      'ifscCode',
      'consent'
    ];

    const newTouched = {};
    const newErrors = {};

    allFields.forEach((field) => {
      newTouched[field] = true;
      const err = validateField(field, formData[field], formData);
      if (err) newErrors[field] = err;
    });

    setTouched((prev) => ({ ...prev, ...newTouched }));
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      onShowToast('Please fix the errors in the form before submitting.', 'error');
      // Scroll to the first error field
      const firstErrorField = Object.keys(newErrors)[0];
      const element = document.getElementsByName(firstErrorField)[0];
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await registerUser(formData);
      if (response.success && response.data) {
        onRegistrationSuccess(response.data);
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (err) {
      console.error('Registration failed:', err);
      const message = err.message || 'Failed to complete registration. Please try again.';
      setServerError(message);

      if (err.field) {
        setErrors((prev) => ({ ...prev, [err.field]: message }));
      }
      onShowToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="form-card">
      <div className="form-card-header">
        <h2 className="form-title">Referral Partner Registration</h2>
        <p className="form-subtitle">
          Submit your personal and verified banking information to receive your instant referral code and personalized QR code.
        </p>
      </div>

      {referrerDetails && (
        <div className="referrer-banner">
          <Gift size={20} color="#2563eb" />
          <div>
            <strong>Referred By: {referrerDetails.referrerName}</strong> ({referrerDetails.referralCode})
            <p style={{ fontSize: '0.78rem', color: '#1e40af', margin: 0 }}>
              You will be connected under this referral code upon registration.
            </p>
          </div>
        </div>
      )}

      {serverError && (
        <div style={{ margin: '20px 32px 0 32px' }} className="alert-box alert-error">
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* SECTION 1: PERSONAL INFORMATION */}
        <div className="form-section">
          <div className="section-title-wrap">
            <div className="section-icon-badge">
              <User size={18} />
            </div>
            <h3 className="section-title">Personal Information</h3>
            <span className="section-hint">Step 1 of 2</span>
          </div>

          <div className="grid-2">
            <InputField
              label="Full Name"
              name="fullName"
              placeholder="e.g. Rajesh Kumar"
              value={formData.fullName}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              icon={User}
              error={touched.fullName ? errors.fullName : ''}
              isValid={touched.fullName && !errors.fullName && !!formData.fullName}
              autoComplete="name"
            />

            <InputField
              label="Email Address"
              name="email"
              type="email"
              placeholder="e.g. rajesh.kumar@example.com"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              icon={Mail}
              error={touched.email ? errors.email : ''}
              isValid={touched.email && !errors.email && !!formData.email}
              autoComplete="email"
            />
          </div>

          <div className="grid-2" style={{ marginTop: '20px' }}>
            <InputField
              label="Mobile Number (India)"
              name="mobileNumber"
              type="tel"
              placeholder="10-digit mobile number"
              value={formData.mobileNumber}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              maxLength={10}
              icon={Phone}
              fontMono
              hint="Indian 10-digit number starting with 6, 7, 8, or 9"
              error={touched.mobileNumber ? errors.mobileNumber : ''}
              isValid={touched.mobileNumber && !errors.mobileNumber && !!formData.mobileNumber}
              autoComplete="tel"
            />

            <InputField
              label="Referral Code (If referred by friend)"
              name="referredBy"
              placeholder="e.g. REF10001"
              value={formData.referredBy}
              onChange={handleChange}
              onBlur={handleBlur}
              optional
              maxLength={12}
              fontMono
              icon={Gift}
              hint={referrerDetails ? `✓ Valid referrer: ${referrerDetails.referrerName}` : 'Optional referral code'}
              error={touched.referredBy ? errors.referredBy : ''}
              isValid={!!referrerDetails}
            />
          </div>

          <div className="grid-full">
            <InputField
              label="Complete Residential Address"
              name="address"
              placeholder="House/Flat No., Street, City, State, PIN code"
              value={formData.address}
              onChange={handleChange}
              onBlur={handleBlur}
              optional
              icon={MapPin}
              error={touched.address ? errors.address : ''}
              autoComplete="street-address"
            />
          </div>
        </div>

        {/* SECTION 2: BANK ACCOUNT INFORMATION */}
        <div className="form-section">
          <div className="section-title-wrap">
            <div className="section-icon-badge" style={{ background: '#ecfdf5', color: '#059669' }}>
              <Building size={18} />
            </div>
            <h3 className="section-title">Bank Account Details</h3>
            <span className="section-hint">Step 2 of 2</span>
          </div>

          <div className="grid-2">
            <InputField
              label="Account Holder Name"
              name="accountHolderName"
              placeholder="As printed in bank passbook"
              value={formData.accountHolderName}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              icon={User}
              error={touched.accountHolderName ? errors.accountHolderName : ''}
              isValid={touched.accountHolderName && !errors.accountHolderName && !!formData.accountHolderName}
            />

            <InputField
              label="Bank Name"
              name="bankName"
              placeholder="e.g. State Bank of India, HDFC Bank"
              value={formData.bankName}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              icon={Building}
              error={touched.bankName ? errors.bankName : ''}
              isValid={touched.bankName && !errors.bankName && !!formData.bankName}
            />
          </div>

          <div className="grid-2" style={{ marginTop: '20px' }}>
            <InputField
              label="Bank Account Number"
              name="accountNumber"
              placeholder="9 to 18 digits account number"
              value={formData.accountNumber}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              maxLength={18}
              fontMono
              icon={CreditCard}
              allowToggleVisibility
              error={touched.accountNumber ? errors.accountNumber : ''}
              isValid={touched.accountNumber && !errors.accountNumber && !!formData.accountNumber}
            />

            <InputField
              label="Confirm Account Number"
              name="confirmAccountNumber"
              placeholder="Re-enter account number"
              value={formData.confirmAccountNumber}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              maxLength={18}
              fontMono
              icon={CreditCard}
              allowToggleVisibility
              error={touched.confirmAccountNumber ? errors.confirmAccountNumber : ''}
              isValid={
                touched.confirmAccountNumber &&
                !errors.confirmAccountNumber &&
                !!formData.confirmAccountNumber &&
                formData.confirmAccountNumber === formData.accountNumber
              }
            />
          </div>

          <div className="grid-2" style={{ marginTop: '20px' }}>
            <InputField
              label="IFSC Code"
              name="ifscCode"
              placeholder="e.g. SBIN0001234"
              value={formData.ifscCode}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              maxLength={11}
              fontMono
              icon={KeyRound}
              hint="11 alphanumeric characters (4 letters, 0, 6 characters)"
              error={touched.ifscCode ? errors.ifscCode : ''}
              isValid={touched.ifscCode && !errors.ifscCode && !!formData.ifscCode}
            />

            <InputField
              label="Branch Name"
              name="branchName"
              placeholder="e.g. MG Road Branch"
              value={formData.branchName}
              onChange={handleChange}
              onBlur={handleBlur}
              optional
              icon={Building}
              error={touched.branchName ? errors.branchName : ''}
            />
          </div>

          {/* Security Assurance Callout */}
          <div className="security-callout">
            <ShieldCheck size={20} className="security-icon" color="#2563eb" />
            <div className="security-text">
              <h4>Bank-Grade Data Encryption (AES-256)</h4>
              <p>
                Your bank account number is immediately encrypted with military-grade AES-256 before being stored in MongoDB Atlas. It is never exposed in public referral APIs or QR code links.
              </p>
            </div>
          </div>

          {/* Consent Checkbox */}
          <div className="consent-wrapper">
            <label className="consent-label">
              <input
                type="checkbox"
                name="consent"
                checked={formData.consent}
                onChange={handleChange}
                className="consent-checkbox"
              />
              <span className="consent-text">
                I hereby declare that the personal and bank account details provided above are accurate and belong to me. I agree to the{' '}
                <span className="consent-link" onClick={(e) => { e.preventDefault(); onOpenTerms(); }}>
                  Privacy Policy & Banking Data Terms
                </span>{' '}
                and consent to automated referral code and QR code generation.
              </span>
            </label>
            {touched.consent && errors.consent && (
              <p className="field-error-msg" style={{ marginTop: '8px' }}>
                <AlertTriangle size={14} />
                <span>{errors.consent}</span>
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div style={{ marginTop: '28px' }}>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
            >
              {isSubmitting ? (
                <>
                  <div className="spinner" />
                  <span>Encrypting & Registering...</span>
                </>
              ) : (
                <>
                  <span>Complete Registration & Generate QR Code</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
