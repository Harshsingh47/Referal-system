const API_BASE = '/api';

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
