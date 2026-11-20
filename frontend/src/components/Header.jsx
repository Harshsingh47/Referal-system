import React, { useEffect, useState } from 'react';
import { QrCode, Shield, Search, UserPlus, Lock, LayoutDashboard } from 'lucide-react';
import { checkHealth } from '../api/client';

export default function Header({ currentView, onNavigate }) {
  const [serverOnline, setServerOnline] = useState(null);

  useEffect(() => {
    checkHealth()
      .then((res) => {
        if (res.status === 'healthy') {
          setServerOnline(true);
        }
      })
      .catch(() => {
        setServerOnline(false);
      });
  }, []);

  return (
    <header className="app-header">
      <div className="brand-wrapper" onClick={() => onNavigate('register')}>
        <div className="brand-icon">
          <QrCode size={24} />
        </div>
        <div className="brand-text">
          <h1>ReferralPay</h1>
          <p>Registration & Instant QR Generator</p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <div
          className="header-badge"
          title={serverOnline === true ? 'Backend Connected' : serverOnline === false ? 'Backend Offline' : 'Connecting...'}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: serverOnline === true ? '#10b981' : serverOnline === false ? '#f43f5e' : '#f59e0b'
            }}
          />
          <Shield size={14} color="#64748b" />
          <span>{serverOnline === true ? 'MongoDB Active' : serverOnline === false ? 'API Offline' : 'Verifying...'}</span>
        </div>

        {currentView === 'admin' ? (
          <button
            type="button"
            className="btn-secondary"
            style={{ height: '36px', padding: '0 12px', fontSize: '0.82rem' }}
            onClick={() => onNavigate('register')}
          >
            <UserPlus size={14} />
            <span>Public Registration</span>
          </button>
        ) : (
          <>
            {currentView === 'register' ? (
              <button
                type="button"
                className="btn-secondary"
                style={{ height: '36px', padding: '0 12px', fontSize: '0.82rem' }}
                onClick={() => onNavigate('lookup')}
              >
                <Search size={14} />
                <span>Find My QR</span>
              </button>
            ) : (
              <button
                type="button"
                className="btn-secondary"
                style={{ height: '36px', padding: '0 12px', fontSize: '0.82rem' }}
                onClick={() => onNavigate('register')}
              >
                <UserPlus size={14} />
                <span>New Registration</span>
              </button>
            )}

            <button
              type="button"
              className="btn-secondary"
              style={{
                height: '36px',
                padding: '0 12px',
                fontSize: '0.82rem',
                backgroundColor: '#f8fafc',
                borderColor: '#cbd5e1'
              }}
              onClick={() => onNavigate('admin')}
              title="Admin Portal - Manage registered users & referrals"
            >
              <Lock size={14} color="#475569" />
              <span>Admin</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
}
