import React, { useState } from 'react';
import { Search, QrCode, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { getReferralByCode } from '../api/client';

export default function ReferralLookup({ onFoundReferral, onBackToRegister, onShowToast }) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();

    if (!cleanCode) {
      setError('Please enter a referral code');
      return;
    }

    if (!/^REF\d{5,}$/.test(cleanCode)) {
      setError('Invalid referral code format. Example: REF10001');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await getReferralByCode(cleanCode);
      if (response.success && response.data) {
        onFoundReferral(response.data);
      } else {
        throw new Error(response.message || 'Referral not found');
      }
    } catch (err) {
      setError(err.message || `No registration found for referral code ${cleanCode}`);
      onShowToast(err.message || 'Referral code not found', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="form-card" style={{ maxWidth: '580px', margin: '0 auto' }}>
      <div className="form-card-header">
        <h2 className="form-title">Find Your Referral QR Code</h2>
        <p className="form-subtitle">
          Already registered? Enter your Referral Code below to view, copy, and download your personal QR code without submitting the registration form again.
        </p>
      </div>

      <div style={{ padding: '28px 32px' }}>
        {error && (
          <div className="alert-box alert-error" style={{ marginBottom: '20px' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSearch}>
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label htmlFor="lookupCode" className="form-label">
              <span>Referral Code <span className="label-required">*</span></span>
            </label>
            <div className="input-container">
              <span className="input-icon-left">
                <Search size={18} />
              </span>
              <input
                id="lookupCode"
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
                  setError('');
                }}
                placeholder="e.g. REF10001"
                maxLength={12}
                className="input-field font-mono"
                style={{ fontSize: '1.1rem', letterSpacing: '1px' }}
                autoFocus
              />
            </div>
            <p className="field-hint-msg">
              Enter the unique REF code provided on your registration success screen.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              type="submit"
              disabled={isLoading || !code.trim()}
              className="btn-primary"
            >
              {isLoading ? (
                <>
                  <div className="spinner" />
                  <span>Retrieving QR Code...</span>
                </>
              ) : (
                <>
                  <span>Retrieve My QR Code</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            <button
              type="button"
              className="btn-secondary"
              onClick={onBackToRegister}
            >
              <ArrowLeft size={16} />
              <span>Back to Registration Form</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
