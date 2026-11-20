const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');

/**
 * Perform a JSON API request with error normalization
 */
async function apiRequest(endpoint, options = {}) {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const result = await response.json().catch(() => ({
      success: false,
      message: `Server returned ${response.status}: ${response.statusText}`
    }));

    if (!response.ok) {
      const error = new Error(result.message || 'Request failed');
      error.status = response.status;
      error.data = result;
      error.field = result.field;
      error.errors = result.errors;
      throw error;
    }

    return result;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Unable to connect to the backend server. Please verify backend is running on port 5000.');
    }
    throw err;
  }
}

/**
 * Submit user registration
 * @param {Object} formData
 */
export async function registerUser(formData) {
  return apiRequest('/register', {
    method: 'POST',
    body: JSON.stringify(formData)
  });
}

/**
 * Retrieve public referral information by referral code
 * @param {string} code
 */
export async function getReferralByCode(code) {
  return apiRequest(`/referral/${encodeURIComponent(code)}`, {
    method: 'GET'
  });
}

/**
 * Check if a referral code exists (for auto-filling referred by)
 * @param {string} code
 */
export async function checkReferralCode(code) {
  return apiRequest(`/referral/check/${encodeURIComponent(code)}`, {
    method: 'GET'
  });
}

/**
 * Check backend health
 */
export async function checkHealth() {
  return apiRequest('/health', {
    method: 'GET'
  });
}

// ==========================================
// ADMIN API CLIENT FUNCTIONS
// ==========================================

/**
 * Authenticate admin
 * @param {Object} credentials { username, password }
 */
export async function adminLogin({ username, password }) {
  return apiRequest('/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
}

/**
 * Get overall dashboard analytics
 * @param {string} token
 */
export async function getAdminStats(token) {
  return apiRequest('/admin/stats', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

/**
 * Fetch registrations with search, filter, and pagination
 * @param {Object} params { search, status, page, limit }
 * @param {string} token
 */
export async function getAdminRegistrations({ search = '', status = 'all', page = 1, limit = 25 } = {}, token) {
  const queryParams = new URLSearchParams();
  if (search) queryParams.set('search', search.trim());
  if (status && status !== 'all') queryParams.set('status', status);
  if (page) queryParams.set('page', page);
  if (limit) queryParams.set('limit', limit);

  const queryStr = queryParams.toString();
  return apiRequest(`/admin/registrations${queryStr ? `?${queryStr}` : ''}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

/**
 * Get detailed partner information including QR code and referral count
 * @param {string} id Registration MongoDB _id
 * @param {string} token
 */
export async function getAdminRegistrationDetails(id, token) {
  return apiRequest(`/admin/registrations/${id}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

/**
 * Securely decrypt and reveal full bank account number
 * @param {string} id Registration MongoDB _id
 * @param {string} token
 */
export async function revealAccountNumber(id, token) {
  return apiRequest(`/admin/registrations/${id}/account-number`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

/**
 * Update partner status (active, verified, pending, suspended)
 * @param {string} id Registration MongoDB _id
 * @param {string} status
 * @param {string} token
 */
export async function updatePartnerStatus(id, status, token) {
  return apiRequest(`/admin/registrations/${id}/status`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ status })
  });
}

/**
 * Download CSV export of all registrations
 * @param {string} token
 */
export async function downloadAdminCsv(token) {
  const response = await fetch(`${API_BASE}/admin/export`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`Export failed with status: ${response.status}`);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `registrations_export_${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
  return true;
}
