# Referral Registration & QR Code Generation System

A modern, responsive, secure full-stack Referral Registration System built with **React.js**, **Node.js + Express.js**, and **MongoDB Atlas**.

The system enables users to register their personal and bank account details. Upon successful registration, the backend automatically generates a sequential, unique referral code (e.g., `REF10001`, `REF10002`) and dynamic, downloadable QR code for seamless referral sharing.

---

## 🚀 Key Features

- **Personal & Banking Registration**: Validated collection of personal details (Full Name, Email, Indian Mobile Number, Residential Address) and verified banking details (Account Holder Name, Bank Name, Account Number, Confirm Account Number, IFSC Code, Branch Name).
- **Automatic Sequential Referral Code Generation**: Server-side atomic counter generating readable sequential codes (`REF10001`, `REF10002`...) guaranteeing zero duplicates even under concurrent registrations.
- **Dynamic QR Code Generation**: Instant high-resolution QR code generation using the `qrcode` package, pointing to the user's personal referral URL (`https://yourdomain.com/?ref=REF10001`).
- **AES-256 Bank-Grade Encryption**: Bank account numbers are encrypted at rest using **AES-256-GCM** before saving to MongoDB Atlas. Decryption keys are stored exclusively in environment variables.
- **Dedicated Registration Success Screen**: Displays the user's name, unique referral code, generated QR code, one-click copy buttons (code and link), direct PNG download, and social share links (WhatsApp & Email).
- **Referral Code Lookup**: Users can retrieve their referral card and QR code anytime by entering their referral code, without re-submitting the form.
- **Referral Attribution**: Automatically detects `?ref=REF10001` in the URL, attributes the new user to their referrer, and displays a friendly referrer confirmation badge.
- **Duplicate Prevention**: Enforces database-level and application-level unique constraints on Email, Mobile Number, and Referral Code.
- **Robust Security**: Rate limiting with `express-rate-limit`, secure HTTP headers with `helmet`, CORS protection, and strict input validation.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, Lucide Icons, Canvas Confetti, Modern CSS3 |
| **Backend** | Node.js (v22+), Express.js (v4.21+), Mongoose (v8+) |
| **Database** | MongoDB Atlas (with in-memory fallback for immediate zero-config dev/testing) |
| **QR Generation** | `qrcode` (npm) |
| **Encryption** | Node.js `crypto` (AES-256-GCM authenticated encryption) |
| **Security** | `helmet`, `express-rate-limit`, `cors`, `validator` |

---

## 📂 Project Structure

```
Refferal System/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js               # MongoDB Atlas connection & auto-fallback
│   │   ├── controllers/
│   │   │   └── referralController.js # Registration & public referral retrieval
│   │   ├── middleware/
│   │   │   ├── errorHandler.js     # Centralized error handler
│   │   │   └── rateLimiter.js      # Anti-spam & DDoS protection
│   │   ├── models/
│   │   │   ├── Counter.js          # Atomic sequence counter for collision-free codes
│   │   │   └── Registration.js     # User registration schema (with encrypted bank details)
│   │   ├── routes/
│   │   │   └── referralRoutes.js   # POST /api/register, GET /api/referral/:code, GET /api/health
│   │   ├── tests/
│   │   │   ├── test_backend.js     # Unit test suite
│   │   │   └── test_integration.js # End-to-end integration test suite
│   │   ├── utils/
│   │   │   ├── encryption.js       # AES-256-GCM cipher/decipher & account masking
│   │   │   ├── qrcode.js           # QR code PNG generation
│   │   │   └── validators.js       # Indian mobile, IFSC, and bank account validators
│   │   ├── app.js                  # Express application setup
│   │   └── server.js               # Server bootstrap & process lifecycle
│   ├── .env.example
│   ├── .env
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── qr-icon.svg             # Favicon
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js           # REST API client
│   │   ├── components/
│   │   │   ├── Header.jsx          # Top navigation with live backend status
│   │   │   ├── InputField.jsx      # Reusable form field with error/valid states
│   │   │   ├── RegistrationForm.jsx# Full registration form with real-time validation
│   │   │   ├── SuccessPage.jsx     # Registration success screen with QR & copy actions
│   │   │   ├── ReferralLookup.jsx  # Lookup screen for existing referral codes
│   │   │   ├── TermsModal.jsx      # Privacy policy & consent modal
│   │   │   └── Toast.jsx           # Notification toast component
│   │   ├── App.jsx                 # Main application state & view routing
│   │   ├── index.css               # Complete responsive CSS design system
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── .env.example
│   └── package.json
│
├── package.json                    # Root package with multi-service runner
├── .env.example
└── README.md
```

---

## ⚙️ Quick Start & Installation

### 1. Prerequisites
- **Node.js** v18+ (tested on Node v22.22.2)
- **NPM** v9+
- Optional: MongoDB Atlas account (free M0 cluster)

### 2. Install All Dependencies
From the project root directory, run:
```bash
npm run install:all
```
*(Or install manually in `backend` and `frontend` using `npm install`)*

### 3. Environment Variables Setup
Copy the `.env.example` in `backend/` to `backend/.env`:
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Set your MongoDB Atlas connection string:
# Format: mongodb+srv://<username>:<password>@cluster0.mongodb.net/referral_system?retryWrites=true&w=majority
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/referral_system?retryWrites=true&w=majority

