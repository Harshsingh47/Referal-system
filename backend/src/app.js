import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import referralRoutes from './routes/referralRoutes.js';
import { generalRateLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Security HTTP headers
app.use(helmet());

// Cross-Origin Resource Sharing configuration
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174'
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, or health checks)
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.indexOf(origin) !== -1 ||
        origin.endsWith('.vercel.app') ||
        origin.endsWith('sudhiskaenterprises.com') ||
        process.env.NODE_ENV !== 'production'
      ) {
        return callback(null, true);
      }
      return callback(new Error('Cross-Origin Request Blocked by CORS'));
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  })
);

// Body parser with size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Apply general rate limiter to all API calls
app.use(generalRateLimiter);

// Root greeting & status (only for exact root GET /)
app.get('/', (req, res, next) => {
  if (req.path === '/' || req.path === '') {
    return res.json({
      project: 'Referral Registration & QR Code Generation System API',
      version: '1.0.0',
      documentation: '/health',
      status: 'online'
    });
  }
  next();
});

// API Routes mounted at both /api and root /
app.use('/api', referralRoutes);
app.use('/', referralRoutes);

// 404 handler for unknown endpoints
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.method} ${req.originalUrl}' does not exist`
  });
});

// Centralized error handler
app.use(errorHandler);

export default app;
