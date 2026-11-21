import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import RegistrationForm from './components/RegistrationForm';
import SuccessPage from './components/SuccessPage';
import ReferralLookup from './components/ReferralLookup';
import TermsModal from './components/TermsModal';
import Toast from './components/Toast';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import { getReferralByCode } from './api/client';

export default function App() {
  const [currentView, setCurrentView] = useState('register'); // 'register' | 'success' | 'lookup' | 'admin'
  const [successData, setSuccessData] = useState(null);
  const [initialReferralCode, setInitialReferralCode] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return (params.get('ref') || params.get('code') || '').trim().toUpperCase();
    }
    return '';
  });
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [adminToken, setAdminToken] = useState(() => {
    return sessionStorage.getItem('referralpay_admin_token') || '';
  });

  // Check URL parameters for referral links e.g. /?ref=REF10001 or /?view=admin
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref') || params.get('code');
    const viewParam = params.get('view');

    if (viewParam === 'admin') {
      setCurrentView('admin');
      return;
    }

    if (refCode) {
      const cleanRef = refCode.trim().toUpperCase();
      setInitialReferralCode(cleanRef);

      // If user came with ?view=success or ?view=qr, automatically load their success screen
      if (viewParam === 'success' || viewParam === 'qr') {
        getReferralByCode(cleanRef)
          .then((res) => {
            if (res.success && res.data) {
              setSuccessData(res.data);
              setCurrentView('success');
            }
          })
          .catch(() => {
            // Keep default registration view with referral populated
            setCurrentView('register');
          });
      } else {
        // Direct referral link or QR scan -> open registration form with prefilled referral code
        setCurrentView('register');
      }
    }
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleRegistrationSuccess = (data) => {
    setSuccessData(data);
    setCurrentView('success');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('Registration complete! Your QR Code has been generated.', 'success');

    // Update browser URL query without reloading for easy bookmarking/sharing
    if (window.history.pushState && data.referralCode) {
      const newUrl = `${window.location.pathname}?view=success&code=${data.referralCode}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
    }
  };

  const handleFoundReferral = (data) => {
    setSuccessData(data);
    setCurrentView('success');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('Referral record loaded successfully!', 'success');
  };

  const handleNewRegistration = () => {
    setSuccessData(null);
    setCurrentView('register');
    // Clear URL params
    if (window.history.pushState) {
      window.history.pushState({}, '', window.location.pathname);
    }
  };

  // Admin Auth handlers
  const handleAdminLoginSuccess = (token) => {
    sessionStorage.setItem('referralpay_admin_token', token);
    setAdminToken(token);
    setCurrentView('admin');
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('referralpay_admin_token');
    setAdminToken('');
    setCurrentView('register');
    showToast('Admin logged out successfully', 'success');
  };

  return (
    <div className="app-container" style={currentView === 'admin' ? { maxWidth: '1240px' } : undefined}>
      <Header
        currentView={currentView}
        onNavigate={(view) => {
          if (view === 'register') handleNewRegistration();
          else setCurrentView(view);
        }}
      />

      <main>
        {currentView === 'register' && (
          <RegistrationForm
            onRegistrationSuccess={handleRegistrationSuccess}
            initialReferralCode={initialReferralCode}
            onShowToast={showToast}
            onOpenTerms={() => setIsTermsOpen(true)}
          />
        )}

        {currentView === 'success' && successData && (
          <SuccessPage
            data={successData}
            onNewRegistration={handleNewRegistration}
            onShowToast={showToast}
          />
        )}

        {currentView === 'lookup' && (
          <ReferralLookup
            onFoundReferral={handleFoundReferral}
            onBackToRegister={handleNewRegistration}
            onShowToast={showToast}
          />
        )}

        {currentView === 'admin' && (
          adminToken ? (
            <AdminDashboard
              token={adminToken}
              onLogout={handleAdminLogout}
              onShowToast={showToast}
            />
          ) : (
            <AdminLogin
              onLoginSuccess={handleAdminLoginSuccess}
              onBackToHome={handleNewRegistration}
              onShowToast={showToast}
            />
          )
        )}
      </main>

      {/* Footer */}
      <footer style={{ textAlign: 'center', marginTop: '48px', color: '#94a3b8', fontSize: '0.8rem' }}>
        <p>© {new Date().getFullYear()} Referral Registration System. All rights reserved.</p>
        <p style={{ marginTop: '4px', fontSize: '0.75rem' }}>
          Banking credentials protected by 256-bit AES authenticated encryption • Hosted on MongoDB Atlas
        </p>
      </footer>

      {/* Modals & Toasts */}
      <TermsModal
        isOpen={isTermsOpen}
        onClose={() => setIsTermsOpen(false)}
      />

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />
    </div>
  );
}