# 32-byte / 64-hex AES-256 secret key
ENCRYPTION_SECRET_KEY=c4a8b79e13d96e57209930f342f0e0811e5f381ad7940251783457a44f22031a
```

> **Note on Zero-Config Dev Mode:** If `MONGODB_URI` is not set or has placeholder credentials, the backend automatically starts an in-memory MongoDB database instance (`mongodb-memory-server`) so you can test all features immediately without any setup! Once ready, simply paste your real MongoDB Atlas URI into `backend/.env`.

---

## 🏃 Running the Application

### Option A: Run Both Backend & Frontend Simultaneously (Recommended)
From the root directory:
```bash
npm run dev
```
- **Backend API**: `http://localhost:5000`
- **Frontend Web UI**: `http://localhost:5173`

### Option B: Run Services Individually

**Terminal 1 (Backend):**
```bash
npm run dev:backend
```

**Terminal 2 (Frontend):**
```bash
npm run dev:frontend
```

---

## 🧪 Testing

The system includes automated unit tests and integration tests.

### Run Unit Tests
Verifies AES-256 encryption, Indian mobile validation, IFSC regex format, input sanitization, and QR code data URL generation:
```bash
cd backend
node src/tests/test_backend.js
```

### Run End-to-End Integration Tests
Starts an in-memory test database and verifies the full workflow:
- `GET /api/health`
- `POST /api/register` with atomic `REF10001` generation
- Database AES-256 storage verification
- Sequential `REF10002` referral code generation
- Duplicate email rejection (409 Conflict)
- Duplicate mobile number rejection (409 Conflict)
- Safe public lookup via `GET /api/referral/:code`
- 404 handling

```bash
cd backend
node src/tests/test_integration.js
```

---

## 📡 REST API Reference

### 1. Register User & Generate Referral + QR Code
- **URL**: `POST /api/register`
- **Rate Limit**: 15 requests / 15 mins per IP
- **Payload**:
```json
{
  "fullName": "Rajesh Sharma",
  "email": "rajesh.sharma@example.com",
  "mobileNumber": "9876543210",
  "address": "123 MG Road, Bengaluru",
  "accountHolderName": "Rajesh Sharma",
  "bankName": "State Bank of India",
  "accountNumber": "987654321098",
  "confirmAccountNumber": "987654321098",
  "ifscCode": "SBIN0001234",
  "branchName": "MG Road",
  "referredBy": "REF10001",
  "consent": true
}
```
- **Success Response (201 Created)**:
```json
{
  "success": true,
  "message": "Registration completed successfully! Your unique referral code and QR code have been generated.",
  "data": {
    "registrationId": "REG-10001-A1F2",
    "fullName": "Rajesh Sharma",
    "email": "rajesh.sharma@example.com",
    "mobileNumber": "9876543210",
    "referralCode": "REF10001",
    "referralUrl": "http://localhost:5173/?ref=REF10001",
    "qrCodeDataUrl": "data:image/png;base64,iVBORw0KGgo...",
    "registrationDate": "2026-11-15T17:00:00.000Z",
    "status": "active"
  }
}
```
*(Notice: Bank account details are encrypted in the database and strictly omitted from all API responses).*

---

### 2. Retrieve Public Referral Info & Dynamic QR Code
- **URL**: `GET /api/referral/:code`
- **Example**: `GET /api/referral/REF10001`
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "registrationId": "REG-10001-A1F2",
    "referralCode": "REF10001",
    "fullName": "Rajesh Sharma",
    "referralUrl": "http://localhost:5173/?ref=REF10001",
    "qrCodeDataUrl": "data:image/png;base64,iVBORw0KGgo...",
    "registrationDate": "2026-11-15T17:00:00.000Z",
    "status": "active"
  }
}
```

---

### 3. Check / Validate Referral Code
- **URL**: `GET /api/referral/check/:code`
- **Example**: `GET /api/referral/check/REF10001`
- **Response**:
```json
{
  "valid": true,
  "referralCode": "REF10001",
  "referrerName": "Rajesh Sharma"
}
```

---

### 4. Health Check
- **URL**: `GET /api/health`
- **Response**:
```json
{
  "status": "healthy",
  "timestamp": "2026-11-15T17:00:00.000Z",
  "database": "connected",
  "uptime": 120
}
```

---

## 🔒 Security Architecture

1. **AES-256-GCM Encryption**:
   - Bank account numbers are encrypted at the model/controller boundary using 256-bit AES authenticated encryption (AES-256-GCM) with an initialization vector (IV) and authentication tag.
   - Raw account numbers are never persisted anywhere in plain text.
2. **Strict Field Blacklisting**:
   - Mongoose schema `toJSON` transform automatically strips `encryptedAccountNumber`, internal hashes, and version fields.
3. **No Private Data in QR Codes**:
   - The generated QR code exclusively encodes the public referral URL (e.g. `https://yourwebsite.com/?ref=REF10001`). No personal identity or banking data is stored in the QR image.
4. **Rate Limiting & Anti-Abuse**:
   - `express-rate-limit` prevents registration bot floods and brute force enumeration.
5. **Security HTTP Headers**:
   - Helmet sets HTTP headers (`Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`) against common web vulnerabilities.
6. **Unique Constraints**:
   - MongoDB unique indexes on `email`, `mobileNumber`, and `referralCode` prevent collisions.

---

## 🔮 Future Scalability

The database schema and architecture are pre-configured to easily support upcoming features:
- `referredBy` tracking for multi-tier referral trees.
- `registrationStatus` lifecycle management (`active`, `pending`, `verified`, `suspended`).
- Extensible schema for referral analytics, commission calculation, and user dashboards.
