import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, ShieldCheck, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { adminLogin } from '../../api/client';
import './admin.css';

export default function AdminLogin({ onLoginSuccess, onBackToHome, onShowToast }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim() || !password) {
      setErrorMessage('Please enter both admin username and password');
      return;
    }

    try {
      setLoading(true);
      const res = await adminLogin({
        username: username.trim(),
        password
      });

      if (res.success && res.token) {
        onShowToast?.('Admin authentication successful', 'success');
        onLoginSuccess(res.token, res.admin);
      } else {
        setErrorMessage(res.message || 'Authentication failed');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-wrapper">
      <div className="admin-login-card">
        <button
          type="button"
          onClick={onBackToHome}
          className="btn-secondary"
          style={{ height: '32px', padding: '0 10px', fontSize: '0.78rem', marginBottom: '16px' }}
        >
          <ArrowLeft size={14} />
          <span>Back to Registration</span>
        </button>

        <div className="admin-login-header">
          <div className="admin-login-icon">
            <ShieldCheck size={30} />
          </div>
          <h2>Admin Portal</h2>
          <p>Sign in to view registered partners, contact info, and manage referrals</p>
        </div>

        {errorMessage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: '10px',
              backgroundColor: '#fff1f2',
              border: '1px solid #fecdd3',
              color: '#9f1239',
              fontSize: '0.85rem',
              marginBottom: '16px'
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="form-group">
            <label className="form-label">
              Admin Username <span className="req">*</span>
            </label>
            <div className="input-with-icon">
              <User size={18} className="field-icon" />
              <input
                type="text"
                className="form-input"
                placeholder="Enter admin username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Admin Password <span className="req">*</span>
            </label>
            <div className="input-with-icon">
              <Lock size={18} className="field-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="btn-icon-field"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', height: '44px', marginTop: '8px' }}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Verifying credentials...</span>
              </>
            ) : (
              <>
                <Lock size={16} />
                <span>Sign In to Dashboard</span>
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.78rem', color: '#94a3b8' }}>
          Authorized Siddhiksha Enterprises staff only
        </div>
      </div>
    </div>
  );
}
