import React from 'react';
import { X, ShieldCheck, Lock, FileText } from 'lucide-react';

export default function TermsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={20} color="#2563eb" />
            <h3>Privacy Policy & Consent Agreement</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#eff6ff', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>
            <Lock size={22} color="#2563eb" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: '0.82rem', color: '#1e40af', margin: 0 }}>
              Your privacy and financial security are our top priorities. All bank account numbers are protected using 256-bit AES authenticated encryption.
            </p>
          </div>

          <h4>1. Information We Collect</h4>
          <p>
            When registering on our referral platform, we collect personal contact details (Full Name, Email Address, Mobile Number, Address) and banking verification details (Account Holder Name, Bank Name, Account Number, IFSC Code).
          </p>

          <h4>2. Bank Account Security & AES-256 Encryption</h4>
          <p>
            We strictly enforce bank-grade security protocols. Bank account numbers are immediately encrypted at rest using AES-256-GCM. Decryption keys are isolated in secure environment variables.
          </p>

          <h4>3. Public Referral System & QR Codes</h4>
          <p>
            Your unique Referral Code (e.g., REF10001) and generated QR code only encode your referral registration link. Under no circumstances is your personal or banking information embedded in the QR code or accessible through public referral endpoints.
          </p>

          <h4>4. Purpose of Collection</h4>
          <p>
            The collected information is used solely for identity verification, referral attribution, and future settlement compliance. We do not sell or lease your personal information to third parties.
          </p>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close & Return
          </button>
        </div>
      </div>
    </div>
  );
}
