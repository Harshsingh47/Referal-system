import dotenv from 'dotenv';
dotenv.config();

import assert from 'assert';
import { generateAdminToken, verifyAdminToken } from '../middleware/adminAuth.js';

console.log('🧪 Starting Admin Auth Unit Tests...');

try {
  // Test 1: Generate Admin Token
  const token = generateAdminToken('admin');
  assert(token && typeof token === 'string', 'Token must be a valid string');
  assert(token.includes('.'), 'Token must contain signature dot');
  console.log('✅ 1. generateAdminToken: PASSED');

  // Test 2: Verify valid token
  const payload = verifyAdminToken(token);
  assert(payload !== null, 'Payload must not be null');
  assert.strictEqual(payload.username, 'admin');
  assert.strictEqual(payload.role, 'admin');
  console.log('✅ 2. verifyAdminToken with valid token: PASSED');

  // Test 3: Reject tampered token
  const tamperedToken = token.slice(0, -5) + 'abcde';
  const invalidPayload = verifyAdminToken(tamperedToken);
  assert.strictEqual(invalidPayload, null, 'Tampered token must be rejected');
  console.log('✅ 3. verifyAdminToken rejects tampered signature: PASSED');

  // Test 4: Reject null / empty token
  assert.strictEqual(verifyAdminToken(''), null);
  assert.strictEqual(verifyAdminToken(null), null);
  console.log('✅ 4. verifyAdminToken rejects empty tokens: PASSED');

  console.log('\n🎉 ALL ADMIN AUTH UNIT TESTS PASSED!\n');
} catch (err) {
  console.error('❌ Test failed:', err);
  process.exit(1);
}
