import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  Filter,
  Download,
  RefreshCw,
  LogOut,
  Eye,
  CheckCircle,
  Clock,
  Shield,
  Phone,
  Mail,
  Building2,
  Share2,
  Copy,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
  Lock,
  QrCode,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import {
  getAdminStats,
  getAdminRegistrations,
  getAdminRegistrationDetails,
  revealAccountNumber,
  updatePartnerStatus,
  downloadAdminCsv
} from '../../api/client';
import './admin.css';

export default function AdminDashboard({ token, onLogout, onShowToast }) {
  // Stats state
  const [stats, setStats] = useState({
    totalPartners: 0,
    todayPartners: 0,
    verifiedCount: 0,
    referredPartnersCount: 0
  });

  // Registrations state
  const [registrations, setRegistrations] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals state
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Account reveal modal state
  const [revealedAccount, setRevealedAccount] = useState(null);
  const [revealModalOpen, setRevealModalOpen] = useState(false);
  const [revealLoading, setRevealLoading] = useState(false);

  // Load stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await getAdminStats(token);
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      if (err.status === 401) {
        onLogout();
      }
    }
  }, [token, onLogout]);

  // Load registrations
  const fetchRegistrations = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const res = await getAdminRegistrations(
          {
            search: searchTerm,
            status: statusFilter,
            page,
            limit: 15
          },
          token
        );

        if (res.success) {
          setRegistrations(res.data || []);
          if (res.pagination) {
            setPagination(res.pagination);
          }
        }
      } catch (err) {
        if (err.status === 401) {
          onLogout();
        } else {
          onShowToast?.(err.message || 'Failed to load registrations', 'error');
        }
      } finally {
        setLoading(false);
      }
    },
    [token, searchTerm, statusFilter, onLogout, onShowToast]
  );

  // Initial load
  useEffect(() => {
    fetchStats();
    fetchRegistrations(1);
  }, [fetchStats, fetchRegistrations]);

  // Handle Search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRegistrations(1);
  };

  // Handle Status Filter Change
  const handleFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  // Re-fetch when filter changes
  useEffect(() => {
    fetchRegistrations(1);
  }, [statusFilter]);

  // Status update
  const handleStatusChange = async (userId, newStatus) => {
    try {
      const res = await updatePartnerStatus(userId, newStatus, token);
      if (res.success) {
        onShowToast?.(`Partner status updated to ${newStatus}`, 'success');
        // Update local state
        setRegistrations((prev) =>
          prev.map((reg) => (reg._id === userId ? { ...reg, status: newStatus } : reg))
        );
        fetchStats();
      }
    } catch (err) {
      onShowToast?.(err.message || 'Failed to update status', 'error');
    }
  };

  // Reveal Account Number
  const handleRevealAccount = async (user) => {
    try {
      setRevealLoading(true);
      setRevealModalOpen(true);
      const res = await revealAccountNumber(user._id, token);
      if (res.success) {
        setRevealedAccount({
          user,
          accountNumber: res.accountNumber,
          bankName: res.bankName || user.bankName
        });
      }
    } catch (err) {
      onShowToast?.(err.message || 'Failed to decrypt account number', 'error');
      setRevealModalOpen(false);
    } finally {
      setRevealLoading(false);
    }
  };

  // View full details modal
  const handleViewDetails = async (userId) => {
    try {
      setDetailLoading(true);
      setDetailModalOpen(true);
      const res = await getAdminRegistrationDetails(userId, token);
      if (res.success && res.data) {
        setSelectedUser(res.data);
      }
    } catch (err) {
      onShowToast?.(err.message || 'Failed to load details', 'error');
      setDetailModalOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  // Export CSV
  const handleExportCsv = async () => {
    try {
      setExporting(true);
      await downloadAdminCsv(token);
      onShowToast?.('Registrations CSV exported successfully', 'success');
    } catch (err) {
      onShowToast?.(err.message || 'Failed to export CSV', 'error');
    } finally {
      setExporting(false);
    }
  };

  // Copy helper
  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    onShowToast?.(`${label} copied to clipboard!`, 'success');
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="admin-wrapper">
      {/* Top Bar */}
      <div className="admin-topbar">
        <div className="admin-topbar-title">
          <div className="admin-topbar-icon">
            <Shield size={24} />
          </div>
          <div>
            <h2>Partner & User Management</h2>
            <p>Admin panel • Siddhiksha Enterprises Referral System</p>
          </div>
        </div>

        <div className="admin-topbar-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              fetchStats();
              fetchRegistrations(pagination.page);
            }}
            disabled={loading}
            title="Refresh records"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={handleExportCsv}
            disabled={exporting}
            style={{ color: '#059669', borderColor: '#a7f3d0', backgroundColor: '#ecfdf5' }}
          >
            <Download size={15} />
            <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={onLogout}
            style={{ color: '#e11d48', borderColor: '#fecdd3' }}
            title="Sign out from Admin Panel"
          >
            <LogOut size={15} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Analytics Stats Grid */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrap admin-stat-icon-blue">
            <Users size={22} />
          </div>
          <div className="admin-stat-info">
            <h4>Total Registered</h4>
            <div className="stat-number">{stats.totalPartners}</div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrap admin-stat-icon-green">
            <Calendar size={22} />
          </div>
          <div className="admin-stat-info">
            <h4>Registered Today</h4>
            <div className="stat-number">{stats.todayPartners}</div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrap admin-stat-icon-purple">
            <CheckCircle size={22} />
          </div>
          <div className="admin-stat-info">
            <h4>Verified Partners</h4>
            <div className="stat-number">{stats.verifiedCount}</div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrap admin-stat-icon-amber">
            <Share2 size={22} />
          </div>
          <div className="admin-stat-info">
            <h4>Via Referral Code</h4>
            <div className="stat-number">{stats.referredPartnersCount}</div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="admin-card">
        {/* Controls Header */}
        <div className="admin-card-header">
          <form onSubmit={handleSearchSubmit} className="admin-search-wrap">
            <Search size={16} className="admin-search-icon" />
            <input
              type="text"
              className="admin-search-input"
              placeholder="Search by name, email, phone, referral code, bank..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </form>

          <div className="admin-filter-group">
            <select className="admin-select" value={statusFilter} onChange={handleFilterChange}>
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Partner Name & ID</th>
                <th>Contact Info</th>
                <th>Referral Details</th>
                <th>Banking Details</th>
                <th>Status</th>
                <th>Registered On</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && registrations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-state">
                    <RefreshCw size={28} className="animate-spin" />
                    <p style={{ marginTop: 8 }}>Loading registered partners...</p>
                  </td>
                </tr>
              ) : registrations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-state">
                    <Users size={32} />
                    <p style={{ fontWeight: 600, color: '#334155', fontSize: '1rem' }}>No registered users found</p>
                    <p style={{ fontSize: '0.82rem', marginTop: 4 }}>
                      {searchTerm ? 'Try adjusting your search criteria' : 'New registrations will appear here'}
                    </p>
                  </td>
                </tr>
              ) : (
                registrations.map((user) => (
                  <tr key={user._id}>
                    {/* User Meta */}
                    <td>
                      <div className="user-meta-cell">
                        <span className="user-full-name">{user.fullName}</span>
                        <span className="user-reg-id">{user.registrationId}</span>
                      </div>
                    </td>

                    {/* Contact Info */}
                    <td>
                      <div className="contact-meta-cell">
                        <div className="contact-item">
                          <Mail size={13} color="#64748b" />
                          <a href={`mailto:${user.email}`}>{user.email}</a>
                          <button
                            type="button"
                            className="btn-reveal-acc"
                            onClick={() => copyToClipboard(user.email, 'Email')}
                            title="Copy email"
                          >
                            <Copy size={11} />
                          </button>
                        </div>
                        <div className="contact-item">
                          <Phone size={13} color="#64748b" />
                          <a href={`tel:${user.mobileNumber}`}>+91 {user.mobileNumber}</a>
                          <button
                            type="button"
                            className="btn-reveal-acc"
                            onClick={() => copyToClipboard(user.mobileNumber, 'Mobile')}
                            title="Copy mobile number"
                          >
                            <Copy size={11} />
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Referral Details */}
                    <td>
                      <div>
                        <span
                          className="referral-pill"
                          onClick={() => copyToClipboard(user.referralCode, 'Referral code')}
                          title="Click to copy referral code"
                          style={{ cursor: 'pointer' }}
                        >
                          {user.referralCode}
                          <Copy size={11} />
                        </span>
                        {user.referredBy && (
                          <div className="referred-by-label">Referred by: {user.referredBy}</div>
                        )}
                      </div>
                    </td>

                    {/* Banking Details */}
                    <td>
                      <div className="bank-meta-cell">
                        <span className="bank-name">{user.bankName}</span>
                        <div className="bank-acc-masked">
                          <span>{user.accountNumberMasked}</span>
                          <button
                            type="button"
                            className="btn-reveal-acc"
                            onClick={() => handleRevealAccount(user)}
                            title="Reveal full account number"
                          >
                            <Eye size={13} />
                          </button>
                        </div>
                        <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>IFSC: {user.ifscCode}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td>
                      <select
                        className={`status-badge ${user.status}`}
                        value={user.status}
                        onChange={(e) => handleStatusChange(user._id, e.target.value)}
                        style={{ cursor: 'pointer', border: 'none', outline: 'none' }}
                      >
                        <option value="active">Active</option>
                        <option value="verified">Verified</option>
                        <option value="pending">Pending</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </td>

                    {/* Date */}
                    <td>
                      <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                        {formatDate(user.registrationDate)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="admin-actions-cell" style={{ justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn-action-icon view"
                          onClick={() => handleViewDetails(user._id)}
                          title="View complete partner dossier & QR code"
                        >
                          <QrCode size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pagination.pages > 1 && (
          <div className="admin-pagination">
            <div>
              Showing {registrations.length} of {pagination.total} registrations (Page {pagination.page} of{' '}
              {pagination.pages})
            </div>
            <div className="admin-pagination-btns">
              <button
                type="button"
                className="btn-page"
                onClick={() => fetchRegistrations(pagination.page - 1)}
                disabled={pagination.page <= 1 || loading}
              >
                <ChevronLeft size={14} style={{ verticalAlign: 'middle' }} /> Previous
              </button>
              <button
                type="button"
                className="btn-page"
                onClick={() => fetchRegistrations(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages || loading}
              >
                Next <ChevronRight size={14} style={{ verticalAlign: 'middle' }} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --------------------------------------------------------
          DETAIL DOSSIER & QR CODE MODAL
         -------------------------------------------------------- */}
      {detailModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setDetailModalOpen(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Partner Details & QR Code</h3>
              <button
                type="button"
                className="btn-action-icon"
                onClick={() => setDetailModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="admin-modal-body">
              {detailLoading || !selectedUser ? (
                <div className="empty-state">
                  <RefreshCw size={24} className="animate-spin" />
                  <p style={{ marginTop: 8 }}>Loading partner record...</p>
                </div>
              ) : (
                <>
                  {/* QR Code Presentation */}
                  {selectedUser.qrCodeDataUrl && (
                    <div style={{ textAlign: 'center', padding: '16px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <img
                        src={selectedUser.qrCodeDataUrl}
                        alt="Partner Referral QR"
                        style={{
                          width: '180px',
                          height: '180px',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          padding: '8px',
                          backgroundColor: '#ffffff'
                        }}
                      />
                      <div style={{ marginTop: '8px' }}>
                        <span className="referral-pill" style={{ fontSize: '0.9rem' }}>
                          {selectedUser.referralCode}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '6px' }}>
                        Referrals Generated: <strong>{selectedUser.referralsCount || 0}</strong>
                      </p>
                    </div>
                  )}

                  {/* Personal Info */}
                  <div className="admin-detail-section">
                    <div className="admin-detail-title">Personal Information</div>
                    <div className="admin-detail-grid">
                      <div className="admin-detail-item">
                        <span className="label">Full Name</span>
                        <span className="val">{selectedUser.fullName}</span>
                      </div>
                      <div className="admin-detail-item">
                        <span className="label">Registration ID</span>
                        <span className="val" style={{ fontFamily: 'var(--font-mono)' }}>
                          {selectedUser.registrationId}
                        </span>
                      </div>
                      <div className="admin-detail-item">
                        <span className="label">Email Address</span>
                        <span className="val">{selectedUser.email}</span>
                      </div>
                      <div className="admin-detail-item">
                        <span className="label">Mobile Number</span>
                        <span className="val">+91 {selectedUser.mobileNumber}</span>
                      </div>
                      <div className="admin-detail-item full-width">
                        <span className="label">Address</span>
                        <span className="val">{selectedUser.address || 'Not specified'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Banking Info */}
                  <div className="admin-detail-section">
                    <div className="admin-detail-title">Banking Information</div>
                    <div className="admin-detail-grid">
                      <div className="admin-detail-item">
                        <span className="label">Account Holder</span>
                        <span className="val">{selectedUser.accountHolderName}</span>
                      </div>
                      <div className="admin-detail-item">
                        <span className="label">Bank Name</span>
                        <span className="val">{selectedUser.bankName}</span>
                      </div>
                      <div className="admin-detail-item">
                        <span className="label">Account Number</span>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span className="val">{selectedUser.accountNumberMasked}</span>
                          <button
                            type="button"
                            className="btn-reveal-acc"
                            onClick={() => {
                              setDetailModalOpen(false);
                              handleRevealAccount(selectedUser);
                            }}
                          >
                            <Eye size={14} /> Reveal
                          </button>
                        </div>
                      </div>
                      <div className="admin-detail-item">
                        <span className="label">IFSC Code</span>
                        <span className="val">{selectedUser.ifscCode}</span>
                      </div>
                      <div className="admin-detail-item full-width">
                        <span className="label">Branch Name</span>
                        <span className="val">{selectedUser.branchName || 'Not specified'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Referral Link */}
                  {(selectedUser.referralUrl || selectedUser.referralCode) && (
                    <div className="admin-detail-section">
                      <div className="admin-detail-title">Public Referral URL</div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          background: '#f8fafc',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          border: '1px solid #e2e8f0',
                          fontSize: '0.82rem',
                          wordBreak: 'break-all'
                        }}
                      >
                        <span style={{ flex: 1, color: '#2563eb' }}>
                          {selectedUser.referralUrl && !selectedUser.referralUrl.includes('backend-one-rho-96')
                            ? selectedUser.referralUrl
                            : `${window.location.origin}/?ref=${selectedUser.referralCode}`}
                        </span>
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ height: '30px', padding: '0 8px', fontSize: '0.75rem' }}
                          onClick={() => {
                            const link =
                              selectedUser.referralUrl && !selectedUser.referralUrl.includes('backend-one-rho-96')
                                ? selectedUser.referralUrl
                                : `${window.location.origin}/?ref=${selectedUser.referralCode}`;
                            copyToClipboard(link, 'Referral link');
                          }}
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------
          SECURE ACCOUNT REVEAL MODAL
         -------------------------------------------------------- */}
      {revealModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setRevealModalOpen(false)}>
          <div className="admin-modal" style={{ maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={18} color="#d97706" />
                <h3 style={{ fontSize: '1.05rem' }}>Decrypted Bank Account</h3>
              </div>
              <button
                type="button"
                className="btn-action-icon"
                onClick={() => setRevealModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="admin-modal-body">
              {revealLoading || !revealedAccount ? (
                <div className="empty-state">
                  <RefreshCw size={24} className="animate-spin" />
                  <p style={{ marginTop: 8 }}>Decrypting account number with AES-256-GCM...</p>
                </div>
              ) : (
                <>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      padding: '10px 12px',
                      background: '#fffbeb',
                      borderRadius: '8px',
                      border: '1px solid #fde68a',
                      fontSize: '0.78rem',
                      color: '#92400e'
                    }}
                  >
                    <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>
                      Confidential Banking Record. This account number has been decrypted on-demand from AES-256 storage for authorized admin verification.
                    </span>
                  </div>

                  <div className="admin-revealed-box">
                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                      {revealedAccount.user?.fullName} • {revealedAccount.bankName}
                    </span>
                    <div className="admin-revealed-number">{revealedAccount.accountNumber}</div>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ margin: '0 auto', height: '34px', fontSize: '0.8rem' }}
                      onClick={() => copyToClipboard(revealedAccount.accountNumber, 'Account number')}
                    >
                      <Copy size={13} />
                      <span>Copy Account Number</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
