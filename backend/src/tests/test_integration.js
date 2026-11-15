import assert from 'assert';
import request from 'http';
import app from '../app.js';
import { connectDB } from '../config/db.js';
import Registration from '../models/Registration.js';
import Counter from '../models/Counter.js';
import mongoose from 'mongoose';

console.log('🧪 Starting End-to-End Referral Integration Test...');

let server;
const PORT = 5055;

// Helper to make HTTP JSON requests
const makeRequest = (method, path, body = null) => {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : null;
    const req = request.request(
      {
        hostname: 'localhost',
        port: PORT,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(dataString ? { 'Content-Length': Buffer.byteLength(dataString) } : {})
        }
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode, data: JSON.parse(raw) });
          } catch (e) {
            resolve({ statusCode: res.statusCode, raw });
          }
        });
      }
    );

    req.on('error', reject);
    if (dataString) req.write(dataString);
    req.end();
  });
};

async function run() {
  await connectDB();
  // Clear any existing test data in the in-memory db
  await Registration.deleteMany({});
  await Counter.deleteMany({});

  server = app.listen(PORT);

  // Test 1: Health check
  const healthRes = await makeRequest('GET', '/api/health');
  assert.strictEqual(healthRes.statusCode, 200);
  assert.strictEqual(healthRes.data.status, 'healthy');
  console.log('✅ 1. GET /api/health endpoint: PASSED');

  // Test 2: Register User 1
  const user1 = {
    fullName: 'Aarav Patel',
    email: 'aarav.patel@example.com',
    mobileNumber: '9876543210',
    address: '42 Lotus Park, Ahmedabad',
    accountHolderName: 'Aarav Patel',
    bankName: 'HDFC Bank',
    accountNumber: '50100234567890',
    confirmAccountNumber: '50100234567890',
    ifscCode: 'HDFC0000001',
    branchName: 'Navrangpura',
    consent: true
  };

  const reg1Res = await makeRequest('POST', '/api/register', user1);
  assert.strictEqual(reg1Res.statusCode, 201, `Expected 201, got ${reg1Res.statusCode}: ${JSON.stringify(reg1Res.data)}`);
  assert(reg1Res.data.success, 'Registration must be successful');
  assert.strictEqual(reg1Res.data.data.referralCode, 'REF10001', 'First referral code must be REF10001');
  assert(reg1Res.data.data.qrCodeDataUrl.startsWith('data:image/png;base64,'), 'QR Code Data URL must be returned');
  assert.strictEqual(reg1Res.data.data.accountNumber, undefined, 'Bank account number must NEVER be exposed in response');
  assert.strictEqual(reg1Res.data.data.encryptedAccountNumber, undefined, 'Encrypted bank details must NEVER be exposed in response');
  console.log(`✅ 2. POST /api/register (User 1 -> ${reg1Res.data.data.referralCode}): PASSED`);

  // Verify in MongoDB that account number is encrypted
  const dbUser1 = await Registration.findOne({ referralCode: 'REF10001' });
  assert(dbUser1, 'User must exist in MongoDB');
  assert(dbUser1.encryptedAccountNumber.split(':').length === 3, 'Stored account number must be encrypted AES-256-GCM format');
  assert.strictEqual(dbUser1.accountNumberLast4, '7890');
  console.log('✅ 3. Database AES-256 Storage Security Verification: PASSED');

  // Test 3: Register User 2 (referred by User 1) -> Must get sequential REF10002
  const user2 = {
    fullName: 'Pooja Sharma',
    email: 'pooja.sharma@example.com',
    mobileNumber: '9123456780',
    address: '77 Brigade Road, Bengaluru',
    accountHolderName: 'Pooja Sharma',
    bankName: 'State Bank of India',
    accountNumber: '102938475610',
    confirmAccountNumber: '102938475610',
    ifscCode: 'SBIN0000123',
    referredBy: 'REF10001',
    consent: true
  };

  const reg2Res = await makeRequest('POST', '/api/register', user2);
  assert.strictEqual(reg2Res.statusCode, 201);
  assert.strictEqual(reg2Res.data.data.referralCode, 'REF10002', 'Second referral code must be REF10002');
  console.log(`✅ 4. POST /api/register (User 2 -> ${reg2Res.data.data.referralCode} with ReferredBy REF10001): PASSED`);

  // Test 4: Duplicate Email prevention
  const dupEmailUser = {
    ...user2,
    email: 'aarav.patel@example.com', // Duplicate email
    mobileNumber: '9999999999'
  };
  const dupEmailRes = await makeRequest('POST', '/api/register', dupEmailUser);
  assert.strictEqual(dupEmailRes.statusCode, 409, 'Duplicate email must return 409 Conflict');
  assert(dupEmailRes.data.message.includes('already registered'), 'Duplicate email message expected');
  console.log('✅ 5. Duplicate Email Rejection (409 Conflict): PASSED');

  // Test 5: Duplicate Mobile Number prevention
  const dupMobileUser = {
    ...user2,
    email: 'newunique@example.com',
    mobileNumber: '9876543210' // Duplicate mobile
  };
  const dupMobileRes = await makeRequest('POST', '/api/register', dupMobileUser);
  assert.strictEqual(dupMobileRes.statusCode, 409, 'Duplicate mobile must return 409 Conflict');
  assert(dupMobileRes.data.message.includes('already registered'), 'Duplicate mobile message expected');
  console.log('✅ 6. Duplicate Mobile Number Rejection (409 Conflict): PASSED');

  // Test 6: GET /api/referral/:code
  const getRefRes = await makeRequest('GET', '/api/referral/REF10001');
  assert.strictEqual(getRefRes.statusCode, 200);
  assert.strictEqual(getRefRes.data.data.referralCode, 'REF10001');
  assert.strictEqual(getRefRes.data.data.fullName, 'Aarav Patel');
  assert(getRefRes.data.data.qrCodeDataUrl.startsWith('data:image/png;base64,'));
  assert.strictEqual(getRefRes.data.data.accountNumber, undefined, 'Bank details must NEVER be exposed in public referral lookup');
  assert.strictEqual(getRefRes.data.data.mobileNumber, undefined, 'Mobile number must NEVER be exposed in public referral lookup');
  console.log('✅ 7. GET /api/referral/:code (Safe Public Lookup): PASSED');

  // Test 7: GET /api/referral/INVALID_CODE
  const notFoundRes = await makeRequest('GET', '/api/referral/NONEXISTENT999');
  assert.strictEqual(notFoundRes.statusCode, 404);
  console.log('✅ 8. GET /api/referral/404 handling: PASSED');

  console.log('\n🌟 ALL END-TO-END INTEGRATION TESTS COMPLETED SUCCESSFULLY!\n');
  server.close();
  await mongoose.connection.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('Integration test failed with error:', err);
  if (server) server.close();
  process.exit(1);
});
