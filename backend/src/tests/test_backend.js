import assert from 'assert';
import { encrypt, decrypt, maskAccountNumber } from '../utils/encryption.js';
import { validateRegistrationInput, normalizeMobileNumber, IFSC_REGEX, INDIAN_MOBILE_REGEX } from '../utils/validators.js';
import { generateQRCodeDataUrl } from '../utils/qrcode.js';

console.log('🧪 Starting Referral System Backend Self-Test...');

// 1. Encryption Test
const testAccountNumber = '123456789012';
const encrypted = encrypt(testAccountNumber);
assert(encrypted, 'Encrypted string must not be empty');
assert(encrypted.split(':').length === 3, 'Encrypted format must be iv:authTag:cipher');

const decrypted = decrypt(encrypted);
assert.strictEqual(decrypted, testAccountNumber, 'Decrypted value must match original account number');

const masked = maskAccountNumber(testAccountNumber);
assert.strictEqual(masked, '••••••••9012', 'Masked number must hide all but last 4 digits');
console.log('✅ 1. Encryption & Decryption (AES-256-GCM): PASSED');

// 2. Mobile Normalization & Regex Test
assert.strictEqual(normalizeMobileNumber('+91 98765 43210'), '9876543210');
assert.strictEqual(normalizeMobileNumber('09876543210'), '9876543210');
assert(INDIAN_MOBILE_REGEX.test('9876543210'), 'Valid Indian mobile should match');
assert(!INDIAN_MOBILE_REGEX.test('5876543210'), 'Invalid Indian mobile (starts with 5) must fail');
console.log('✅ 2. Indian Mobile Validation: PASSED');

// 3. IFSC Code Regex Test
assert(IFSC_REGEX.test('SBIN0001234'), 'SBIN0001234 should be valid IFSC');
assert(IFSC_REGEX.test('HDFC0000001'), 'HDFC0000001 should be valid IFSC');
assert(!IFSC_REGEX.test('SBIN1001234'), '5th char must be 0 in IFSC');
assert(!IFSC_REGEX.test('SBI0001234'), 'Bank prefix must be 4 characters in IFSC');
console.log('✅ 3. Indian IFSC Code Validation: PASSED');

// 4. Form Validation Test
const validFormData = {
  fullName: 'Rajesh Sharma',
  email: 'rajesh.sharma@example.com',
  mobileNumber: '+91 9876543210',
  address: '123 MG Road, Bengaluru, Karnataka',
  accountHolderName: 'Rajesh Sharma',
  bankName: 'State Bank of India',
  accountNumber: '987654321098',
  confirmAccountNumber: '987654321098',
  ifscCode: 'SBIN0001234',
  branchName: 'MG Road Branch',
  consent: true
};

const validationResult = validateRegistrationInput(validFormData);
assert(validationResult.isValid, `Validation should pass for valid payload. Errors: ${JSON.stringify(validationResult.errors)}`);
assert.strictEqual(validationResult.sanitizedData.mobileNumber, '9876543210');
console.log('✅ 4. Form Input Validation (Valid Scenario): PASSED');

// 5. Mismatched Account Numbers Validation Test
const mismatchedFormData = { ...validFormData, confirmAccountNumber: '987654321099' };
const mismatchResult = validateRegistrationInput(mismatchedFormData);
assert(!mismatchResult.isValid, 'Validation must fail when account numbers do not match');
assert(mismatchResult.errors.confirmAccountNumber, 'Must have confirmAccountNumber error');
console.log('✅ 5. Account Number Mismatch Detection: PASSED');

// 6. QR Code Generation Test
generateQRCodeDataUrl('http://localhost:5173/?ref=REF10001').then((dataUrl) => {
  assert(dataUrl.startsWith('data:image/png;base64,'), 'QR Code must be a valid PNG Data URL');
  console.log('✅ 6. Dynamic QR Code Generation: PASSED');
  console.log('\n🎉 ALL UNIT & UTILITY TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
}).catch((err) => {
  console.error('QR Code generation test failed:', err);
  process.exit(1);
});
