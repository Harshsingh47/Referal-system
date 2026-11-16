import React, { useState } from 'react';
import { Copy, Check, QrCode, ShieldCheck, Download, Smartphone } from 'lucide-react';

export default function CompanyQrCard({ onShowToast, title = "Official Verification & Payment QR Code" }) {
  const [copiedUpi, setCopiedUpi] = useState(false);
  const upiId = "hp24vh-9@okaxis";
  const qrImageSrc = "/siddhiksha-upi-qr.jpg";

  const handleCopyUpi = async () => {
    try {
      await navigator.clipboard.writeText(upiId);
      setCopiedUpi(true);
      if (onShowToast) {
        onShowToast(`UPI ID "${upiId}" copied to clipboard!`, 'success');
      }
      setTimeout(() => setCopiedUpi(false), 2500);
    } catch (err) {
      if (onShowToast) {
        onShowToast(`UPI ID: ${upiId}`, 'info');
      }
    }
  };

  const handleDownloadQr = () => {
    try {
      const link = document.createElement('a');
      link.href = qrImageSrc;
      link.download = "siddhiksha-enterprises-upi-qr.jpg";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (onShowToast) {
        onShowToast("Company QR Code downloaded successfully!", 'success');
      }
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  return (
    <div className="company-qr-card">
      <div className="company-qr-header">
        <div className="company-badge">
          <ShieldCheck size={16} />
          <span>Official Company QR Code</span>
        </div>
        <h3 className="company-qr-title">{title}</h3>
        <p className="company-qr-subtitle">
          SIDDHIKSHA ENTERPRISES official Google Pay / UPI account for registration verification & settlements
        </p>
      </div>

      <div className="company-qr-body">
        <div className="company-qr-frame">
          <img
            src={qrImageSrc}
            alt="Siddhiksha Enterprises UPI QR Code"
            className="company-qr-img"
          />
        </div>

        <div className="company-upi-details">
          <div className="company-name-tag">SIDDHIKSHA ENTERPRISES</div>

          <div className="upi-id-box">
            <div className="upi-id-text-wrap">
              <span className="upi-label">UPI ID</span>
              <span className="upi-value">{upiId}</span>
            </div>

            <button
              type="button"
              className={`copy-upi-btn ${copiedUpi ? 'copied' : ''}`}
              onClick={handleCopyUpi}
              title="Copy UPI ID"
            >
              {copiedUpi ? (
                <>
                  <Check size={14} />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy UPI</span>
                </>
              )}
            </button>
          </div>

          <div className="upi-apps-hint">
            <Smartphone size={15} color="#2563eb" />
            <span>Scan with Google Pay, PhonePe, Paytm, or any UPI app</span>
          </div>

          <div style={{ marginTop: '12px' }}>
            <button
              type="button"
              className="btn-secondary"
              style={{ width: '100%', height: '38px', fontSize: '0.85rem' }}
              onClick={handleDownloadQr}
            >
              <Download size={14} />
              <span>Download Payment QR</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
