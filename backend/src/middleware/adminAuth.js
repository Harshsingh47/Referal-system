import crypto from 'crypto';

/**
 * Generate a signed admin token with 7-day expiration
 * @param {string} username 
 * @returns {string} token (data.signature)
 */
export const generateAdminToken = (username) => {
  const secret = process.env.ADMIN_JWT_SECRET || process.env.ENCRYPTION_SECRET_KEY || 'admin-secret-key-sudhiska-32-chars-min!';
  const payload = JSON.stringify({
    username,
    role: 'admin',
    iat: Date.now(),
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  const encodedData = Buffer.from(payload).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(encodedData).digest('base64url');
  return `${encodedData}.${signature}`;
};

/**
 * Verify signed admin token
 * @param {string} token 
 * @returns {Object|null}
 */
export const verifyAdminToken = (token) => {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [encodedData, signature] = parts;
  const secret = process.env.ADMIN_JWT_SECRET || process.env.ENCRYPTION_SECRET_KEY || 'admin-secret-key-sudhiska-32-chars-min!';
  const expectedSig = crypto.createHmac('sha256', secret).update(encodedData).digest('base64url');

  // Constant-time comparison to prevent timing attacks
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSig);
  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedData, 'base64url').toString('utf8'));
    if (Date.now() > payload.exp) {
      return null; // Token expired
    }
    return payload;
  } catch (err) {
    return null;
  }
};

/**
 * Express middleware to protect admin routes
 */
export const requireAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers['x-admin-token'] || '';
    let token = '';

    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim();
    } else {
      token = authHeader.trim();
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Admin authorization token is required.'
      });
    }

    const payload = verifyAdminToken(token);
    if (!payload) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired admin session. Please log in again.'
      });
    }

    req.admin = payload;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};
