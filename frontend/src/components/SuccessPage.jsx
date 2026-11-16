import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Copy,
  Check,
  Download,
  Share2,
  QrCode,
  ShieldCheck,
  UserPlus,
  ArrowLeft,
  Calendar,
  Hash,
  ExternalLink
} from 'lucide-react';
import CompanyQrCard from './CompanyQrCard';

export default function SuccessPage({ data, onNewRegistration, onShowToast }) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Trigger celebration confetti on mount
  useEffect(() => {
    try {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // Graceful fallback if canvas-confetti is unavailable
    }
  }, []);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(data.referralCode);
      setCopiedCode(true);
      onShowToast(`Referral Code ${data.referralCode} copied to clipboard!`, 'success');
      setTimeout(() => setCopiedCode(false), 2500);
    } catch (err) {
      onShowToast('Could not copy automatically. Please select and copy.', 'error');
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(data.referralUrl);
      setCopiedLink(true);
      onShowToast('Referral link copied to clipboard!', 'success');
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (err) {
      onShowToast('Could not copy automatically. Please select and copy.', 'error');
    }
  };

  const handleDownloadQR = () => {
    if (!data.qrCodeDataUrl) return;
    try {
      const link = document.createElement('a');
      link.href = data.qrCodeDataUrl;
      link.download = `referral-qr-${data.referralCode}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onShowToast('QR Code image downloaded successfully!', 'success');
    } catch (err) {
      console.error('Download error:', err);
      onShowToast('Failed to download QR code image.', 'error');
    }
  };

  // WhatsApp share link
  const whatsappText = encodeURIComponent(
    `Join using my official referral link: ${data.referralUrl}\nReferral Code: ${data.referralCode}`
  );
  const whatsappUrl = `https://api.whatsapp.com/send?text=${whatsappText}`;

  // Email share link
  const emailSubject = encodeURIComponent(`Exclusive Invitation - Referral Code ${data.referralCode}`);
  const emailBody = encodeURIComponent(
    `Hello,\n\nI have registered as an official partner. You can join using my referral link:\n${data.referralUrl}\n\nReferral Code: ${data.referralCode}\n\nBest regards,\n${data.fullName}`
  );
  const emailUrl = `mailto:?subject=${emailSubject}&body=${emailBody}`;

  const formattedDate = data.registrationDate
    ? new Date(data.registrationDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    : new Date().toLocaleDateString('en-IN');

  return (
    <div className="success-container">
      {/* HERO SECTION */}
      <div className="success-hero">
        <div className="success-badge-icon">
          <CheckCircle2 size={36} />
        </div>
        <h2 className="success-title">Registration Successful!</h2>
        <p className="success-lead">
          Welcome aboard, <strong>{data.fullName}</strong>. Your account has been verified, and your exclusive referral code and QR code are ready for use.
        </p>
      </div>

      {/* REFERRAL CARD */}
      <div className="referral-showcase">
        {/* Dark Header with Unique Referral Code */}
        <div className="referral-highlight-box">
          <p className="referral-code-label">Your Unique Referral Code</p>
          <div className="referral-code-display">
            <span className="referral-code-text">{data.referralCode}</span>
            <button
              type="button"
              className={`copy-icon-btn ${copiedCode ? 'copied' : ''}`}
              onClick={handleCopyCode}
              title="Copy Referral Code"
            >
              {copiedCode ? (
                <>
                  <Check size={16} />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={16} />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>
          <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: 0 }}>
            Share this code or your personalized QR code below with friends and colleagues.
          </p>
        </div>

        {/* QR Code and Actions */}
        <div className="qr-section">
          <div className="qr-frame">
            <img
              src={data.qrCodeDataUrl}
              alt={`QR Code for Referral ${data.referralCode}`}
              className="qr-image"
            />
          </div>

          <div className="qr-actions">
            <button
              type="button"
              className="btn-primary"
              onClick={handleDownloadQR}
            >
              <Download size={18} />
              <span>Download QR Code (PNG)</span>
            </button>

            <button
              type="button"
              className="btn-secondary"
              onClick={handleCopyLink}
            >
              {copiedLink ? <Check size={18} color="#10b981" /> : <Copy size={18} />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Referral Link'}</span>
            </button>
          </div>

          {/* Referral Link Copy Bar */}
          <div className="link-share-box">
            <input
              type="text"
              readOnly
              value={data.referralUrl}
              className="link-input"
              onClick={(e) => e.target.select()}
            />
            <button
              type="button"
              className="btn-secondary"
              style={{ height: '36px', padding: '0 12px', fontSize: '0.8rem' }}
              onClick={handleCopyLink}
            >
              <Copy size={14} />
              <span>Copy</span>
            </button>
          </div>

          {/* Direct Social Share Buttons */}
          <div className="social-share-bar">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="social-btn whatsapp"
            >
              <Share2 size={15} />
              <span>Share on WhatsApp</span>
            </a>

            <a
              href={emailUrl}
              className="social-btn email"
            >
              <span>Share via Email</span>
            </a>
          </div>
        </div>

        {/* Safe Registration Metadata Summary */}
        <div className="summary-meta-grid">
          <div className="meta-item">
            <span className="meta-label">Registration ID</span>
            <span className="meta-val" style={{ fontFamily: 'var(--font-mono)' }}>
              {data.registrationId || `REG-${data.referralCode}`}
            </span>
          </div>

          <div className="meta-item">
            <span className="meta-label">Registered Date</span>
            <span className="meta-val">{formattedDate}</span>
          </div>

          <div className="meta-item">
            <span className="meta-label">Account Status</span>
            <span className="meta-val" style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
              Active
            </span>
          </div>
        </div>
      </div>

      {/* Security Reassurance Callout */}
      <div className="security-callout" style={{ marginBottom: '28px' }}>
        <ShieldCheck size={20} className="security-icon" color="#10b981" />
        <div className="security-text">
          <h4>Banking Details Stored Privately</h4>
          <p>
            Your bank account information has been securely encrypted with AES-256. Neither your account number nor any personal financial details are embedded in the QR code or the referral URL.
          </p>
        </div>
      </div>

      {/* Official Enterprise UPI QR Code */}
      <div style={{ marginBottom: '28px' }}>
        <CompanyQrCard onShowToast={onShowToast} title="Official Enterprise Payment & Support QR Code" />
      </div>

      {/* Action Footer */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '14px' }}>
        <button
          type="button"
          className="btn-secondary"
          onClick={onNewRegistration}
        >
          <UserPlus size={16} />
          <span>Register Another User</span>
        </button>
      </div>
    </div>
  );
}
