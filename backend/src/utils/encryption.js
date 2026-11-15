import crypto from 'crypto';

// Ensure 32-byte key derived from secret
const getEncryptionKey = () => {
  const secret = process.env.ENCRYPTION_SECRET_KEY || 'default-secret-referral-system-key-change-in-prod-32bytes!';
  return crypto.createHash('sha256').update(secret).digest();
};

/**
 * Encrypt a string using AES-256-GCM (military-grade authenticated encryption)
 * @param {string} text - Plain text (e.g. bank account number)
 * @returns {string} - Combined string format: iv:authTag:encryptedData (hex encoded)
 */
export const encrypt = (text) => {
  if (!text) return null;
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16); // 128-bit IV
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(String(text), 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};

/**
 * Decrypt an encrypted string using AES-256-GCM
 * @param {string} encryptedString - Format: iv:authTag:encryptedData
 * @returns {string} - Decrypted plain text
 */
export const decrypt = (encryptedString) => {
  if (!encryptedString) return null;
  try {
    const parts = encryptedString.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const [ivHex, authTagHex, encryptedDataHex] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedDataHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (err) {
    console.error('Decryption failed:', err.message);
    return null;
  }
};

/**
 * Mask an account number for safe internal display (e.g. ••••••••1234)
 * @param {string} accountNumber 
 * @returns {string}
 */
export const maskAccountNumber = (accountNumber) => {
  if (!accountNumber) return '';
  const str = String(accountNumber);
  if (str.length <= 4) return '••••'.slice(0, str.length);
  const last4 = str.slice(-4);
  return '•'.repeat(Math.min(str.length - 4, 8)) + last4;
};
